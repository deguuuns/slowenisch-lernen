import type { Exercise, KnowledgeStage, LearningItemKind, LearningItemState, MistakeCategory, UserProgress } from '@/types'
import { getLearningTargets, updateLearnerState } from './learningEngine'

export type AssistedOutcome = {
  correct: boolean
  responseMs: number
  mistakeCategory?: MistakeCategory
  hintsUsed?: number
}

export function knowledgeStage(state: LearningItemState | undefined, now = Date.now()): KnowledgeStage {
  if (!state) return 'unseen'
  if (state.nextDueAt !== undefined && state.nextDueAt <= now && state.mastery >= 0.35) return 'review_due'
  if (state.mastery >= 0.82 && state.correctStreak >= 2) return 'mastered'
  if ((state.productiveMastery ?? 0) >= 0.45) return 'production'
  if ((state.recallMastery ?? 0) >= 0.35) return 'recall'
  if ((state.receptiveMastery ?? 0) >= 0.25) return 'recognition'
  if (state.mastery >= 0.62) return 'familiar'
  if (state.mastery >= 0.25) return 'learning'
  if (state.introduced || state.stage === 'introduced') return 'introduced'
  if (state.attempts === 0) return 'unseen'
  return 'introduced'
}

function kindForTarget(target: string): LearningItemKind {
  if (target.startsWith('vocab:')) return 'vocabulary'
  if (target.startsWith('chunk:')) return 'chunk'
  if (target.startsWith('grammar:')) return 'grammar'
  if (target.startsWith('verb:')) return 'verb'
  if (target.startsWith('conjugation:')) return 'conjugation'
  if (target.startsWith('skill:') || target.startsWith('pattern:')) return 'pattern'
  return 'lesson'
}

function stageEvidence(exercise: Exercise, previous: LearningItemState | undefined, next: LearningItemState, outcome: AssistedOutcome) {
  const helpFactor = Math.max(0.25, 1 - Math.max(0, outcome.hintsUsed ?? 0) * 0.2)
  const evidence = outcome.correct ? 0.22 * helpFactor : -0.08
  const phase = exercise.learningPhase
  const receptiveMastery = phase === 'recognition' || phase === 'new'
    ? Math.max(0, Math.min(1, (previous?.receptiveMastery ?? 0) + evidence))
    : (previous?.receptiveMastery ?? next.receptiveMastery ?? 0)
  const recallMastery = phase === 'recall' || phase === 'application'
    ? Math.max(0, Math.min(1, (previous?.recallMastery ?? 0) + evidence))
    : (previous?.recallMastery ?? next.recallMastery ?? 0)
  const productiveMastery = phase === 'production' || phase === 'transfer'
    ? Math.max(0, Math.min(1, (previous?.productiveMastery ?? 0) + evidence))
    : (previous?.productiveMastery ?? next.productiveMastery ?? 0)
  return { receptiveMastery, recallMastery, productiveMastery }
}

function applyHelpPenalty(previous: LearningItemState | undefined, next: LearningItemState, hintsUsed: number, kind?: LearningItemKind) {
  if (!hintsUsed) {
    const adjusted = { ...next, kind: kind ?? next.kind, lastHintsUsed: 0 }
    return { ...adjusted, stage: knowledgeStage(adjusted) }
  }

  const previousMastery = previous?.mastery ?? 0
  const rawGain = Math.max(0, next.mastery - previousMastery)
  const gainFactor = Math.max(0.2, 1 - hintsUsed * 0.25)
  const mastery = previousMastery + rawGain * gainFactor
  const adjusted = {
    ...next,
    kind: kind ?? next.kind,
    mastery,
    totalHintsUsed: (previous?.totalHintsUsed ?? 0) + hintsUsed,
    lastHintsUsed: hintsUsed,
  }
  return { ...adjusted, stage: knowledgeStage(adjusted) }
}

export function updateLearnerStateWithHelp(
  progress: UserProgress,
  exercise: Exercise,
  outcome: AssistedOutcome,
  now = Date.now(),
): UserProgress {
  const previousItems = progress.learningItems ?? {}
  const next = updateLearnerState(progress, exercise, outcome, now)
  const items = { ...(next.learningItems ?? {}) }
  const hintsUsed = Math.max(0, outcome.hintsUsed ?? 0)

  const exerciseKey = `exercise:${exercise.id}`
  if (items[exerciseKey]) {
    const evidence = stageEvidence(exercise, previousItems[exerciseKey], items[exerciseKey], outcome)
    items[exerciseKey] = applyHelpPenalty(previousItems[exerciseKey], { ...items[exerciseKey], ...evidence }, hintsUsed, 'exercise')
  }

  for (const target of getLearningTargets(exercise)) {
    if (items[target]) {
      const evidence = stageEvidence(exercise, previousItems[target], items[target], outcome)
      items[target] = applyHelpPenalty(previousItems[target], { ...items[target], ...evidence }, hintsUsed, kindForTarget(target))
    }
  }

  return { ...next, learningItems: items }
}
