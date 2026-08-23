import { buildSessionPlan } from '@/lib/session-planner'
import { Exercise, UserProgress } from '@/types'

export type DailyTrainingBlockKind='review'|'weakness'|'lesson'|'listening'|'speaking'
export type DailyTrainingLoad='light'|'balanced'|'high'
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
  targetMinutes:number
  load:DailyTrainingLoad
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

export function assessDailyTrainingLoad(progress:UserProgress):{load:DailyTrainingLoad;targetFactor:number;reason:string}{
  const recent=(progress.recentAttempts||[]).slice(-12)
  if(recent.length<4)return {load:'balanced',targetFactor:1,reason:'Noch zu wenige aktuelle Lernsignale für eine Belastungsanpassung.'}
  const correct=recent.filter(item=>item.correct)
  const accuracy=correct.length/recent.length
  const slowCorrect=correct.filter(item=>item.responseMs>30_000).length/Math.max(1,correct.length)
  const helped=recent.filter(item=>item.hintsUsed>0).length/recent.length
  const burden=(1-accuracy)*.55+slowCorrect*.25+helped*.2

  if(burden>=.48||accuracy<.58){
    return {load:'high',targetFactor:.75,reason:'Viele Fehler, lange Antwortzeiten oder Hilfen sprechen heute für eine kürzere, fokussierte Einheit.'}
  }
  if(recent.length>=6&&accuracy>=.85&&slowCorrect<=.2&&helped<=.2){
    return {load:'light',targetFactor:1.2,reason:'Die letzten Aufgaben liefen sicher und flüssig; die Einheit kann moderat erweitert werden.'}
  }
  return {load:'balanced',targetFactor:1,reason:'Leistung und Belastung liegen im normalen Bereich.'}
}

export function buildDailyTrainingPlan(progress:UserProgress, exercises:Exercise[], activeLesson:number, now=Date.now()):DailyTrainingPlan{
  const goal=Math.max(5,progress.preferences.dailyGoalMinutes||10)
  const session=buildSessionPlan(progress,exercises,activeLesson)
  const dueCount=progress.reviews.filter(item=>item.dueAt<=now).length
  const weak=weakTargets(progress)
  const loadAssessment=assessDailyTrainingLoad(progress)
  const target=Math.max(5,Math.min(30,Math.round(goal*loadAssessment.targetFactor)))
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

  return {minutes:blocks.reduce((sum,item)=>sum+item.minutes,0),goalMinutes:goal,targetMinutes:target,load:loadAssessment.load,loadReason:loadAssessment.reason,blocks,primaryWeakness:weak[0],dueCount}
}

export function dailyTrainingLabel(plan:DailyTrainingPlan){
  if(!plan.blocks.length)return 'Heute ist nichts fällig.'
  const adaptation=plan.targetMinutes===plan.goalMinutes?'':plan.targetMinutes<plan.goalMinutes?' · heute etwas kürzer':' · heute etwas länger'
  return `${plan.blocks.length} Blöcke · ca. ${plan.minutes} Min.${adaptation}`
}
