import { buildAdaptiveReviewDeck } from '@/lib/adaptive-curriculum'
import { isExerciseEligible } from '@/lib/curriculum-access'
import { enrichExercises } from '@/lib/curriculum-metadata'
import { dedupeExercisesByTarget } from '@/lib/learning-targets'
import { Exercise, UserProgress } from '@/types'

export type SessionPlan = {
  total: number
  review: number
  transfer: number
  weakGrammar: number
  weakVocabulary: number
  production: number
  newContent: number
  exerciseItems: Exercise[]
}

function targetSize(progress: UserProgress) {
  const minutes = progress.preferences.dailyGoalMinutes
  return minutes <= 5 ? 5 : minutes <= 10 ? 8 : minutes <= 15 ? 10 : minutes <= 20 ? 12 : 15
}

export function buildSessionPlan(progress: UserProgress, rawExercises: Exercise[], _activeLesson: number): SessionPlan {
  const eligible = enrichExercises(rawExercises).filter(exercise => isExerciseEligible(exercise, progress))
  const requested = targetSize(progress)
  const now = Date.now()
  const due = (progress.reviews || []).filter(review => review.dueAt <= now).length
  const transfer = Math.min((progress.transferQueue || []).filter(item => progress.introducedGrammarRules.includes(item.grammarRuleId) && item.dueAfter <= (progress.recentAttempts?.length || 0)).length, 2)

  // Review sessions are no longer padded with arbitrary eligible exercises.
  // If only three targets are due, the review session has three targets.
  const deck = dedupeExercisesByTarget(buildAdaptiveReviewDeck(progress, eligible, requested, now), requested).map(exercise => ({ ...exercise }))

  return {
    total: deck.length,
    review: Math.min(deck.length, due),
    transfer: Math.min(deck.length, transfer),
    weakGrammar: 0,
    weakVocabulary: 0,
    production: deck.filter(exercise => exercise.skillTargets?.includes('production')).length,
    newContent: 0,
    exerciseItems: deck,
  }
}

export function exercisesForPlan(plan: SessionPlan, _rawExercises?: Exercise[]) {
  return plan.exerciseItems.map(exercise => ({ ...exercise }))
}
