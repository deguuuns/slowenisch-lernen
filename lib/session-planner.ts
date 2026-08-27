import { vocabulary as canonicalVocabulary } from '@/data/vocabulary-catalog'
import { buildAdaptiveReviewDeck } from '@/lib/adaptive-curriculum'
import { dedupeExercisesByTarget, dedupeExercisesSemantically } from '@/lib/learning-targets'
import { buildPracticeDeck, choosePracticeIntent } from '@/lib/practice-engine'
import { assessSessionLoad, exercisesForMinutes, type SessionLoadLevel } from '@/lib/session-load'
import { Exercise, UserProgress, Vocabulary } from '@/types'

export type SessionPlan = {
  total: number
  review: number
  transfer: number
  weakGrammar: number
  weakVocabulary: number
  production: number
  newContent: number
  goalMinutes: number
  recommendedMinutes: number
  loadLevel: SessionLoadLevel
  loadReason: string
  exerciseItems: Exercise[]
}

export function buildSessionPlan(progress: UserProgress, rawExercises: Exercise[], _activeLesson: number, vocabulary: Vocabulary[] = canonicalVocabulary): SessionPlan {
  const load = assessSessionLoad(progress)
  const requested = exercisesForMinutes(load.recommendedMinutes)
  const now = Date.now()
  const dueDeck = buildAdaptiveReviewDeck(progress, rawExercises, requested, now, vocabulary)
  const adaptiveDeck = buildPracticeDeck(progress, rawExercises, requested, now)
  // A different exercise id or card type does not make an equivalent prompt/answer fresh.
  const semantic = dedupeExercisesSemantically([...dueDeck, ...adaptiveDeck], requested * 2)
  const deck = dedupeExercisesByTarget(semantic, requested).slice(0, requested).map(exercise => ({ ...exercise }))
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
    goalMinutes: load.goalMinutes,
    recommendedMinutes: load.recommendedMinutes,
    loadLevel: load.level,
    loadReason: load.reason,
    exerciseItems: deck,
  }
}

export function exercisesForPlan(plan: SessionPlan, _rawExercises?: Exercise[]) { return plan.exerciseItems.map(exercise => ({ ...exercise })) }
