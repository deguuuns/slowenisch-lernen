import type { UserProgress } from '@/types'

export type BeginnerCurriculumPhase = {
  id: number
  title: string
  goal: string
  newItems: string[]
  unlockMastery: number
}

export const beginnerCurriculum: BeginnerCurriculumPhase[] = [
  { id: 1, title: 'Erste Wörter', goal: 'Fünf sehr häufige Alltagswörter verstehen und wiedererkennen.', newItems: ['živjo','hvala','prosim','ja','ne'], unlockMastery: 0.18 },
  { id: 2, title: 'Begrüßungen im Tagesverlauf', goal: 'Typische Begrüßungen als feste Wendungen verstehen.', newItems: ['dobro jutro','dober dan','dober večer','lahko noč','nasvidenje'], unlockMastery: 0.18 },
  { id: 3, title: 'Erster Mini-Dialog', goal: 'Eine sehr kurze Begrüßung verstehen und passend reagieren.', newItems: ['kako si','dobro','in ti'], unlockMastery: 0.18 },
  { id: 4, title: 'Personen', goal: 'Die wichtigsten Personalpronomen erkennen.', newItems: ['jaz','ti','on','ona'], unlockMastery: 0.18 },
  { id: 5, title: 'Ich bin / du bist', goal: 'Die ersten zwei Formen von biti sicher unterscheiden.', newItems: ['sem','si','doma'], unlockMastery: 0.2 },
  { id: 6, title: 'sem / si / je', goal: 'Die dritte häufige Form von biti ergänzen.', newItems: ['je'], unlockMastery: 0.2 },
  { id: 7, title: 'Herkunft', goal: 'Nach Herkunft fragen und eine einfache Herkunft verstehen.', newItems: ['od kod','iz','Slovenija','Nemčija'], unlockMastery: 0.18 },
  { id: 8, title: 'Wohnort', goal: 'Nach einem Wohnort fragen und einfache Ortsangaben verstehen.', newItems: ['kje','živim','živiš','v'], unlockMastery: 0.18 },
  { id: 9, title: 'Bewegung', goal: 'Nach einem Ziel fragen und einfache Bewegungsantworten verstehen.', newItems: ['kam','grem','domov'], unlockMastery: 0.18 },
  { id: 10, title: 'KJE oder KAM?', goal: 'Ort und Richtung bewusst unterscheiden und erst jetzt die Formen aktiv anwenden.', newItems: [], unlockMastery: 0.2 },
]

export const a1ExpansionStage: BeginnerCurriculumPhase = {
  id: 11,
  title: 'A1-Aufbau',
  goal: 'Die Beginner-Grundlage ist abgeschlossen. Jetzt werden Wortschatz, Verben, Alltag und Grammatik schrittweise erweitert.',
  newItems: [],
  unlockMastery: 1,
}

function itemRecognition(progress: UserProgress, item: string) {
  const state = progress.learningItems?.[`vocab:${item}`]
  if (!state) return 0
  const explicit = state.receptiveMastery ?? 0
  const stageEvidence = state.stage === 'recognition' || state.stage === 'recall' || state.stage === 'production' || state.stage === 'familiar' || state.stage === 'mastered' || state.stage === 'review_due' ? 0.25 : 0
  const assessedRecognition = state.correctCount > 0 && state.attempts > 0 ? 0.22 : 0
  return Math.max(explicit, stageEvidence, assessedRecognition)
}

export function isCurriculumPhaseComplete(progress: UserProgress, phase: BeginnerCurriculumPhase) {
  if (phase.id === a1ExpansionStage.id) return false
  if (!phase.newItems.length) {
    const grammar = progress.learningItems?.['grammar:location-direction']
    return (grammar?.receptiveMastery ?? grammar?.mastery ?? 0) >= phase.unlockMastery
  }
  return phase.newItems.every(item => itemRecognition(progress, item) >= phase.unlockMastery)
}

export function isBeginnerFoundationComplete(progress: UserProgress) {
  return beginnerCurriculum.every(phase => isCurriculumPhaseComplete(progress, phase))
}

/** Returns phase 11 after the beginner foundation instead of looping on phase 10. */
export function getCurrentBeginnerPhase(progress: UserProgress): BeginnerCurriculumPhase {
  return beginnerCurriculum.find(phase => !isCurriculumPhaseComplete(progress, phase)) ?? a1ExpansionStage
}

export function getBeginnerSessionGoal(progress: UserProgress) {
  const phase = getCurrentBeginnerPhase(progress)
  return {
    phase: phase.id,
    title: phase.title,
    goal: phase.goal,
    newItems: phase.newItems,
    foundationComplete: phase.id === a1ExpansionStage.id,
  }
}
