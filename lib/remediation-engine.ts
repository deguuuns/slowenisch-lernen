import { phaseForExercise, remediationPlan } from '@/lib/learning-cycle'
import type { SessionExercise } from '@/lib/exercise-session'
import type { LearningPhase, MistakeCategory } from '@/types'

function overlap<T>(left:T[]|undefined,right:T[]|undefined){
  if(!left?.length||!right?.length)return false
  const set=new Set(left)
  return right.some(value=>set.has(value))
}

function related(a:SessionExercise,b:SessionExercise){
  const one=a.exercise,two=b.exercise
  if(overlap(one.targetContentKeys,two.targetContentKeys))return true
  if(overlap(one.grammarRuleIds,two.grammarRuleIds))return true
  if(overlap(one.vocabularyIds,two.vocabularyIds))return true
  if(one.requiredVerbForms?.length&&two.requiredVerbForms?.length){
    return one.requiredVerbForms.some(first=>two.requiredVerbForms?.some(second=>first.verbId===second.verbId))
  }
  return false
}

function phaseRank(phase:LearningPhase,steps:LearningPhase[]){
  const index=steps.indexOf(phase)
  return index<0?steps.length+2:index
}

export function buildImmediateRemediationQueue(failed:SessionExercise[],all:readonly SessionExercise[],categories:Map<string,MistakeCategory|undefined>){
  const output:SessionExercise[]=[]
  const added=new Set<string>()

  for(const failedItem of failed){
    const category=categories.get(failedItem.id)||failedItem.exercise.mistakeCategory
    const plan=remediationPlan(category)
    const peers=all
      .filter(candidate=>candidate.id!==failedItem.id&&related(failedItem,candidate))
      .sort((a,b)=>phaseRank(phaseForExercise(a.exercise),plan.steps)-phaseRank(phaseForExercise(b.exercise),plan.steps))
      .slice(0,2)

    for(const peer of peers){
      if(!added.has(peer.id)){output.push(peer);added.add(peer.id)}
    }
    if(!added.has(failedItem.id)){output.push(failedItem);added.add(failedItem.id)}
  }

  return output
}
