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

// The placement starts with recognition only. A correct multiple-choice answer is
// evidence that a target is familiar receptively; it is deliberately NOT proof of
// recall or productive mastery.
export const placementA1: PlacementQuestion[] = [
  { id:'p-zivjo', prompt:'Was bedeutet „Živjo“?', answer:'Hallo', alternatives:['Hallo','Danke','Bitte'], level:'A1', skills:['wortschatz','lesen'], learningTargets:['vocab:živjo'] },
  { id:'p-hvala', prompt:'Was bedeutet „Hvala“?', answer:'Danke', alternatives:['Danke','Guten Tag','Nein'], level:'A1', skills:['wortschatz','lesen'], learningTargets:['vocab:hvala'] },
  { id:'p-prosim', prompt:'Was bedeutet „Prosim“?', answer:'Bitte / gern', alternatives:['Bitte / gern','Gute Nacht','Ja'], level:'A1', skills:['wortschatz','lesen'], learningTargets:['vocab:prosim'] },
  { id:'p-greeting', prompt:'Welche Wendung bedeutet „Guten Tag“?', answer:'Dober dan.', alternatives:['Dober dan.','Lahko noč.','Kako si?'], level:'A1', skills:['wortschatz','lesen'], learningTargets:['vocab:dober dan'] },
  { id:'p-sem', prompt:'Welche Bedeutung passt zu „sem“?', answer:'ich bin', alternatives:['ich bin','du bist','er/sie ist'], level:'A1', skills:['grammatik','lesen'], learningTargets:['conjugation:biti:1s'] },
]

// Only learners who are very secure on the basic recognition block see this short
// extension. These questions still remain supported/recognition-oriented.
export const placementA2: PlacementQuestion[] = [
  { id:'p-si', prompt:'Welche Bedeutung passt zu „si“?', answer:'du bist', alternatives:['ich bin','du bist','er/sie ist'], level:'A2', skills:['grammatik','lesen'], learningTargets:['conjugation:biti:2s'] },
  { id:'p-kako', prompt:'Was bedeutet „Kako si?“', answer:'Wie geht es dir?', alternatives:['Wie geht es dir?','Wo bist du?','Wohin gehst du?'], level:'A2', skills:['wortschatz','lesen'], learningTargets:['vocab:kako si'] },
  { id:'p-listen', prompt:'Höre das Wort. Was bedeutet es?', audioPrompt:'Hvala.', answer:'Danke', alternatives:['Danke','Bitte','Hallo'], level:'A2', skills:['hören','wortschatz'], learningTargets:['vocab:hvala','skill:hören'] },
]

export type PlacementEvidence = {
  level: CEFRLevel
  correct: number
  total: number
  knownTargets: string[]
  weakTargets: string[]
}

export function shouldContinueToA2(a1Correct: number) {
  return a1Correct >= 4
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
