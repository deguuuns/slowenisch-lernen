import { Exercise, ExercisePresentation, SkillTarget, UserProgress } from '@/types'

function hash(value:string){
  let output=2166136261
  for(let index=0;index<value.length;index++){
    output^=value.charCodeAt(index)
    output=Math.imul(output,16777619)
  }
  return output>>>0
}

function deterministicShuffle<T>(items:T[],seed:string){
  return [...items].sort((a,b)=>hash(`${seed}:${String(a)}`)-hash(`${seed}:${String(b)}`))
}

function tokens(answer:string){
  return answer.trim().split(/\s+/).filter(Boolean)
}

function containsSkill(exercise:Exercise,skill:SkillTarget){
  return Boolean(exercise.skillTargets?.includes(skill))
}

function safeForGeneratedVariant(exercise:Exercise){
  return !exercise.generated && exercise.responseScope!=='personal-open' && !containsSkill(exercise,'listening') && !containsSkill(exercise,'speaking')
}

function variantBase(exercise:Exercise,presentation:ExercisePresentation,suffix:string):Exercise{
  return {
    ...exercise,
    id:`${exercise.id}::${suffix}`,
    generated:true,
    presentationVariant:presentation,
    variantOfExerciseId:exercise.variantOfExerciseId||exercise.id,
    alternatives:exercise.alternatives?[...exercise.alternatives]:undefined,
    acceptedAnswers:exercise.acceptedAnswers?[...exercise.acceptedAnswers]:undefined,
    vocabularyIds:exercise.vocabularyIds?[...exercise.vocabularyIds]:undefined,
    grammarRuleIds:exercise.grammarRuleIds?[...exercise.grammarRuleIds]:undefined,
    skillTargets:exercise.skillTargets?[...exercise.skillTargets]:undefined,
    targetContentKeys:exercise.targetContentKeys?[...exercise.targetContentKeys]:undefined,
    supportingContentKeys:exercise.supportingContentKeys?[...exercise.supportingContentKeys]:undefined,
    requiredVerbForms:exercise.requiredVerbForms?.map(item=>({...item})),
  }
}

function reorderVariant(exercise:Exercise):Exercise|null{
  const answerTokens=tokens(exercise.answer)
  if(!safeForGeneratedVariant(exercise)||answerTokens.length<3||answerTokens.length>10||exercise.type==='choice')return null
  const shuffled=deterministicShuffle(answerTokens,`${exercise.id}:reorder`)
  if(shuffled.join(' ')===answerTokens.join(' '))shuffled.reverse()
  const variant=variantBase(exercise,'reorder','reorder')
  return {
    ...variant,
    type:'free',
    prompt:`Baue den korrekten slowenischen Satz: ${exercise.prompt}`,
    wordBank:shuffled,
    alternatives:undefined,
    skillTargets:Array.from(new Set([...(exercise.skillTargets||[]),'production','grammar-application'])) as SkillTarget[],
  }
}

function activeRecallVariant(exercise:Exercise):Exercise|null{
  if(!safeForGeneratedVariant(exercise)||exercise.type!=='choice')return null
  const variant=variantBase(exercise,'active-recall','active-recall')
  return {
    ...variant,
    type:'free',
    prompt:`Ohne Auswahl: ${exercise.prompt}`,
    alternatives:undefined,
    skillTargets:Array.from(new Set([...(exercise.skillTargets||[]).filter(skill=>skill!=='recognition'),'production'])) as SkillTarget[],
  }
}

function recognitionChoiceVariant(exercise:Exercise,peers:Exercise[]):Exercise|null{
  if(!safeForGeneratedVariant(exercise)||exercise.type==='choice'||exercise.responseScope==='personal-open')return null
  const distractors=peers
    .filter(peer=>peer.id!==exercise.id&&safeForGeneratedVariant(peer)&&peer.lesson<=exercise.lesson&&peer.answer.trim().toLocaleLowerCase('sl')!==exercise.answer.trim().toLocaleLowerCase('sl'))
    .sort((a,b)=>hash(`${exercise.id}:${a.id}`)-hash(`${exercise.id}:${b.id}`))
    .map(peer=>peer.answer)
    .filter((answer,index,all)=>all.findIndex(value=>value.trim().toLocaleLowerCase('sl')===answer.trim().toLocaleLowerCase('sl'))===index)
    .slice(0,3)
  if(distractors.length<2)return null
  const variant=variantBase(exercise,'recognition-choice','recognition')
  return {
    ...variant,
    type:'choice',
    prompt:`Erkenne die richtige slowenische Antwort: ${exercise.prompt}`,
    alternatives:distractors,
    acceptedAnswers:undefined,
    skillTargets:['recognition'],
  }
}

export function expandExerciseVariety(exercises:Exercise[]){
  const output:Exercise[]=[]
  for(const exercise of exercises){
    output.push({...exercise,presentationVariant:exercise.presentationVariant||'standard'})
    const variants=[reorderVariant(exercise),activeRecallVariant(exercise),recognitionChoiceVariant(exercise,exercises)].filter(Boolean) as Exercise[]
    output.push(...variants)
  }
  return output
}

export function exercisePresentation(exercise:Exercise):ExercisePresentation{
  return exercise.presentationVariant||'standard'
}

function recentPresentations(progress:UserProgress){
  const ids=new Set((progress.recentAttempts||[]).slice(-8).map(item=>item.exerciseId))
  return ids
}

export function presentationVarietyBonus(progress:UserProgress,exercise:Exercise){
  const recent=recentPresentations(progress)
  if(recent.has(exercise.id)||recent.has(exercise.variantOfExerciseId||''))return -14
  switch(exercisePresentation(exercise)){
    case 'active-recall': {
      const production=progress.mastery?.['skill:production']?.score??.35
      const recognition=progress.mastery?.['skill:recognition']?.score??.35
      return production+.08<recognition?12:5
    }
    case 'reorder': return exercise.grammarRuleIds?.length?10:6
    case 'recognition-choice': return (progress.mastery?.['skill:recognition']?.score??.35)<.65?7:2
    default:return 0
  }
}

export function exerciseVarietyCounts(exercises:Exercise[]){
  return exercises.reduce<Record<ExercisePresentation,number>>((counts,exercise)=>{
    counts[exercisePresentation(exercise)]++
    return counts
  },{standard:0,reorder:0,'recognition-choice':0,'active-recall':0})
}
