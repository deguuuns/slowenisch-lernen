import { buildAdaptiveReviewDeck } from '@/lib/adaptive-curriculum'
import { isExerciseEligible } from '@/lib/curriculum-access'
import { enrichExercises } from '@/lib/curriculum-metadata'
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

function signature(exercise: Exercise) {
  return `${exercise.type}|${(exercise.vocabularyIds || []).slice().sort().join(',')}|${(exercise.grammarRuleIds || []).slice().sort().join(',')}`
}

function diversify(exercises: Exercise[], recentIds: Set<string>, limit: number) {
  const selected: Exercise[] = []
  const used = new Set<string>()
  for (const exercise of exercises) {
    const key = signature(exercise)
    if (recentIds.has(exercise.id) || used.has(key)) continue
    selected.push(exercise)
    used.add(key)
    if (selected.length >= limit) break
  }
  if (selected.length < limit) {
    for (const exercise of exercises) {
      if (selected.some(item => item.id === exercise.id) || recentIds.has(exercise.id)) continue
      selected.push(exercise)
      if (selected.length >= limit) break
    }
  }
  return selected
}

export function buildSessionPlan(
  progress: UserProgress,
  rawExercises: Exercise[],
  _activeLesson: number,
): SessionPlan {
  const eligible = enrichExercises(rawExercises).filter(exercise => isExerciseEligible(exercise, progress))
  const requested = targetSize(progress)
  const due = progress.reviews.filter(review => review.dueAt <= Date.now()).length
  const transfer = Math.min(
    (progress.transferQueue || []).filter(item => progress.introducedGrammarRules.includes(item.grammarRuleId)).length,
    2,
  )
  const weakGrammar = Object.values(progress.mastery || {}).filter(item =>
    item.kind === 'grammar' && item.attempts >= 2 && item.score < .58 &&
    progress.introducedGrammarRules.includes(item.key.replace('grammar:', '')),
  ).length
  const weakVocabulary = Object.values(progress.mastery || {}).filter(item =>
    item.kind === 'vocabulary' && item.attempts >= 2 && item.score < .58 &&
    progress.introducedWords.includes(item.key.replace('vocab:', '')),
  ).length

  const deck = buildAdaptiveReviewDeck(progress, eligible, requested)
  const recentIds = new Set((progress.recentAttempts || []).slice(-6).map(attempt => attempt.exerciseId))
  const selected = diversify(deck, recentIds, requested).map(exercise => ({ ...exercise }))
  const review = Math.min(selected.length, Math.max(due, Math.ceil(requested * .3)))

  return {
    total: selected.length,
    review,
    transfer,
    weakGrammar: Math.min(2, weakGrammar),
    weakVocabulary: Math.min(2, weakVocabulary),
    production: Math.min(2, Math.max(1, Math.round(requested * .15))),
    newContent: 0,
    // This is the exact runtime deck. Generated transfer exercises are retained here
    // instead of being reconstructed from seed IDs later.
    exerciseItems: selected,
  }
}

export function exercisesForPlan(plan: SessionPlan, _rawExercises?: Exercise[]) {
  return plan.exerciseItems.map(exercise => ({ ...exercise }))
}
