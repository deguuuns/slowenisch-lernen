import { vocabulary as seedVocabulary } from '@/data/seed'
import { buildAdaptiveReviewDeck } from '@/lib/adaptive-curriculum'
import { dedupeExercisesByTarget } from '@/lib/learning-targets'
import { buildPracticeDeck, choosePracticeIntent } from '@/lib/practice-engine'
import { Exercise, UserProgress, Vocabulary } from '@/types'

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

export function buildSessionPlan(progress: UserProgress, rawExercises: Exercise[], _activeLesson: number, vocabulary: Vocabulary[] = seedVocabulary): SessionPlan {
  const requested = targetSize(progress)
  const now = Date.now()

  // Preserve generated due-review/transfer exercises, then let the central Practice Engine
  // fill the remaining slots according to the learner's weakest current need.
  const dueDeck = buildAdaptiveReviewDeck(progress, rawExercises, requested, now, vocabulary)
  const adaptiveDeck = buildPracticeDeck(progress, rawExercises, requested, now)
  const deck = dedupeExercisesByTarget([...dueDeck, ...adaptiveDeck], requested).slice(0, requested).map(exercise => ({ ...exercise }))

  const intents = deck.map(exercise => choosePracticeIntent(progress, exercise, now))
  const weakGrammar = deck.filter((exercise,index)=>intents[index]==='repair-weakness' && (exercise.grammarRuleIds?.length||exercise.requiredVerbForms?.length)).length
  const weakVocabulary = deck.filter((exercise,index)=>intents[index]==='repair-weakness' && exercise.vocabularyIds?.length).length

  return {
    total: deck.length,
    review: intents.filter(intent=>intent==='review-due').length,
    transfer: deck.filter(exercise=>Boolean(exercise.transferSourceExerciseId)).length,
    weakGrammar,
    weakVocabulary,
    production: deck.filter(exercise => exercise.skillTargets?.includes('production') || exercise.skillTargets?.includes('speaking')).length,
    newContent: 0,
    exerciseItems: deck,
  }
}

export function exercisesForPlan(plan: SessionPlan, _rawExercises?: Exercise[]) {
  return plan.exerciseItems.map(exercise => ({ ...exercise }))
}
