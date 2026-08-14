import type { Exercise, KnowledgeStage, LearningItemKind, LearningItemState, MistakeCategory, UserProgress } from '@/types'
import { getLearningTargets, updateLearnerState } from './learningEngine'

export type AssistedOutcome = {
  correct: boolean
  responseMs: number
  mistakeCategory?: MistakeCategory
  hintsUsed?: number
}

export function knowledgeStage(state: LearningItemState | undefined, now = Date.now()): KnowledgeStage {
  if (!state || state.attempts === 0) return 'unseen'
  if (state.nextDueAt !== undefined && state.nextDueAt <= now && state.mastery >= 0.35) return 'review_due'
  if (state.mastery >= 0.82 && state.correctStreak >= 2) return 'mastered'
  if (state.mastery >= 0.62) return 'familiar'
  if (state.mastery >= 0.25) return 'learning'
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
    items[exerciseKey] = applyHelpPenalty(previousItems[exerciseKey], items[exerciseKey], hintsUsed, 'exercise')
  }

  for (const target of getLearningTargets(exercise)) {
    if (items[target]) items[target] = applyHelpPenalty(previousItems[target], items[target], hintsUsed, kindForTarget(target))
  }

  return { ...next, learningItems: items }
}
