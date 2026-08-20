import { enrichExercise } from '@/lib/curriculum-metadata'
import { Exercise, Vocabulary } from '@/types'

export const NEW_WORDS_PER_BLOCK = 3
export const EXERCISES_PER_BLOCK = 4
export const MIN_RECALL_GAP_TASKS = 1

export type LearningBlock = {
  id: string
  words: Vocabulary[]
  exercises: Exercise[]
}

export function withLearningMetadata(exercise: Exercise): Exercise {
  return enrichExercise(exercise)
}

function unique<T>(items:T[]) { return Array.from(new Set(items)) }

function distractors(word:Vocabulary, lessonWords:Vocabulary[]) {
  return lessonWords
    .filter(v=>v.id!==word.id && v.partOfSpeech===word.partOfSpeech)
    .concat(lessonWords.filter(v=>v.id!==word.id))
    .map(v=>v.de)
    .filter(v=>v!==word.de)
    .filter((v,i,a)=>a.indexOf(v)===i)
    .slice(0,3)
}

export function generatedExercisesForWord(word:Vocabulary, lessonWords:Vocabulary[]): Exercise[] {
  const choices = distractors(word, lessonWords)
  return [
    {
      id:`gen-produce-${word.id}`,
      lesson:word.lesson,
      type:'translate-de-sl',
      prompt:`Übersetze: ${word.de}`,
      answer:word.sl,
      vocabularyIds:[word.id],
      grammarRuleIds:[],
      evaluationMode:'acceptedVariants',
      generated:true
    },
    {
      id:`gen-recognize-${word.id}`,
      lesson:word.lesson,
      type:'choice',
      prompt:`Was bedeutet „${word.sl}“?`,
      answer:word.de,
      alternatives:choices,
      vocabularyIds:[word.id],
      grammarRuleIds:[],
      evaluationMode:'exact',
      generated:true
    }
  ]
}

function usesOnly(ex:Exercise, ids:Set<string>) {
  const vocabularyIds=ex.vocabularyIds||[]
  return vocabularyIds.length>0 && vocabularyIds.every(id=>ids.has(id))
}

function containsAny(ex:Exercise, ids:Set<string>) {
  return (ex.vocabularyIds||[]).some(id=>ids.has(id))
}

/**
 * Orders a block so a freshly introduced word is not immediately followed by
 * a trivial "what does this mean?" check. Known-word review is used as a
 * buffer when available, contextual curated exercises come next, and direct
 * recognition is delayed behind productive/contextual work.
 */
function orderBlockExercises(
  currentWords:Vocabulary[],
  priorAvailable:Set<string>,
  curated:Exercise[],
  lessonWords:Vocabulary[],
  limit:number
) {
  const currentIds=new Set(currentWords.map(w=>w.id))
  const allAvailable=new Set([...Array.from(priorAvailable),...Array.from(currentIds)])

  const knownWarmups=curated.filter(ex=>usesOnly(ex,priorAvailable) && !containsAny(ex,currentIds)).slice(0,2)
  const contextual=curated.filter(ex=>usesOnly(ex,allAvailable) && containsAny(ex,currentIds))

  // Productive recall is preferable to an immediate recognition question.
  const productive=currentWords.map(w=>generatedExercisesForWord(w,lessonWords)[0])
  const recognition=currentWords.map(w=>generatedExercisesForWord(w,lessonWords)[1])

  // Recognition of words from an earlier block creates a real task gap.
  const earlierWords=lessonWords.filter(w=>priorAvailable.has(w.id))
  const delayedRecognition=earlierWords.slice(-2).map(w=>generatedExercisesForWord(w,lessonWords)[1])

  const pool=[...knownWarmups,...delayedRecognition,...contextual,...productive,...recognition]
  const deduped=unique(pool.map(e=>e.id)).map(id=>pool.find(e=>e.id===id)!)

  // If no known-word buffer exists (e.g. a brand-new learner), avoid making
  // direct recognition the first task. The learner first applies/contextualizes.
  const ordered=deduped.sort((a,b)=>{
    const rank=(ex:Exercise)=>{
      if(knownWarmups.some(x=>x.id===ex.id)) return 0
      if(delayedRecognition.some(x=>x.id===ex.id)) return 1
      if(contextual.some(x=>x.id===ex.id)) return 2
      if(ex.id.startsWith('gen-produce-')) return 3
      return 4
    }
    return rank(a)-rank(b)
  })

  return ordered.slice(0,limit)
}

export function buildLearningBlocks(
  lessonId:number,
  vocabulary:Vocabulary[],
  exercises:Exercise[],
  introducedWordIds:string[],
  size=NEW_WORDS_PER_BLOCK
): LearningBlock[] {
  const lessonWords=vocabulary.filter(v=>v.lesson===lessonId)
  const unseen=lessonWords.filter(v=>!introducedWordIds.includes(v.id))
  const curated=exercises.filter(e=>e.lesson===lessonId).map(withLearningMetadata)
  const blocks:LearningBlock[]=[]
  const available=new Set(introducedWordIds)

  for(let start=0; start<unseen.length; start+=size) {
    const words=unseen.slice(start,start+size)
    const priorAvailable=new Set(available)
    words.forEach(w=>available.add(w.id))

    const selected=orderBlockExercises(
      words,
      priorAvailable,
      curated,
      lessonWords,
      Math.max(EXERCISES_PER_BLOCK,words.length*2)
    )

    blocks.push({id:`lesson-${lessonId}-block-${blocks.length+1}`,words,exercises:selected})
  }

  return blocks
}

export function buildFinalReview(lessonId:number, exercises:Exercise[], max=8) {
  const lessonExercises=exercises.filter(e=>e.lesson===lessonId).map(withLearningMetadata)
  const productive=lessonExercises.filter(e=>e.type!=='choice')
  const recognition=lessonExercises.filter(e=>e.type==='choice')
  return [...productive,...recognition].slice(0,max)
}

export function lessonProgress(blockIndex:number,totalBlocks:number,exerciseIndex=0,exerciseCount=1) {
  if(totalBlocks<=0) return 100
  const within=Math.min(1,exerciseIndex/Math.max(1,exerciseCount))
  return Math.min(100,Math.round(((blockIndex+within)/totalBlocks)*100))
}
