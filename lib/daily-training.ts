import { buildSessionPlan } from '@/lib/session-planner'
import type { SessionLoadLevel } from '@/lib/session-load'
import { Exercise, UserProgress } from '@/types'

export type DailyTrainingBlockKind='review'|'weakness'|'lesson'|'listening'|'speaking'
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
}

function weakTargets(progress:UserProgress){
  return Object.entries(progress.mastery||{})
    .filter(([,item])=>(item.attempts||0)>=2 && item.score<.62)
    .sort(([,a],[,b])=>a.score-b.score)
    .map(([key])=>key)
}

function clampMinutes(value:number){return Math.max(2,Math.round(value))}

export function buildDailyTrainingPlan(progress:UserProgress, exercises:Exercise[], activeLesson:number, now=Date.now()):DailyTrainingPlan{
  const session=buildSessionPlan(progress,exercises,activeLesson)
  const goal=session.goalMinutes
  const target=session.recommendedMinutes
  const dueCount=progress.reviews.filter(item=>item.dueAt<=now).length
  const weak=weakTargets(progress)
  const blocks:DailyTrainingBlock[]=[]
  let remaining=target

  if(dueCount>0||session.review>0){
    const minutes=Math.min(remaining,clampMinutes(Math.min(5,Math.max(2,session.review||dueCount))))
    blocks.push({id:'daily-review',kind:'review',title:'Fällige Wiederholungen',reason:`${Math.max(dueCount,session.review)} Lernziele sind fällig.`,minutes,targetKeys:[]})
    remaining-=minutes
  }

  if(weak.length&&remaining>1){
    const focus=weak.slice(0,3)
    const minutes=Math.min(remaining,clampMinutes(target*.3))
    blocks.push({id:'daily-weakness',kind:'weakness',title:'Schwäche gezielt reparieren',reason:`Fokus: ${focus.map(key=>key.replace(/^\w+:/,'')).join(', ')}`,minutes,targetKeys:focus})
    remaining-=minutes
  }

  if(remaining>3){
    const listeningWeak=weak.some(key=>key.includes('listening'))
    const speakingWeak=weak.some(key=>key.includes('speaking')||key.includes('production'))
    const kind:DailyTrainingBlockKind=listeningWeak?'listening':speakingWeak?'speaking':activeLesson<=5?'lesson':'speaking'
    const title=kind==='listening'?'Hörverständnis':kind==='speaking'?'Aktiv sprechen':`Lektion ${activeLesson} fortsetzen`
    const minutes=Math.min(remaining,clampMinutes(target*.35))
    blocks.push({id:`daily-${kind}`,kind,title,reason:listeningWeak?'Hören ist aktuell ein schwächerer Bereich.':speakingWeak?'Aktive Produktion braucht mehr Sicherheit.':'Neuer Stoff ergänzt die fällige Wiederholung.',minutes,targetKeys:[]})
    remaining-=minutes
  }

  if(remaining>0){
    blocks.push({id:'daily-finish',kind:'speaking',title:'Kurzer Transfer',reason:'Zum Abschluss bekannte Strukturen aktiv in eigenen Antworten verwenden.',minutes:remaining,targetKeys:[]})
  }

  return {minutes:blocks.reduce((sum,item)=>sum+item.minutes,0),goalMinutes:goal,recommendedMinutes:target,loadLevel:session.loadLevel,loadReason:session.loadReason,blocks,primaryWeakness:weak[0],dueCount}
}

export function dailyTrainingLabel(plan:DailyTrainingPlan){
  if(!plan.blocks.length)return 'Heute ist nichts fällig.'
  const duration=plan.recommendedMinutes===plan.goalMinutes?`ca. ${plan.minutes} Min.`:`ca. ${plan.minutes} Min. statt ${plan.goalMinutes} Min.`
  return `${plan.blocks.length} Blöcke · ${duration}`
}
