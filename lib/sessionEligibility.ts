import { getCurrentBeginnerPhase } from '../data/beginnerCurriculum'
import type { Exercise, KnowledgeStage, LearnerProfile, LearningItemState, UserProgress } from '@/types'
import type { SessionState } from './learningEngine'
import { isExerciseUnlocked } from './prerequisites'

const RECENT_CONTENT_WINDOW = 8
const CROSS_SESSION_COOLDOWN_MS = 24 * 60 * 60_000
const normalizeKey = (value: string) => value.toLocaleLowerCase('sl-SI').trim()

const LEGACY_GRAMMAR_REQUIREMENTS: Record<string, string> = {
  'location-direction': 'location-direction', location: 'location-direction', direction: 'location-direction',
  'case-location': 'location-direction', 'case-direction': 'location-direction', preposition: 'location-direction',
  dual: 'dual', 'time-number-form': 'time-number-form', accusative: 'accusative', negation: 'negation',
}

const STAGE_RANK: Record<KnowledgeStage, number> = {
  unseen: 0, introduced: 1, recognition: 2, recall: 3, production: 4, familiar: 4, mastered: 5, review_due: 5,
}

function meaningfulLearningItemCount(progress: UserProgress) {
  return Object.entries(progress.learningItems ?? {}).filter(([key, state]) => {
    const meaningful = key.startsWith('vocab:') || key.startsWith('chunk:') || key.startsWith('grammar:') || key.startsWith('verb:') || key.startsWith('conjugation:') || key.startsWith('pattern:')
    if (!meaningful) return false
    const stage = state.stage ?? (state.introduced ? 'introduced' : 'unseen')
    return STAGE_RANK[stage] >= STAGE_RANK.recognition || (state.receptiveMastery ?? 0) >= 0.25 || state.mastery >= 0.3
  }).length
}

/**
 * Curriculum safety follows actual knowledge, not only the profile's original start mode.
 * This is important after an explicit progress reset: an old self-assessment profile with
 * empty learning data must behave like a real zero beginner until evidence exists again.
 */
export function requiresCurriculumSafety(progress: UserProgress, profile: LearnerProfile | null) {
  if (profile?.startMode === 'zero') return true
  const introducedCount = (progress.introducedVocabulary?.length ?? 0) + (progress.introducedGrammar?.length ?? 0)
  return introducedCount < 4 && meaningfulLearningItemCount(progress) < 3
}

function targetsFor(exercise: Exercise) {
  if (exercise.learningTargets?.length) return exercise.learningTargets
  const targets = [`lesson:${exercise.lesson}`]
  if (exercise.grammarTag) targets.push(`grammar:${exercise.grammarTag}`)
  return targets
}

function activeTargetsFor(exercise: Exercise) {
  const contextOnly = new Set(exercise.contextOnlyTargets ?? [])
  return targetsFor(exercise).filter(target => !contextOnly.has(target))
}

export function canActivelyTestLearningItem(state: LearningItemState | undefined, now = Date.now()) {
  if (!state) return true
  if (state.incorrectStreak > 0 || (state.lastHintsUsed ?? 0) > 0) return true
  if (state.nextDueAt !== undefined) return state.nextDueAt <= now
  if (state.activeTestCooldownUntil !== undefined && state.activeTestCooldownUntil > now) return false
  return true
}

function activeTargetsAreAvailable(exercise: Exercise, progress: UserProgress, now: number) {
  if (exercise.type === 'introduce') return true
  return activeTargetsFor(exercise).every(target => canActivelyTestLearningItem(progress.learningItems?.[target], now))
}

function isProductive(exercise: Exercise) {
  return exercise.learningPhase === 'production' || exercise.learningPhase === 'transfer' || ['translate-de-sl', 'free', 'ending', 'listen-answer', 'speak-answer', 'transform'].includes(exercise.type)
}

function hasExplicitProductionDependencies(exercise: Exercise) {
  return !!(
    exercise.requiredVocabulary?.length ||
    exercise.requiredGrammar?.length ||
    exercise.requiredLearningItems?.length
  )
}

function hasCompleteIntroductionMetadata(exercise: Exercise) {
  if (exercise.type !== 'introduce') return true
  const introducesSomething = !!(exercise.introducesVocabulary?.length || exercise.introducesGrammar?.length)
  return introducesSomething && !!exercise.introSl?.trim() && !!exercise.introDe?.trim()
}

function wasCorrectInThisSession(exercise: Exercise, session: SessionState) {
  return session.history.some(item => item.exerciseId === exercise.id && item.correct)
}

function targetSessionStats(exercise: Exercise, session: SessionState) {
  const targets = new Set(activeTargetsFor(exercise))
  const matching = session.history.filter(item => item.learningTargets.some(target => targets.has(target)))
  return { appearances: matching.length, successes: matching.filter(item => item.correct).length, failures: matching.filter(item => !item.correct).length }
}

function targetRecentlyFailed(exercise: Exercise, session: SessionState) {
  const targets = new Set(activeTargetsFor(exercise))
  return session.history.slice(-6).some(item => !item.correct && item.learningTargets.some(target => targets.has(target)))
}

function sameContentWasRecentlyUsed(exercise: Exercise, session: SessionState) {
  const key = exercise.contentKey ?? exercise.answer
  return session.history.slice(-RECENT_CONTENT_WINDOW).some(item => item.contentKey === key)
}

function sameContentWasJustUsedAcrossSessions(exercise: Exercise, progress: UserProgress, now: number) {
  const key = exercise.contentKey ?? exercise.answer
  if (!key) return false
  const recent = progress.recentSessionHistory ?? []
  const match = [...recent].reverse().find(item => item.contentKey === key)
  return !!match?.correct && now - match.timestamp < CROSS_SESSION_COOLDOWN_MS
}

function targetBudgetReached(exercise: Exercise, session: SessionState) {
  const stats = targetSessionStats(exercise, session)
  if (stats.failures > 0) return stats.appearances >= 4
  if (stats.successes >= 2) return stats.appearances >= 2
  return stats.appearances >= 3
}

function isSecureAndNotDue(exercise: Exercise, progress: UserProgress, now: number) {
  const states = activeTargetsFor(exercise).map(target => progress.learningItems?.[target]).filter(Boolean) as LearningItemState[]
  if (!states.length) return false
  return states.every(state => state.attempts >= 2 && state.mastery >= 0.75 && !!state.nextDueAt && state.nextDueAt > now)
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
  const meaningfulTargets = activeTargetsFor(exercise).filter(target => target.startsWith('vocab:') || target.startsWith('chunk:') || target.startsWith('grammar:') || target.startsWith('verb:') || target.startsWith('conjugation:') || target.startsWith('pattern:'))
  if (!meaningfulTargets.length) return false
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
    return (exercise.introducesVocabulary ?? []).some(item => !introduced.has(normalizeKey(item))) || (exercise.introducesGrammar ?? []).some(item => !grammar.has(item))
  })
}

function isNextIntroduction(exercise: Exercise, exercises: Exercise[], progress: UserProgress, phase: number) {
  if (exercise.curriculumPhase !== phase || exercise.type !== 'introduce') return false
  const introduced = new Set((progress.introducedVocabulary ?? []).map(normalizeKey))
  const grammar = new Set(progress.introducedGrammar ?? [])
  const unseen = exercises.filter(item => item.curriculumPhase === phase && item.type === 'introduce')
    .filter(item => (item.introducesVocabulary ?? []).some(value => !introduced.has(normalizeKey(value))) || (item.introducesGrammar ?? []).some(value => !grammar.has(value)))
    .sort((a, b) => (a.curriculumOrder ?? 999) - (b.curriculumOrder ?? 999))
  return unseen[0]?.id === exercise.id
}

function newItemBudgetReached(exercise: Exercise, session: SessionState) {
  const max = exercise.maxNewItemsInSession ?? 5
  return session.history.filter(item => item.learningPhase === 'new').length >= max
}

function curriculumAllows(exercise: Exercise, exercises: Exercise[], progress: UserProgress, session: SessionState, profile: LearnerProfile | null) {
  const hasCurriculumContent = exercises.some(item => item.curriculumPhase !== undefined)
  if (!hasCurriculumContent) return !requiresCurriculumSafety(progress, profile)
  if (!requiresCurriculumSafety(progress, profile)) return true

  const current = getCurrentBeginnerPhase(progress)
  const phase = current.id
  // Curriculum-managed learners never receive unversioned legacy exercises. This remains
  // true after phase 10; modern A1 expansion content must explicitly declare phase 11.
  if (!exercise.curriculumPhase) return false
  if (exercise.curriculumPhase > phase) return false
  if (exercise.curriculumPhase < phase) return exercise.type !== 'introduce'

  const introductionsPending = currentPhaseStillHasUnseenIntroductions(exercises, progress, phase)
  if (introductionsPending) {
    if (exercise.type === 'introduce') {
      if (newItemBudgetReached(exercise, session)) return false
      return isNextIntroduction(exercise, exercises, progress, phase)
    }
    if (!newItemBudgetReached(exercise, session)) return false
    return true
  }
  return true
}

function passesHardSafetyGates(exercise: Exercise, progress: UserProgress, session: SessionState, profile: LearnerProfile | null, now: number, allExercises: Exercise[]) {
  const strict = requiresCurriculumSafety(progress, profile)
  if (!isExerciseUnlocked(exercise, progress, profile)) return false
  if (!curriculumAllows(exercise, allExercises, progress, session, profile)) return false
  if (strict && !exercise.contentKey) return false
  if (strict && exercise.type === 'introduce' && !hasCompleteIntroductionMetadata(exercise)) return false
  if (strict && isProductive(exercise) && !hasExplicitProductionDependencies(exercise)) return false
  if (wasCorrectInThisSession(exercise, session)) return false
  if (isSecureAndNotDue(exercise, progress, now)) return false
  if (!prerequisitesAreKnown(exercise, progress)) return false
  if (!targetStageSatisfied(exercise, progress)) return false
  if (!activeTargetsAreAvailable(exercise, progress, now)) return false

  if (isProductive(exercise)) {
    const vocabulary = new Set((progress.introducedVocabulary ?? []).map(normalizeKey))
    if (exercise.requiredVocabulary?.some(item => !vocabulary.has(normalizeKey(item)))) return false
    const targetStates = activeTargetsFor(exercise).map(target => progress.learningItems?.[target]).filter(Boolean)
    if (exercise.learningPhase === 'production' || exercise.learningPhase === 'transfer' || strict) {
      if (!targetStates.length) return false
      if (targetStates.some(state => STAGE_RANK[state?.stage ?? 'unseen'] < STAGE_RANK.recall && (state?.recallMastery ?? 0) < 0.18)) return false
    }
  }
  return true
}

export function isEligibleForAdaptiveSession(exercise: Exercise, progress: UserProgress, session: SessionState, profile: LearnerProfile | null, now = Date.now(), allExercises: Exercise[] = [exercise]) {
  if (!passesHardSafetyGates(exercise, progress, session, profile, now, allExercises)) return false
  if (sameContentWasRecentlyUsed(exercise, session) && !targetRecentlyFailed(exercise, session)) return false
  if (sameContentWasJustUsedAcrossSessions(exercise, progress, now) && !targetRecentlyFailed(exercise, session)) return false
  if (targetBudgetReached(exercise, session) && !targetRecentlyFailed(exercise, session)) return false
  return true
}

function isEligibleFallback(exercise: Exercise, progress: UserProgress, session: SessionState, profile: LearnerProfile | null, now: number, allExercises: Exercise[]) {
  if (!passesHardSafetyGates(exercise, progress, session, profile, now, allExercises)) return false
  if (sameContentWasJustUsedAcrossSessions(exercise, progress, now)) return false
  const stats = targetSessionStats(exercise, session)
  if (stats.failures === 0 && stats.successes >= 2) return false
  return true
}

export function eligibleAdaptiveContent(exercises: Exercise[], progress: UserProgress, session: SessionState, profile: LearnerProfile | null, now = Date.now()) {
  const preferred = exercises.filter(exercise => isEligibleForAdaptiveSession(exercise, progress, session, profile, now, exercises))
  if (preferred.length) return preferred
  return exercises.filter(exercise => isEligibleFallback(exercise, progress, session, profile, now, exercises))
}
