import { buildSessionPlan } from '@/lib/session-planner'
import type { SessionLoadLevel } from '@/lib/session-load'
import { Exercise, TargetContentKey, UserProgress } from '@/types'

export type DailyTrainingBlockKind='review'|'weakness'|'lesson'|'listening'|'speaking'
export type DailyTrainingDestination='review'|'lesson'|'speak'
export type DailyTrainingBlock={
  id:string
  kind:DailyTrainingBlockKind
  title:string
  reason:string
  minutes:number
  targetKeys:string[]
}
export type DailyTrainingPlan={
  minutes:number
  goalMinutes:number
  recommendedMinutes:number
  loadLevel:SessionLoadLevel
  loadReason:string
  blocks:DailyTrainingBlock[]
  primaryWeakness?:string
  dueCount:number
  themeTargetKeys:string[]
}

function weakTargets(progress:UserProgress){
  return Object.entries(progress.mastery||{})
    .filter(([,item])=>(item.attempts||0)>=2 && item.score<.62)
    .sort(([,a],[,b])=>a.score-b.score)
    .map(([key])=>key)
}

function clampMinutes(value:number){return Math.max(2,Math.round(value))}

export function exerciseTargetKeys(exercise:Exercise):TargetContentKey[]{
  const explicit=exercise.targetContentKeys||[]
  const inferred:TargetContentKey[]=[
    ...(exercise.vocabularyIds||[]).map(id=>`vocab:${id}` as TargetContentKey),
    ...(exercise.grammarRuleIds||[]).map(id=>`grammar:${id}` as TargetContentKey),
    ...(exercise.skillTargets||[]).map(id=>`skill:${id}` as TargetContentKey),
    ...(exercise.requiredVerbForms||[]).map(item=>`verb:${item.verbId}:${item.person}:${item.number}` as TargetContentKey),
  ]
  return Array.from(new Set([...explicit,...inferred]))
}

function activeThemeKeys(exercises:Exercise[],activeLesson:number){
  return Array.from(new Set(exercises.filter(exercise=>exercise.lesson===activeLesson).flatMap(exercise=>exerciseTargetKeys(exercise))))
}

export function dailyTrainingBlockDestination(block:DailyTrainingBlock):DailyTrainingDestination{
  if(block.kind==='lesson')return 'lesson'
  if(block.kind==='speaking')return 'speak'
  return 'review'
}

export function buildDailyTrainingPlan(progress:UserProgress, exercises:Exercise[], activeLesson:number, now=Date.now()):DailyTrainingPlan{
  const session=buildSessionPlan(progress,exercises,activeLesson)
  const goal=session.goalMinutes
  const target=session.recommendedMinutes
  const dueReviews=progress.reviews.filter(item=>item.dueAt<=now)
  const dueCount=dueReviews.length
  const themeTargetKeys=activeThemeKeys(exercises,activeLesson)
  const themeSet=new Set(themeTargetKeys)
  const weakAll=weakTargets(progress)
  const themedWeak=weakAll.filter(key=>themeSet.has(key as TargetContentKey))
  const weak=themedWeak.length?themedWeak:weakAll
  const themedDue=dueReviews.map(item=>item.key).filter(key=>themeSet.has(key as TargetContentKey))
  const blocks:DailyTrainingBlock[]=[]
  let remaining=target

  if(dueCount>0||session.review>0){
    const minutes=Math.min(remaining,clampMinutes(Math.min(5,Math.max(2,session.review||dueCount))))
    const targets=(themedDue.length?themedDue:dueReviews.map(item=>item.key)).slice(0,6)
    blocks.push({id:'daily-review',kind:'review',title:'Wiederholen',reason:themedDue.length?'Fällige Inhalte aus deinem aktuellen Lernbereich.':`${Math.max(dueCount,session.review)} Lernziele sind fällig.`,minutes,targetKeys:targets})
    remaining-=minutes
  }

  if(weak.length&&remaining>1){
    const focus=weak.slice(0,3)
    const minutes=Math.min(remaining,clampMinutes(target*.3))
    blocks.push({id:'daily-weakness',kind:'weakness',title:'Gezielt festigen',reason:themedWeak.length?'Schwächen aus dem aktuellen Lernbereich werden zuerst repariert.':`Fokus: ${focus.map(key=>key.replace(/^\w+:/,'')).join(', ')}`,minutes,targetKeys:focus})
    remaining-=minutes
  }

  if(remaining>3){
    const listeningWeak=weak.some(key=>key.includes('listening'))
    const speakingWeak=weak.some(key=>key.includes('speaking')||key.includes('production'))
    const kind:DailyTrainingBlockKind=listeningWeak?'listening':speakingWeak?'speaking':'lesson'
    const title=kind==='listening'?'Hörverständnis':kind==='speaking'?'Aktiv sprechen':`Lektion ${activeLesson} fortsetzen`
    const minutes=Math.min(remaining,clampMinutes(target*.35))
    blocks.push({id:`daily-${kind}`,kind,title,reason:listeningWeak?'Hören im aktuellen Lernstand gezielt stärken.':speakingWeak?'Aktive Produktion im aktuellen Lernkontext stärken.':'Neuer Stoff bleibt im selben Lernkontext.',minutes,targetKeys:themeTargetKeys})
    remaining-=minutes
  }

  if(remaining>0){
    blocks.push({id:'daily-finish',kind:'speaking',title:'Kurzer Transfer',reason:'Zum Abschluss denselben Lernkontext aktiv verwenden.',minutes:remaining,targetKeys:themeTargetKeys})
  }

  return {minutes:blocks.reduce((sum,item)=>sum+item.minutes,0),goalMinutes:goal,recommendedMinutes:target,loadLevel:session.loadLevel,loadReason:session.loadReason,blocks,primaryWeakness:weak[0],dueCount,themeTargetKeys}
}

export function dailyTrainingLabel(plan:DailyTrainingPlan){
  if(!plan.blocks.length)return 'Heute ist nichts fällig.'
  const duration=plan.recommendedMinutes===plan.goalMinutes?`ca. ${plan.minutes} Min.`:`ca. ${plan.minutes} Min. statt ${plan.goalMinutes} Min.`
  return `${plan.blocks.length} Blöcke · ${duration}`
}
