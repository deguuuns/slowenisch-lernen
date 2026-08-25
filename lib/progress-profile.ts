import { MasteryItem, UserProgress } from '@/types'

export type ProgressDimensionId = 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'production'
export type ProgressBand = 'aufbauen' | 'entwickeln' | 'stabilisieren' | 'sicher'

export type ProgressDimension = {
  id: ProgressDimensionId
  label: string
  score: number
  evidence: number
  band: ProgressBand
  description: string
}

export type CefrProgressProfile = {
  level: 'A1'
  readiness: number
  band: ProgressBand
  evidenceSufficient: boolean
  dimensions: ProgressDimension[]
  strongest?: ProgressDimension
  focus?: ProgressDimension
  completedLessonRatio: number
  learnedVocabularyRatio: number
}

const clamp = (value:number) => Math.max(0, Math.min(1, value))
const percent = (value:number) => Math.round(clamp(value) * 100)

function bandFor(score:number):ProgressBand {
  if (score >= .8) return 'sicher'
  if (score >= .62) return 'stabilisieren'
  if (score >= .4) return 'entwickeln'
  return 'aufbauen'
}

function masteryEntries(progress:UserProgress, predicate:(item:MasteryItem)=>boolean) {
  return Object.values(progress.mastery || {}).filter(item => item.attempts > 0 && predicate(item))
}

function weightedMastery(items:MasteryItem[]) {
  if (!items.length) return { score:0, evidence:0 }
  const weighted = items.reduce((sum,item)=>sum + clamp(item.score) * Math.min(8, Math.max(1,item.attempts)),0)
  const weight = items.reduce((sum,item)=>sum + Math.min(8, Math.max(1,item.attempts)),0)
  return { score:weight ? weighted / weight : 0, evidence:items.reduce((sum,item)=>sum+item.attempts,0) }
}

function dimension(id:ProgressDimensionId,label:string,score:number,evidence:number,description:string):ProgressDimension {
  const normalized=percent(score)
  return { id,label,score:normalized,evidence,band:bandFor(normalized/100),description }
}

export function buildCefrProgressProfile(progress:UserProgress,totalVocabulary:number,totalLessons:number):CefrProgressProfile {
  const learnedVocabularyRatio=totalVocabulary?clamp(progress.wordsLearned.length/totalVocabulary):0
  const secureVocabularyRatio=totalVocabulary?clamp(progress.secureWords.length/totalVocabulary):0
  const completedLessonRatio=totalLessons?clamp(progress.completedLessons.length/totalLessons):0

  const vocabMastery=weightedMastery(masteryEntries(progress,item=>item.kind==='vocabulary'))
  const grammarMastery=weightedMastery(masteryEntries(progress,item=>item.kind==='grammar'||item.kind==='verb'))
  const listeningMastery=weightedMastery(masteryEntries(progress,item=>item.kind==='skill'&&item.key.includes('listening')))
  const speakingMastery=weightedMastery(masteryEntries(progress,item=>item.kind==='skill'&&(item.key.includes('speaking:spoken-response')||item.key==='skill:speaking')))
  const productionMastery=weightedMastery(masteryEntries(progress,item=>item.kind==='skill'&&(item.key.includes('production')||item.key.includes('grammar-application'))))

  const vocabularyScore=vocabMastery.evidence
    ? vocabMastery.score*.55 + learnedVocabularyRatio*.3 + secureVocabularyRatio*.15
    : learnedVocabularyRatio*.7 + secureVocabularyRatio*.3
  const grammarScore=grammarMastery.evidence ? grammarMastery.score*.8 + completedLessonRatio*.2 : completedLessonRatio*.45
  const listeningScore=listeningMastery.evidence ? listeningMastery.score : Math.min(.35,progress.listeningMinutes/60*.35)
  const speakingScore=speakingMastery.evidence ? speakingMastery.score : Math.min(.3,progress.speakingMinutes/45*.3)
  const productionScore=productionMastery.evidence ? productionMastery.score*.85 + completedLessonRatio*.15 : completedLessonRatio*.35

  const dimensions=[
    dimension('vocabulary','Wortschatz',vocabularyScore,vocabMastery.evidence,`${progress.wordsLearned.length} von ${totalVocabulary} Wörtern gelernt`),
    dimension('grammar','Grammatik',grammarScore,grammarMastery.evidence,`${progress.completedLessons.length} von ${totalLessons} Lektionen abgeschlossen`),
    dimension('listening','Hören',listeningScore,listeningMastery.evidence,`${progress.listeningMinutes.toFixed(1)} Minuten Hörpraxis`),
    dimension('speaking','Sprechen',speakingScore,speakingMastery.evidence,`${progress.speakingMinutes.toFixed(1)} Minuten echte Sprechpraxis`),
    dimension('production','Aktive Produktion',productionScore,productionMastery.evidence,'Eigene slowenische Antworten und Transferaufgaben'),
  ]

  const readiness=Math.round(dimensions.reduce((sum,item)=>sum+item.score,0)/dimensions.length)
  const sorted=[...dimensions].sort((a,b)=>a.score-b.score)
  const totalEvidence=dimensions.reduce((sum,item)=>sum+item.evidence,0)
  return {
    level:'A1',readiness,band:bandFor(readiness/100),evidenceSufficient:totalEvidence>=20&&progress.completedLessons.length>=2,
    dimensions,focus:sorted[0],strongest:sorted[sorted.length-1],completedLessonRatio:percent(completedLessonRatio),learnedVocabularyRatio:percent(learnedVocabularyRatio),
  }
}

export function cefrReadinessLabel(profile:CefrProgressProfile) {
  if (!profile.evidenceSufficient) return 'A1-Profil wird aufgebaut'
  if (profile.readiness >= 80) return 'A1-Inhalte weitgehend stabil'
  if (profile.readiness >= 62) return 'A1 auf gutem Weg'
  if (profile.readiness >= 40) return 'A1 im Aufbau'
  return 'A1-Grundlage aufbauen'
}
