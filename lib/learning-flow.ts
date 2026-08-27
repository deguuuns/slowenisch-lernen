import { isVerbFormVocabularyId } from '@/lib/curriculum-access'
import { enrichExercises } from '@/lib/curriculum-metadata'
import { isStrictlyAssessableExercise } from '@/lib/exercise-integrity'
import { LEARNING_FLOW_CONFIG } from '@/lib/learning-config'
import { MICRO_LEARNING_CYCLE, phaseForExercise } from '@/lib/learning-cycle'
import { exerciseSemanticFingerprint, exerciseSurfaceFingerprint, inferTargetContentKeys, withTargetMetadata } from '@/lib/learning-targets'
import { Exercise, TargetContentKey, Vocabulary } from '@/types'

export const NEW_WORDS_PER_BLOCK = LEARNING_FLOW_CONFIG.newWordsPerBlock
export const EXERCISES_PER_BLOCK = LEARNING_FLOW_CONFIG.exercisesPerBlock
export const MIN_RECALL_GAP_TASKS = LEARNING_FLOW_CONFIG.minRecallGapTasks

export type LearningBlock = { id:string; words:Vocabulary[]; exercises:Exercise[] }

function distractors(word:Vocabulary,lessonWords:Vocabulary[]){
  return lessonWords.filter(item=>item.id!==word.id&&item.partOfSpeech===word.partOfSpeech).concat(lessonWords.filter(item=>item.id!==word.id)).map(item=>item.de).filter(value=>value!==word.de).filter((value,index,all)=>all.indexOf(value)===index).slice(0,3)
}

export function isConjugatedVerbVocabulary(word:Vocabulary){return word.partOfSpeech==='Verb'&&isVerbFormVocabularyId(word.id)}

export function generatedExercisesForWord(word:Vocabulary,lessonWords:Vocabulary[]):Exercise[]{
  if(isConjugatedVerbVocabulary(word))return []
  const target=[`vocab:${word.id}` as TargetContentKey],generated:Exercise[]=[],choices=distractors(word,lessonWords)
  if(choices.length>=2)generated.push({id:`gen-recognize-${word.id}`,lesson:word.lesson,type:'choice',prompt:`Was bedeutet „${word.sl}“?`,answer:word.de,alternatives:choices,vocabularyIds:[word.id],grammarRuleIds:[],evaluationMode:'exact',skillTargets:['recognition'],difficulty:'easy',generated:true,responseScope:'fixed',targetContentKeys:target,prerequisites:word.prerequisites||[],learningPhase:'recognize'})
  generated.push({id:`gen-produce-${word.id}`,lesson:word.lesson,type:'translate-de-sl',prompt:`Auf Slowenisch: ${word.de}`,answer:word.sl,vocabularyIds:[word.id],grammarRuleIds:[],evaluationMode:'acceptedVariants',skillTargets:['production'],difficulty:'easy',generated:true,responseScope:'fixed',targetContentKeys:target,prerequisites:word.prerequisites||[],learningPhase:'active-production'})
  return generated
}

function usesOnly(exercise:Exercise,ids:Set<string>){const vocabularyIds=exercise.vocabularyIds||[];return vocabularyIds.length>0&&vocabularyIds.every(id=>ids.has(id))}
function containsAny(exercise:Exercise,ids:Set<string>){return (exercise.vocabularyIds||[]).some(id=>ids.has(id))}
function phaseIndex(exercise:Exercise){const phase=phaseForExercise(exercise),index=MICRO_LEARNING_CYCLE.indexOf(phase);return index<0?MICRO_LEARNING_CYCLE.length:index}

export function orderExercisesByLearningCycle(exercises:Exercise[]){
  return [...exercises].sort((a,b)=>{const phaseDifference=phaseIndex(a)-phaseIndex(b);if(phaseDifference)return phaseDifference;const difficulty={intro:0,easy:1,normal:2,challenge:3};return (difficulty[a.difficulty||'normal']??2)-(difficulty[b.difficulty||'normal']??2)})
}

function dedupeByTargetAndPhase(exercises:Exercise[],limit:number,usedSemantic:Set<string>,usedSurface:Set<string>){
  const usedTargetPhase=new Set<string>(),selected:Exercise[]=[]
  for(const exercise of exercises){
    const targets=inferTargetContentKeys(exercise),phase=phaseForExercise(exercise),targetPhase=targets.length?`${targets.slice().sort().join('|')}::${phase}`:`${exercise.id}::${phase}`
    const semantic=exerciseSemanticFingerprint(exercise),surface=exerciseSurfaceFingerprint(exercise)
    if(usedTargetPhase.has(targetPhase)||usedSemantic.has(semantic)||usedSurface.has(surface))continue
    selected.push(withTargetMetadata(exercise));usedTargetPhase.add(targetPhase);usedSemantic.add(semantic);usedSurface.add(surface)
    if(selected.length>=limit)break
  }
  return selected
}

function vocabularyPrerequisites(word:Vocabulary){return (word.prerequisites||[]).filter(key=>key.startsWith('vocab:')).map(key=>key.slice(6))}

export function orderVocabularyByPrerequisites(words:Vocabulary[],alreadyKnown:string[]=[]){
  const remaining=[...words].sort((a,b)=>(a.sequence??9999)-(b.sequence??9999)||(a.priority||5)-(b.priority||5)||a.id.localeCompare(b.id)),known=new Set(alreadyKnown),ordered:Vocabulary[]=[]
  while(remaining.length){
    const index=remaining.findIndex(word=>vocabularyPrerequisites(word).every(id=>known.has(id)||!words.some(candidate=>candidate.id===id)))
    const next=remaining.splice(index>=0?index:0,1)[0];ordered.push(next);known.add(next.id)
  }
  return ordered
}

function orderBatchExercises(currentWords:Vocabulary[],priorAvailable:Set<string>,curated:Exercise[],lessonWords:Vocabulary[],limit:number,usedSemantic:Set<string>,usedSurface:Set<string>){
  const currentIds=new Set(currentWords.map(word=>word.id)),allAvailable=new Set([...Array.from(priorAvailable),...Array.from(currentIds)])
  const contextual=curated.filter(isStrictlyAssessableExercise).filter(exercise=>usesOnly(exercise,allAvailable)&&containsAny(exercise,currentIds)).filter(exercise=>(exercise.prerequisites||[]).filter(key=>key.startsWith('vocab:')).every(key=>allAvailable.has(key.slice(6)))).map(withTargetMetadata)
  const generated=currentWords.flatMap(word=>generatedExercisesForWord(word,lessonWords))
  const knownWarmup=curated.filter(isStrictlyAssessableExercise).filter(exercise=>usesOnly(exercise,priorAvailable)&&!containsAny(exercise,currentIds)).slice(-1).map(withTargetMetadata).map(exercise=>({...exercise,learningPhase:exercise.learningPhase||'variation' as const}))
  return dedupeByTargetAndPhase(orderExercisesByLearningCycle([...generated,...contextual,...knownWarmup]),limit,usedSemantic,usedSurface)
}

export function buildLearningBlocks(lessonId:number,vocabulary:Vocabulary[],rawExercises:Exercise[],introducedWordIds:string[],size:number=NEW_WORDS_PER_BLOCK):LearningBlock[]{
  const lessonWords=orderVocabularyByPrerequisites(vocabulary.filter(word=>word.lesson===lessonId),introducedWordIds),unseen=lessonWords.filter(word=>!introducedWordIds.includes(word.id)),curated=enrichExercises(rawExercises).filter(exercise=>exercise.lesson===lessonId),blocks:LearningBlock[]=[],available=new Set(introducedWordIds),usedSemantic=new Set<string>(),usedSurface=new Set<string>()
  for(let start=0;start<unseen.length;start+=size){
    const words=unseen.slice(start,start+size),priorAvailable=new Set(available);words.forEach(word=>available.add(word.id))
    blocks.push({id:`lesson-${lessonId}-batch-${blocks.length+1}`,words,exercises:orderBatchExercises(words,priorAvailable,curated,lessonWords,Math.max(words.length*2,EXERCISES_PER_BLOCK),usedSemantic,usedSurface)})
  }
  return blocks
}

export function lessonProgress(blockIndex:number,totalBlocks:number,exerciseIndex=0,exerciseCount=1){if(totalBlocks<=0)return 100;const within=Math.min(1,exerciseIndex/Math.max(1,exerciseCount));return Math.min(100,Math.round(((blockIndex+within)/totalBlocks)*100))}
