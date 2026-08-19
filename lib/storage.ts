'use client'

import { AttemptSignal, Exercise, LearnerPreferences, MasteryItem, Mistake, ReviewItem, TransferItem, UserProgress } from '@/types'

const KEY = 'slovensko-progress-v1'

export const defaultPreferences:LearnerPreferences={onboardingCompleted:false,nativeLanguage:'de',targetLevel:'A1',dailyGoalMinutes:10,pace:'normal',audioSpeed:'normal'}
export const defaultProgress: UserProgress = { completedLessons:[], streak:1, introducedWords:[], wordsLearned:[], secureWords:[], mistakes:[], reviews:[], speakingMinutes:0, listeningMinutes:0, mastery:{}, recentAttempts:[], transferQueue:[], preferences:defaultPreferences }

export function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return defaultProgress
  try {
    const raw=localStorage.getItem(KEY)
    const parsed=raw?JSON.parse(raw):{}
    return raw ? {
      ...defaultProgress,
      ...parsed,
      mastery:{...(parsed.mastery||{})},
      recentAttempts:parsed.recentAttempts||[],
      transferQueue:parsed.transferQueue||[],
      preferences:{...defaultPreferences,...(parsed.preferences||{})}
    } : defaultProgress
  } catch { return defaultProgress }
}
export function saveProgress(progress: UserProgress) { if(typeof window!=='undefined') localStorage.setItem(KEY,JSON.stringify(progress)) }

const intervals=[10*60_000,24*60*60_000,3*24*60*60_000,7*24*60*60_000,14*24*60*60_000,30*24*60*60_000]
export function scheduleReview(items:ReviewItem[],key:string,correct:boolean):ReviewItem[]{ const now=Date.now(); const current=items.find(i=>i.key===key); const nextIndex=correct?Math.min((current?.intervalIndex??-1)+1,intervals.length-1):0; const status=nextIndex>=4?'sicher':nextIndex>=2?'gelernt':correct?'unsicher':'neu'; const next:ReviewItem={key,intervalIndex:nextIndex,status,dueAt:now+intervals[nextIndex]}; return [...items.filter(i=>i.key!==key),next] }
export function registerMistake(mistakes:Mistake[],key:string):Mistake[]{ const current=mistakes.find(m=>m.key===key); const next:Mistake={key,count:(current?.count??0)+1,lastSeen:Date.now()}; return [...mistakes.filter(m=>m.key!==key),next].sort((a,b)=>b.count-a.count) }

function quality(correct:boolean,responseMs:number,hintsUsed:number){
  if(!correct) return 0
  const speed=responseMs<=8_000?1:responseMs<=20_000?.9:responseMs<=45_000?.78:.65
  return Math.max(.45,speed-(hintsUsed*.18))
}

function updateItem(old:MasteryItem|undefined,key:string,kind:MasteryItem['kind'],correct:boolean,responseMs=0,hintsUsed=0):MasteryItem{
  const attempts=(old?.attempts||0)+1, hits=(old?.correct||0)+(correct?1:0)
  const observed=correct?quality(true,responseMs,hintsUsed):0
  const previous=old?.score??0.25
  const score=Math.max(0,Math.min(1,previous*0.72+observed*0.28))
  return {key,kind,score:+score.toFixed(3),attempts,correct:hits,lastSeen:Date.now()}
}

export function updateMastery(mastery:Record<string,MasteryItem>,ex:Exercise,correct:boolean,responseMs=0,hintsUsed=0){
  const next={...mastery}
  for(const id of ex.vocabularyIds||[]) next[`vocab:${id}`]=updateItem(next[`vocab:${id}`],`vocab:${id}`,'vocabulary',correct,responseMs,hintsUsed)
  for(const id of ex.grammarRuleIds||[]) next[`grammar:${id}`]=updateItem(next[`grammar:${id}`],`grammar:${id}`,'grammar',correct,responseMs,hintsUsed)
  const skill=ex.type==='choice'?'recognition':ex.type==='translate-de-sl'||ex.type==='free'?'production':'grammar-application'
  next[`skill:${skill}`]=updateItem(next[`skill:${skill}`],`skill:${skill}`,'skill',correct,responseMs,hintsUsed)
  return next
}

export function recordAttempt(items:AttemptSignal[],signal:AttemptSignal){ return [...items,signal].slice(-100) }
export function queueTransfers(items:TransferItem[],ex:Exercise,correct:boolean,attemptCount:number){
  if(correct&&ex.transferSourceExerciseId&&ex.transferRuleId){
    return items.filter(x=>!(x.sourceExerciseId===ex.transferSourceExerciseId&&x.grammarRuleId===ex.transferRuleId))
  }
  if(correct||!ex.grammarRuleIds?.length) return items
  const created=ex.grammarRuleIds.map(grammarRuleId=>({sourceExerciseId:ex.id,grammarRuleId,dueAfter:attemptCount+2+Math.floor(Math.random()*2),createdAt:Date.now()}))
  const map=new Map(items.map(x=>[`${x.sourceExerciseId}:${x.grammarRuleId}`,x])); created.forEach(x=>map.set(`${x.sourceExerciseId}:${x.grammarRuleId}`,x)); return Array.from(map.values())
}
