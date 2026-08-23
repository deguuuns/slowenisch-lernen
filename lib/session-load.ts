import type { UserProgress } from '@/types'

export type SessionLoadLevel='fresh'|'balanced'|'elevated'|'high'

export type SessionLoad={
  level:SessionLoadLevel
  goalMinutes:number
  recommendedMinutes:number
  multiplier:number
  accuracy:number|null
  averageResponseMs:number|null
  hintRate:number|null
  reason:string
}

function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value))}

export function assessSessionLoad(progress:UserProgress):SessionLoad{
  const goal=Math.max(5,progress.preferences?.dailyGoalMinutes||10)
  const recent=(progress.recentAttempts||[]).slice(-12)
  if(recent.length<4){
    return {level:'balanced',goalMinutes:goal,recommendedMinutes:goal,multiplier:1,accuracy:null,averageResponseMs:null,hintRate:null,reason:'Noch zu wenige aktuelle Antworten für eine Belastungsanpassung.'}
  }

  const accuracy=recent.filter(item=>item.correct).length/recent.length
  const averageResponseMs=recent.reduce((sum,item)=>sum+item.responseMs,0)/recent.length
  const hintRate=recent.filter(item=>item.hintsUsed>0).length/recent.length
  const lastFour=recent.slice(-4)
  const recentErrors=lastFour.filter(item=>!item.correct).length

  let level:SessionLoadLevel='balanced'
  let multiplier=1
  let reason='Tempo, Trefferquote und Hilfen sind aktuell ausgeglichen.'

  if(accuracy<.55||averageResponseMs>40_000||hintRate>=.6||recentErrors>=3){
    level='high';multiplier=.7;reason='Viele Fehler, lange Antwortzeiten oder häufige Hilfen sprechen für eine kompaktere Einheit.'
  }else if(accuracy<.7||averageResponseMs>30_000||hintRate>=.4||recentErrors>=2){
    level='elevated';multiplier=.85;reason='Die letzten Aufgaben waren merklich fordernd; der Plan wird etwas verkürzt und fokussiert.'
  }else if(accuracy>=.88&&averageResponseMs<=15_000&&hintRate<=.1){
    level='fresh';multiplier=1.15;reason='Du antwortest aktuell sicher, schnell und fast ohne Hilfen; die Einheit darf etwas länger sein.'
  }

  const recommendedMinutes=clamp(Math.round(goal*multiplier),5,goal+5)
  return {level,goalMinutes:goal,recommendedMinutes,multiplier,accuracy:+accuracy.toFixed(3),averageResponseMs:Math.round(averageResponseMs),hintRate:+hintRate.toFixed(3),reason}
}

export function exercisesForMinutes(minutes:number){
  return clamp(Math.round(minutes*.8),4,18)
}
