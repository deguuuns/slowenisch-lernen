import type { CEFRLevel, LearningSkill } from '@/types'

export type PlacementQuestion = {
  id: string
  prompt: string
  answer: string
  alternatives: string[]
  level: CEFRLevel
  skills: LearningSkill[]
  learningTargets: string[]
  audioPrompt?: string
}

export const placementA1: PlacementQuestion[] = [
  { id:'p-greeting', prompt:'Was bedeutet „Živjo“?', answer:'Hallo', alternatives:['Hallo','Danke','Tschüss'], level:'A1', skills:['wortschatz','lesen'], learningTargets:['vocab:živjo'] },
  { id:'p-home', prompt:'Welche Übersetzung passt zu „Ich bin zu Hause“?', answer:'Sem doma.', alternatives:['Sem doma.','Grem domov.','Sem domov.'], level:'A1', skills:['grammatik','lesen'], learningTargets:['grammar:doma-domov'] },
  { id:'p-dual', prompt:'Welche Form passt: „Imam ___ brata.“?', answer:'dva', alternatives:['dva','dve','dveh'], level:'A1', skills:['grammatik'], learningTargets:['grammar:dual'] },
]

export const placementA2: PlacementQuestion[] = [
  { id:'p-location', prompt:'Du bist in Slowenien. Welche Form ist richtig?', answer:'Sem v Sloveniji.', alternatives:['Sem v Sloveniji.','Sem v Slovenijo.','Grem v Sloveniji.'], level:'A2', skills:['grammatik','lesen'], learningTargets:['grammar:location-direction'] },
  { id:'p-time', prompt:'Welche Form bedeutet hier „um zehn Uhr“?', answer:'ob desetih', alternatives:['ob deset','ob desetih','v deset'], level:'A2', skills:['grammatik'], learningTargets:['grammar:time-number-form'] },
  { id:'p-listen', prompt:'Höre den Satz. Was bedeutet er?', audioPrompt:'Rad berem.', answer:'Ich lese gern.', alternatives:['Ich lese gern.','Ich arbeite heute.','Ich gehe nach Hause.'], level:'A2', skills:['hören','wortschatz'], learningTargets:['skill:hören'] },
]

export type PlacementEvidence = {
  level: CEFRLevel
  correct: number
  total: number
  knownTargets: string[]
  weakTargets: string[]
}

export function shouldContinueToA2(a1Correct: number) {
  return a1Correct >= 2
}

export function scorePlacement(results: Array<{ question: PlacementQuestion; correct: boolean }>): PlacementEvidence {
  const correct = results.filter(item => item.correct).length
  const a2 = results.filter(item => item.question.level === 'A2')
  const a2Correct = a2.filter(item => item.correct).length
  const level: CEFRLevel = a2.length >= 2 && a2Correct >= 2 ? 'A2' : 'A1'
  return {
    level,
    correct,
    total: results.length,
    knownTargets: Array.from(new Set(results.filter(item => item.correct).flatMap(item => item.question.learningTargets))),
    weakTargets: Array.from(new Set(results.filter(item => !item.correct).flatMap(item => item.question.learningTargets))),
  }
}
