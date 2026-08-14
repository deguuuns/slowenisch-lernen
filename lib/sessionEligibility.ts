import type { Exercise, LearnerProfile, UserProgress } from '@/types'
import type { SessionState } from './learningEngine'
import { isExerciseUnlocked } from './prerequisites'

const MAX_TARGET_APPEARANCES_PER_SESSION = 3
const RECENT_CONTENT_WINDOW = 8

function targetsFor(exercise: Exercise) {
  if (exercise.learningTargets?.length) return exercise.learningTargets
  const targets = [`lesson:${exercise.lesson}`]
  if (exercise.grammarTag) targets.push(`grammar:${exercise.grammarTag}`)
  return targets
}

function isProductive(exercise: Exercise) {
  return ['translate-de-sl', 'free', 'ending', 'listen-answer', 'speak-answer', 'transform'].includes(exercise.type)
}

function wasCorrectInThisSession(exercise: Exercise, session: SessionState) {
  return session.history.some(item => item.exerciseId === exercise.id && item.correct)
}

function targetAppearances(exercise: Exercise, session: SessionState) {
  const targets = new Set(targetsFor(exercise))
  return session.history.filter(item => item.learningTargets.some(target => targets.has(target))).length
}

function targetRecentlyFailed(exercise: Exercise, session: SessionState) {
  const targets = new Set(targetsFor(exercise))
  return session.history.slice(-6).some(item => !item.correct && item.learningTargets.some(target => targets.has(target)))
}

function sameContentWasRecentlyUsed(exercise: Exercise, session: SessionState) {
  const key = exercise.contentKey ?? exercise.answer
  return session.history.slice(-RECENT_CONTENT_WINDOW).some(item => item.contentKey === key)
}

function isSecureAndNotDue(exercise: Exercise, progress: UserProgress, now: number) {
  const state = progress.learningItems?.[`exercise:${exercise.id}`]
  return !!state && state.attempts >= 3 && state.mastery >= 0.82 && !!state.nextDueAt && state.nextDueAt > now
}

function productionPrerequisitesAreExplicitlyKnown(exercise: Exercise, progress: UserProgress) {
  if (!isProductive(exercise)) return true

  const vocabulary = new Set(progress.introducedVocabulary ?? [])
  const grammar = new Set(progress.introducedGrammar ?? [])

  if (exercise.requiredVocabulary?.some(item => !vocabulary.has(item))) return false
  if (exercise.requiredGrammar?.some(item => !grammar.has(item))) return false
  if (exercise.requiredLearningItems?.some(key => (progress.learningItems?.[key]?.mastery ?? 0) < 0.5)) return false
  return true
}

export function isEligibleForAdaptiveSession(
  exercise: Exercise,
  progress: UserProgress,
  session: SessionState,
  profile: LearnerProfile | null,
  now = Date.now(),
) {
  if (!isExerciseUnlocked(exercise, progress, profile)) return false

  // A concrete question that was solved correctly has done its job for this session.
  if (wasCorrectInThisSession(exercise, session)) return false

  // Do not actively test secure content again before its spaced-repetition due date.
  // The same vocabulary may still occur naturally inside a different exercise.
  if (isSecureAndNotDue(exercise, progress, now)) return false

  // Productive tasks must never require linguistic material that has not been introduced.
  if (!productionPrerequisitesAreExplicitlyKnown(exercise, progress)) return false

  // A current weakness may recur, but normally with another sentence/context.
  if (sameContentWasRecentlyUsed(exercise, session) && !targetRecentlyFailed(exercise, session)) return false

  // Stop one learning target from dominating a whole session. A recent error may override this cap.
  if (targetAppearances(exercise, session) >= MAX_TARGET_APPEARANCES_PER_SESSION && !targetRecentlyFailed(exercise, session)) return false

  return true
}

export function eligibleAdaptiveContent(
  exercises: Exercise[],
  progress: UserProgress,
  session: SessionState,
  profile: LearnerProfile | null,
  now = Date.now(),
) {
  return exercises.filter(exercise => isEligibleForAdaptiveSession(exercise, progress, session, profile, now))
}
