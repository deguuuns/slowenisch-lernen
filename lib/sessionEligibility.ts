import { getCurrentBeginnerPhase, isBeginnerFoundationComplete } from '../data/beginnerCurriculum'
import type { Exercise, KnowledgeStage, LearnerProfile, UserProgress } from '@/types'
import type { SessionState } from './learningEngine'
import { isExerciseUnlocked } from './prerequisites'

const RECENT_CONTENT_WINDOW = 8
const normalizeKey = (value: string) => value.toLocaleLowerCase('sl-SI').trim()

const LEGACY_GRAMMAR_REQUIREMENTS: Record<string, string> = {
  'location-direction': 'location-direction',
  location: 'location-direction',
  direction: 'location-direction',
  'case-location': 'location-direction',
  'case-direction': 'location-direction',
  preposition: 'location-direction',
  dual: 'dual',
  'time-number-form': 'time-number-form',
  accusative: 'accusative',
  negation: 'negation',
}

const STAGE_RANK: Record<KnowledgeStage, number> = {
  unseen: 0,
  introduced: 1,
  recognition: 2,
  recall: 3,
  production: 4,
  familiar: 4,
  mastered: 5,
  review_due: 5,
}

function targetsFor(exercise: Exercise) {
  if (exercise.learningTargets?.length) return exercise.learningTargets
  const targets = [`lesson:${exercise.lesson}`]
  if (exercise.grammarTag) targets.push(`grammar:${exercise.grammarTag}`)
  return targets
}

function isProductive(exercise: Exercise) {
  return exercise.learningPhase === 'production' || exercise.learningPhase === 'transfer' || ['translate-de-sl', 'free', 'ending', 'listen-answer', 'speak-answer', 'transform'].includes(exercise.type)
}

function wasCorrectInThisSession(exercise: Exercise, session: SessionState) {
  return session.history.some(item => item.exerciseId === exercise.id && item.correct)
}

function targetSessionStats(exercise: Exercise, session: SessionState) {
  const targets = new Set(targetsFor(exercise))
  const matching = session.history.filter(item => item.learningTargets.some(target => targets.has(target)))
  return {
    appearances: matching.length,
    successes: matching.filter(item => item.correct).length,
    failures: matching.filter(item => !item.correct).length,
  }
}

function targetRecentlyFailed(exercise: Exercise, session: SessionState) {
  const targets = new Set(targetsFor(exercise))
  return session.history.slice(-6).some(item => !item.correct && item.learningTargets.some(target => targets.has(target)))
}

function sameContentWasRecentlyUsed(exercise: Exercise, session: SessionState) {
  const key = exercise.contentKey ?? exercise.answer
  return session.history.slice(-RECENT_CONTENT_WINDOW).some(item => item.contentKey === key)
}

function targetBudgetReached(exercise: Exercise, session: SessionState) {
  const stats = targetSessionStats(exercise, session)
  if (stats.failures > 0) return stats.appearances >= 4
  if (stats.successes >= 2) return stats.appearances >= 2
  return stats.appearances >= 3
}

function isSecureAndNotDue(exercise: Exercise, progress: UserProgress, now: number) {
  const state = progress.learningItems?.[`exercise:${exercise.id}`]
  return !!state && state.attempts >= 3 && state.mastery >= 0.82 && !!state.nextDueAt && state.nextDueAt > now
}

function requiredGrammarFor(exercise: Exercise) {
  const explicit = exercise.requiredGrammar ?? []
  const inferred = exercise.grammarTag ? LEGACY_GRAMMAR_REQUIREMENTS[exercise.grammarTag] : undefined
  return Array.from(new Set([...explicit, ...(inferred ? [inferred] : [])]))
}

function prerequisitesAreKnown(exercise: Exercise, progress: UserProgress) {
  const vocabulary = new Set((progress.introducedVocabulary ?? []).map(normalizeKey))
  const grammar = new Set(progress.introducedGrammar ?? [])

  if (exercise.requiredVocabulary?.some(item => !vocabulary.has(normalizeKey(item)))) return false
  if (exercise.type !== 'introduce' && requiredGrammarFor(exercise).some(item => !grammar.has(item))) return false
  if (exercise.requiredLearningItems?.some(key => (progress.learningItems?.[key]?.mastery ?? 0) < 0.5)) return false
  return true
}

function targetStageSatisfied(exercise: Exercise, progress: UserProgress) {
  if (!exercise.requiredTargetStage) return true
  const required = STAGE_RANK[exercise.requiredTargetStage]
  const meaningfulTargets = targetsFor(exercise).filter(target => target.startsWith('vocab:') || target.startsWith('grammar:') || target.startsWith('verb:') || target.startsWith('conjugation:') || target.startsWith('pattern:'))
  if (!meaningfulTargets.length) return true
  return meaningfulTargets.every(target => {
    const state = progress.learningItems?.[target]
    if (!state) return false
    if (exercise.requiredTargetStage === 'recognition' && (state.receptiveMastery ?? 0) >= 0.18) return true
    if (exercise.requiredTargetStage === 'recall' && (state.recallMastery ?? 0) >= 0.18) return true
    if (exercise.requiredTargetStage === 'production' && (state.productiveMastery ?? 0) >= 0.18) return true
    const stage = state.stage ?? (state.introduced ? 'introduced' : 'unseen')
    return STAGE_RANK[stage] >= required
  })
}

function currentPhaseStillHasUnseenIntroductions(exercises: Exercise[], progress: UserProgress, phase: number) {
  const introduced = new Set((progress.introducedVocabulary ?? []).map(normalizeKey))
  const grammar = new Set(progress.introducedGrammar ?? [])
  return exercises.some(exercise => {
    if (exercise.curriculumPhase !== phase || exercise.type !== 'introduce') return false
    const newVocabulary = exercise.introducesVocabulary ?? []
    const newGrammar = exercise.introducesGrammar ?? []
    return newVocabulary.some(item => !introduced.has(normalizeKey(item))) || newGrammar.some(item => !grammar.has(item))
  })
}

function isNextIntroduction(exercise: Exercise, exercises: Exercise[], progress: UserProgress, phase: number) {
  if (exercise.curriculumPhase !== phase || exercise.type !== 'introduce') return false
  const introduced = new Set((progress.introducedVocabulary ?? []).map(normalizeKey))
  const grammar = new Set(progress.introducedGrammar ?? [])
  const unseen = exercises
    .filter(item => item.curriculumPhase === phase && item.type === 'introduce')
    .filter(item => (item.introducesVocabulary ?? []).some(value => !introduced.has(normalizeKey(value))) || (item.introducesGrammar ?? []).some(value => !grammar.has(value)))
    .sort((a, b) => (a.curriculumOrder ?? 999) - (b.curriculumOrder ?? 999))
  return unseen[0]?.id === exercise.id
}

function newItemBudgetReached(exercise: Exercise, session: SessionState) {
  const max = exercise.maxNewItemsInSession ?? 5
  const introduced = session.history.filter(item => item.learningPhase === 'new').length
  return introduced >= max
}

function curriculumAllows(exercise: Exercise, exercises: Exercise[], progress: UserProgress, session: SessionState, profile: LearnerProfile | null) {
  const hasCurriculumContent = exercises.some(item => item.curriculumPhase !== undefined)
  if (!hasCurriculumContent) return true
  if (profile?.startMode !== 'zero' || isBeginnerFoundationComplete(progress)) return true

  const phase = getCurrentBeginnerPhase(progress).id
  if (!exercise.curriculumPhase) return false
  if (exercise.curriculumPhase > phase) return false
  if (exercise.curriculumPhase < phase) return exercise.type !== 'introduce'

  const introductionsPending = currentPhaseStillHasUnseenIntroductions(exercises, progress, phase)
  if (introductionsPending) {
    // Important: once the session has reached its new-item budget, do NOT block the
    // whole phase. That used to create the "Keine passende Aufgabe gefunden" dead end:
    // more introductions were pending, but the budget forbade them and recognition
    // exercises were also rejected. We now pause further NEW items and practise the
    // already introduced material until the next session.
    if (exercise.type === 'introduce') {
      if (newItemBudgetReached(exercise, session)) return false
      return isNextIntroduction(exercise, exercises, progress, phase)
    }
    if (!newItemBudgetReached(exercise, session)) return false
    return true
  }

  return true
}

function passesHardSafetyGates(
  exercise: Exercise,
  progress: UserProgress,
  session: SessionState,
  profile: LearnerProfile | null,
  now: number,
  allExercises: Exercise[],
) {
  if (!isExerciseUnlocked(exercise, progress, profile)) return false
  if (!curriculumAllows(exercise, allExercises, progress, session, profile)) return false
  if (profile?.startMode === 'zero' && !exercise.contentKey) return false
  if (wasCorrectInThisSession(exercise, session)) return false
  if (isSecureAndNotDue(exercise, progress, now)) return false
  if (!prerequisitesAreKnown(exercise, progress)) return false
  if (!targetStageSatisfied(exercise, progress)) return false

  if (isProductive(exercise)) {
    const vocabulary = new Set((progress.introducedVocabulary ?? []).map(normalizeKey))
    if (exercise.requiredVocabulary?.some(item => !vocabulary.has(normalizeKey(item)))) return false
    const targetStates = targetsFor(exercise).map(target => progress.learningItems?.[target]).filter(Boolean)
    if (exercise.learningPhase === 'production' || exercise.learningPhase === 'transfer') {
      if (targetStates.some(state => STAGE_RANK[state?.stage ?? 'unseen'] < STAGE_RANK.recall)) return false
    }
  }

  return true
}

export function isEligibleForAdaptiveSession(
  exercise: Exercise,
  progress: UserProgress,
  session: SessionState,
  profile: LearnerProfile | null,
  now = Date.now(),
  allExercises: Exercise[] = [exercise],
) {
  if (!passesHardSafetyGates(exercise, progress, session, profile, now, allExercises)) return false

  if (sameContentWasRecentlyUsed(exercise, session) && !targetRecentlyFailed(exercise, session)) return false
  if (targetBudgetReached(exercise, session) && !targetRecentlyFailed(exercise, session)) return false

  return true
}

function isEligibleFallback(
  exercise: Exercise,
  progress: UserProgress,
  session: SessionState,
  profile: LearnerProfile | null,
  now: number,
  allExercises: Exercise[],
) {
  if (!passesHardSafetyGates(exercise, progress, session, profile, now, allExercises)) return false

  // Fallback may relax only presentation spacing. It never bypasses curriculum,
  // prerequisites, stage gates, unknown vocabulary or an exercise already solved
  // correctly in this session.
  const stats = targetSessionStats(exercise, session)
  if (stats.failures === 0 && stats.successes >= 2) return false
  return true
}

export function eligibleAdaptiveContent(
  exercises: Exercise[],
  progress: UserProgress,
  session: SessionState,
  profile: LearnerProfile | null,
  now = Date.now(),
) {
  const preferred = exercises.filter(exercise => isEligibleForAdaptiveSession(exercise, progress, session, profile, now, exercises))
  if (preferred.length) return preferred

  // Controlled fallback hierarchy: keep every didactic safety rule, but allow a
  // different presentation of material that is genuinely still in learning. If even
  // that pool is empty, the caller can end the session cleanly instead of inventing
  // unsafe content.
  return exercises.filter(exercise => isEligibleFallback(exercise, progress, session, profile, now, exercises))
}
