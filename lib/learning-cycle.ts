import type { Exercise, LearningPhase, MistakeCategory, SkillTarget, UserProgress, Vocabulary } from '@/types'

export const MICRO_LEARNING_CYCLE:LearningPhase[]=[
  'understand','recognize','guided-production','active-production','variation','transfer',
]

export function phaseForExercise(exercise:Exercise):LearningPhase{
  if(exercise.learningPhase)return exercise.learningPhase
  if(exercise.presentationVariant==='recognition-choice'||exercise.type==='choice')return 'recognize'
  if(exercise.wordBank?.length||exercise.presentationVariant==='reorder')return 'guided-production'
  if(exercise.transferSourceExerciseId||exercise.transferRuleId)return 'transfer'
  if(exercise.difficulty==='challenge')return 'variation'
  if(exercise.skillTargets?.some(skill=>skill==='production'||skill==='speaking'||skill==='grammar-application'))return 'active-production'
  return 'recognize'
}

export function phaseWeight(phase:LearningPhase){
  const weights:Record<LearningPhase,number>={understand:5,recognize:12,'guided-production':24,'active-production':36,variation:46,transfer:54,remediation:70}
  return weights[phase]
}

export function masteryDimensionForExercise(exercise:Exercise):SkillTarget{
  if(exercise.skillTargets?.includes('speaking'))return 'speaking'
  if(exercise.skillTargets?.includes('listening'))return 'listening'
  if(exercise.skillTargets?.includes('grammar-application'))return 'grammar-application'
  if(exercise.skillTargets?.includes('production'))return 'production'
  return 'recognition'
}

export function targetIsReadyForProduction(progress:UserProgress,key:string){
  const item=progress.mastery?.[key]
  if(!item)return false
  return item.attempts>=1&&item.score>=.42
}

export function targetIsReadyForTransfer(progress:UserProgress,key:string){
  const item=progress.mastery?.[key]
  if(!item)return false
  return item.attempts>=3&&item.score>=.62&&(item.activeCorrect||0)>=1
}

export function learningPhaseForTarget(progress:UserProgress,key:string):LearningPhase{
  const item=progress.mastery?.[key]
  if(!item||item.attempts===0)return 'understand'
  if(item.score<.38)return 'recognize'
  if((item.activeCorrect||0)===0)return 'guided-production'
  if(item.score<.62)return 'active-production'
  if(item.score<.78)return 'variation'
  return 'transfer'
}

export function phaseMatchScore(progress:UserProgress,exercise:Exercise){
  const keys=exercise.targetContentKeys||[]
  if(!keys.length)return 0
  const desired=keys.map(key=>learningPhaseForTarget(progress,key))
  const actual=phaseForExercise(exercise)
  const distance=Math.min(...desired.map(phase=>Math.abs(MICRO_LEARNING_CYCLE.indexOf(phase)-MICRO_LEARNING_CYCLE.indexOf(actual))))
  return distance===0?30:distance===1?14:distance===2?2:-12
}

export function remediationPlan(category:MistakeCategory|undefined):{focus:string;steps:LearningPhase[];contrast?:string}{
  switch(category){
    case 'dual-error': return {focus:'Dual und Zahlformen',steps:['recognize','guided-production','active-production','variation'],contrast:'Singular → Dual → Plural'}
    case 'gender-error': return {focus:'Genus und passende Zahl-/Adjektivform',steps:['recognize','guided-production','variation'],contrast:'maskulin ↔ feminin'}
    case 'case-error': return {focus:'Kasusform im Satz',steps:['recognize','guided-production','active-production','transfer']}
    case 'conjugation-error':
    case 'verb-person-error': return {focus:'Person und Verbform',steps:['recognize','guided-production','variation','transfer'],contrast:'Singular → Dual → Plural'}
    case 'word-order-error': return {focus:'Wortstellung',steps:['guided-production','active-production','variation']}
    case 'wrong-meaning':
    case 'vocabulary-recall': return {focus:'Wortbedeutung und aktiver Abruf',steps:['recognize','guided-production','active-production']}
    default:return {focus:'gezielte Wiederholung',steps:['recognize','active-production']}
  }
}

export function microContext(words:Vocabulary[]){
  const byTopic=new Map<string,Vocabulary[]>()
  for(const word of words){const key=word.curriculumUnit||word.topic||word.category;byTopic.set(key,[...(byTopic.get(key)||[]),word])}
  return [...byTopic.entries()].map(([context,items])=>({context,words:items.sort((a,b)=>(a.priority||5)-(b.priority||5)).slice(0,5)}))
}
