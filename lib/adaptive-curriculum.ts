import { Exercise, MasteryItem, UserProgress, Vocabulary } from '@/types'

export type AdaptiveActionKind='review'|'strengthen'|'new-content'|'speaking'
export type AdaptiveRecommendation={
  kind:AdaptiveActionKind
  title:string
  reason:string
  priority:number
  lessonId?:number
  focusKeys:string[]
  exerciseIds:string[]
}

const WEAK_THRESHOLD=.58
const MIN_ATTEMPTS_FOR_WEAK=2

function weakItems(progress:UserProgress){
  return Object.values(progress.mastery||{})
    .filter(m=>m.attempts>=MIN_ATTEMPTS_FOR_WEAK&&m.score<WEAK_THRESHOLD)
    .sort((a,b)=>a.score-b.score||b.attempts-a.attempts)
}

function exercisesForMastery(items:MasteryItem[],exercises:Exercise[]){
  const keys=new Set(items.map(x=>x.key))
  return exercises.filter(ex=>{
    const exKeys=[...(ex.vocabularyIds||[]).map(id=>`vocab:${id}`),...(ex.grammarRuleIds||[]).map(id=>`grammar:${id}`)]
    if(ex.type==='choice')exKeys.push('skill:recognition')
    else if(ex.type==='translate-de-sl'||ex.type==='free')exKeys.push('skill:production')
    else exKeys.push('skill:grammar-application')
    return exKeys.some(k=>keys.has(k))
  })
}

function unique<T>(items:T[]){return Array.from(new Set(items))}

export function buildAdaptiveRecommendation(progress:UserProgress,exercises:Exercise[],vocabulary:Vocabulary[],activeLesson:number,now=Date.now()):AdaptiveRecommendation{
  const dueIds=progress.reviews.filter(r=>r.dueAt<=now).map(r=>r.key)
  if(dueIds.length){
    return {kind:'review',title:'Fällige Wiederholungen',reason:`${dueIds.length} Inhalte sind jetzt fällig. Erst festigen, dann Neues lernen.`,priority:100,focusKeys:dueIds,exerciseIds:dueIds.filter(id=>exercises.some(e=>e.id===id)).slice(0,10)}
  }

  const weak=weakItems(progress)
  if(weak.length){
    const top=weak.slice(0,3)
    const deck=exercisesForMastery(top,exercises)
    const weakest=top[0]
    const label=weakest.kind==='vocabulary'?'Wortschatz':weakest.kind==='grammar'?'Grammatik':'aktive Fähigkeit'
    return {kind:'strengthen',title:`${label} gezielt festigen`,reason:`Dein Lernmodell erkennt hier noch Unsicherheit (${Math.round(weakest.score*100)} % Sicherheit).`,priority:80,focusKeys:top.map(x=>x.key),exerciseIds:unique(deck.map(e=>e.id)).slice(0,10)}
  }

  const production=progress.mastery?.['skill:production']
  const recognition=progress.mastery?.['skill:recognition']
  if((recognition?.attempts||0)>=3&&(!production||production.score+0.12<(recognition.score||0))){
    return {kind:'speaking',title:'Mehr selbst produzieren',reason:'Erkennen klappt besser als selbst formulieren. Deshalb ist jetzt aktive Produktion sinnvoll.',priority:65,focusKeys:['skill:production'],exerciseIds:exercises.filter(e=>e.type==='translate-de-sl'||e.type==='free').map(e=>e.id).slice(0,8)}
  }

  const lessonWords=vocabulary.filter(v=>v.lesson===activeLesson)
  const unseen=lessonWords.filter(v=>!progress.introducedWords.includes(v.id))
  return {kind:'new-content',title:`Weiter mit Lektion ${activeLesson}`,reason:unseen.length?`${unseen.length} neue Wörter warten in kleinen Lernblöcken auf dich.`:'Die neuen Wörter sind eingeführt. Jetzt festigst du sie im Lektionenablauf.',priority:50,lessonId:activeLesson,focusKeys:unseen.slice(0,3).map(v=>`vocab:${v.id}`),exerciseIds:exercises.filter(e=>e.lesson===activeLesson).map(e=>e.id).slice(0,8)}
}

export function buildAdaptiveReviewDeck(progress:UserProgress,exercises:Exercise[],limit=10,now=Date.now()):Exercise[]{
  const due=new Set(progress.reviews.filter(r=>r.dueAt<=now).map(r=>r.key))
  const mistakes=new Set([...progress.mistakes].sort((a,b)=>b.count-a.count).map(m=>m.key))
  const weak=weakItems(progress).slice(0,5)
  const weakExercises=exercisesForMastery(weak,exercises)

  const scored=exercises.map((ex,index)=>{
    let score=0
    if(due.has(ex.id))score+=100
    if(mistakes.has(ex.id))score+=60
    if(weakExercises.some(w=>w.id===ex.id))score+=45
    const vocabWeak=(ex.vocabularyIds||[]).some(id=>(progress.mastery?.[`vocab:${id}`]?.score??1)<WEAK_THRESHOLD)
    const grammarWeak=(ex.grammarRuleIds||[]).some(id=>(progress.mastery?.[`grammar:${id}`]?.score??1)<WEAK_THRESHOLD)
    if(vocabWeak)score+=20
    if(grammarWeak)score+=25
    return {ex,score,index}
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.index-b.index)

  const chosen=unique(scored.map(x=>x.ex.id)).map(id=>exercises.find(e=>e.id===id)!).slice(0,limit)
  if(chosen.length>=Math.min(4,limit))return chosen
  const fillers=exercises.filter(e=>!chosen.some(c=>c.id===e.id)).slice(0,limit-chosen.length)
  return [...chosen,...fillers]
}
