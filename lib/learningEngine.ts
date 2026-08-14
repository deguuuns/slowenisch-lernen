import type {
  Exercise,
  LearningItemState,
  LearningSkill,
  MistakeCategory,
  SessionHistoryItem,
  UserProgress,
} from '@/types'

export type SessionState = {
  startedAt: number
  answered: number
  correct: number
  introducedNew: number
  recentExerciseIds: string[]
  history: SessionHistoryItem[]
}

export type CandidateScore = {
  exercise: Exercise
  score: number
  reasons: string[]
  learningTargets: string[]
}

export type ExerciseOutcome = {
  correct: boolean
  responseMs: number
  mistakeCategory?: MistakeCategory
}

const ALL_SKILLS: LearningSkill[] = ['lesen', 'hören', 'schreiben', 'sprechen', 'grammatik', 'wortschatz']
const IMMEDIATE_COOLDOWN = 3
const TARGET_REVISIT_GAP = 2

export function getLearningTargets(exercise: Exercise): string[] {
  if (exercise.learningTargets?.length) return exercise.learningTargets
  const targets = [`lesson:${exercise.lesson}`]
  if (exercise.grammarTag) targets.push(`grammar:${exercise.grammarTag}`)
  for (const skill of exercise.skills ?? []) targets.push(`skill:${skill}`)
  return targets
}

export function getExerciseState(progress: UserProgress, exercise: Exercise): LearningItemState {
  const current = progress.learningItems?.[`exercise:${exercise.id}`]
  if (current) return current
  return {
    key: `exercise:${exercise.id}`,
    kind: 'exercise',
    level: exercise.level,
    skills: exercise.skills ?? ['schreiben'],
    grammarTag: exercise.grammarTag,
    attempts: 0,
    correctCount: 0,
    incorrectCount: 0,
    correctStreak: 0,
    incorrectStreak: 0,
    mastery: 0,
    difficulty: exercise.difficulty ?? 2,
  }
}

export function getWeakestSkills(progress: UserProgress): LearningSkill[] {
  const xp = progress.skillXp ?? {}
  return [...ALL_SKILLS].sort((a, b) => (xp[a] ?? 0) - (xp[b] ?? 0))
}

export function getDueLearningItems(progress: UserProgress, now = Date.now()) {
  return Object.values(progress.learningItems ?? {}).filter(item => item.nextDueAt !== undefined && item.nextDueAt <= now)
}

export function shouldIntroduceNewContent(progress: UserProgress, session: SessionState): boolean {
  if (session.answered < 2) return false
  const due = getDueLearningItems(progress).length
  const recentAccuracy = session.answered ? session.correct / session.answered : 1
  const maxNew = session.answered < 8 ? 1 : 2
  return session.introducedNew < maxNew && due < 6 && recentAccuracy >= 0.65
}

function repeatedMistakeWeight(progress: UserProgress, exercise: Exercise) {
  const matching = progress.mistakes.filter(mistake => {
    if (mistake.key === exercise.id) return true
    if (!exercise.grammarTag) return false
    return mistake.key.startsWith(`grammar:${exercise.grammarTag}`)
  })
  return matching.reduce((sum, mistake) => sum + Math.min(5, mistake.count), 0)
}

function prerequisiteSatisfied(exercise: Exercise, progress: UserProgress) {
  if (!exercise.prerequisites?.length) {
    return exercise.lesson <= 1 || progress.completedLessons.includes(exercise.lesson - 1) || exercise.lesson <= Math.max(1, progress.completedLessons.length + 1)
  }
  return exercise.prerequisites.every(key => {
    const state = progress.learningItems?.[key]
    return !!state && state.mastery >= 0.62
  })
}

function targetWasRecentlySeen(target: string, session: SessionState, gap = TARGET_REVISIT_GAP) {
  return session.history.slice(-gap).some(item => item.learningTargets.includes(target))
}

function skillDeficitBonus(exercise: Exercise, progress: UserProgress) {
  const weakest = getWeakestSkills(progress).slice(0, 2)
  return (exercise.skills ?? []).reduce((sum, skill) => sum + (weakest.includes(skill) ? 9 : 0), 0)
}

export function scoreExerciseCandidate(
  exercise: Exercise,
  progress: UserProgress,
  session: SessionState,
  now = Date.now(),
): CandidateScore {
  const state = getExerciseState(progress, exercise)
  const targets = getLearningTargets(exercise)
  const reasons: string[] = []
  let score = 20

  if (!prerequisiteSatisfied(exercise, progress)) {
    return { exercise, score: -10_000, reasons: ['Voraussetzung noch nicht erreicht'], learningTargets: targets }
  }

  const recentIds = session.recentExerciseIds.slice(-IMMEDIATE_COOLDOWN)
  if (recentIds.includes(exercise.id)) {
    score -= 120
    reasons.push('Cooldown: konkrete Aufgabe war gerade dran')
  }

  if (state.nextDueAt !== undefined) {
    const overdueMs = now - state.nextDueAt
    if (overdueMs >= 0) {
      const days = overdueMs / 86_400_000
      score += 38 + Math.min(30, days * 5)
      reasons.push('überfällig')
    } else if (state.nextDueAt - now < 6 * 60 * 60_000) {
      score += 12
      reasons.push('kurz vor dem Vergessen')
    }
  }

  const mistakes = repeatedMistakeWeight(progress, exercise)
  if (mistakes > 0) {
    score += mistakes * 8
    reasons.push(mistakes >= 3 ? 'wiederkehrender persönlicher Fehler' : 'persönliche Problemstelle')
  }

  if (state.attempts === 0) {
    if (shouldIntroduceNewContent(progress, session)) {
      score += 18
      reasons.push('neuer Stoff passend zum Lernfortschritt')
    } else {
      score -= 24
      reasons.push('neuer Stoff wird noch dosiert')
    }
  } else {
    if (state.mastery < 0.45) {
      score += 28
      reasons.push('unsicheres Lernziel')
    } else if (state.mastery >= 0.82 && (!state.nextDueAt || state.nextDueAt > now)) {
      score -= 28
      reasons.push('bereits sicher und noch nicht fällig')
    }
  }

  if (state.incorrectStreak >= 2) {
    score += 22
    reasons.push('mehrfach hintereinander falsch')
  } else if (state.incorrectStreak === 1) {
    score += 10
    reasons.push('kürzlich falsch beantwortet')
  }

  score += skillDeficitBonus(exercise, progress)
  const weakest = getWeakestSkills(progress).slice(0, 2)
  if ((exercise.skills ?? []).some(skill => weakest.includes(skill))) reasons.push('schwache Kompetenz ausgleichen')

  const recentFailedTargets = session.history
    .filter(item => !item.correct)
    .slice(-6)
    .flatMap(item => item.learningTargets)
  const transferTargets = targets.filter(target => recentFailedTargets.includes(target))
  if (transferTargets.length && !recentIds.includes(exercise.id)) {
    score += 26
    reasons.push('Transferübung zu einem aktuellen Fehler')
  }

  if (targets.some(target => targetWasRecentlySeen(target, session))) {
    score -= 9
    reasons.push('Lernziel kurz entzerren')
  }

  const desiredDifficulty = state.mastery > 0.75 ? 3 : state.mastery < 0.35 ? 1.8 : 2.5
  score -= Math.abs((exercise.difficulty ?? 2) - desiredDifficulty) * 3

  // Stable tie-breaker: deterministic, not random.
  score += exercise.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 7 / 10

  return { exercise, score, reasons: Array.from(new Set(reasons)), learningTargets: targets }
}

export function selectNextExercise(
  progress: UserProgress,
  availableContent: Exercise[],
  session: SessionState,
  now = Date.now(),
): CandidateScore | null {
  if (!availableContent.length) return null
  const ranked = availableContent
    .filter(exercise => exercise.evaluationMode !== 'free' || session.answered >= 3)
    .map(exercise => scoreExerciseCandidate(exercise, progress, session, now))
    .sort((a, b) => b.score - a.score)

  return ranked.find(candidate => candidate.score > -1_000) ?? ranked[0] ?? null
}

function computeNextDueAt(correct: boolean, mastery: number, now: number) {
  if (!correct) return now + 10 * 60_000
  const hours = mastery >= 0.85 ? 14 * 24 : mastery >= 0.65 ? 4 * 24 : mastery >= 0.4 ? 24 : 6
  return now + hours * 60 * 60_000
}

export function updateLearnerState(
  progress: UserProgress,
  exercise: Exercise,
  outcome: ExerciseOutcome,
  now = Date.now(),
): UserProgress {
  const state = getExerciseState(progress, exercise)
  const attempts = state.attempts + 1
  const correctCount = state.correctCount + (outcome.correct ? 1 : 0)
  const incorrectCount = state.incorrectCount + (outcome.correct ? 0 : 1)
  const accuracy = correctCount / attempts
  const oldMastery = state.mastery
  const evidence = outcome.correct ? 0.16 : -0.2
  const streakBonus = outcome.correct ? Math.min(0.08, state.correctStreak * 0.02) : -Math.min(0.08, state.incorrectStreak * 0.02)
  const mastery = Math.max(0, Math.min(1, oldMastery * 0.72 + accuracy * 0.28 + evidence + streakBonus))
  const averageResponseMs = state.averageResponseMs
    ? Math.round(state.averageResponseMs * 0.7 + outcome.responseMs * 0.3)
    : outcome.responseMs

  const nextState: LearningItemState = {
    ...state,
    attempts,
    correctCount,
    incorrectCount,
    correctStreak: outcome.correct ? state.correctStreak + 1 : 0,
    incorrectStreak: outcome.correct ? 0 : state.incorrectStreak + 1,
    mastery,
    lastSeenAt: now,
    nextDueAt: computeNextDueAt(outcome.correct, mastery, now),
    averageResponseMs,
    lastMistakeCategory: outcome.correct ? state.lastMistakeCategory : outcome.mistakeCategory,
  }

  const targetStates: Record<string, LearningItemState> = { ...(progress.learningItems ?? {}), [nextState.key]: nextState }
  for (const target of getLearningTargets(exercise)) {
    const previous = targetStates[target] ?? {
      key: target,
      kind: target.startsWith('grammar:') ? 'grammar' : target.startsWith('skill:') ? 'pattern' : 'lesson',
      attempts: 0,
      correctCount: 0,
      incorrectCount: 0,
      correctStreak: 0,
      incorrectStreak: 0,
      mastery: 0,
      difficulty: exercise.difficulty ?? 2,
    }
    const targetAttempts = previous.attempts + 1
    const targetCorrect = previous.correctCount + (outcome.correct ? 1 : 0)
    const targetAccuracy = targetCorrect / targetAttempts
    targetStates[target] = {
      ...previous,
      attempts: targetAttempts,
      correctCount: targetCorrect,
      incorrectCount: previous.incorrectCount + (outcome.correct ? 0 : 1),
      correctStreak: outcome.correct ? previous.correctStreak + 1 : 0,
      incorrectStreak: outcome.correct ? 0 : previous.incorrectStreak + 1,
      mastery: Math.max(0, Math.min(1, previous.mastery * 0.76 + targetAccuracy * 0.24 + (outcome.correct ? 0.08 : -0.12))),
      lastSeenAt: now,
      nextDueAt: computeNextDueAt(outcome.correct, previous.mastery, now),
      lastMistakeCategory: outcome.correct ? previous.lastMistakeCategory : outcome.mistakeCategory,
    }
  }

  return { ...progress, learningItems: targetStates }
}

export function createSessionState(): SessionState {
  return { startedAt: Date.now(), answered: 0, correct: 0, introducedNew: 0, recentExerciseIds: [], history: [] }
}

export function registerSessionOutcome(
  session: SessionState,
  candidate: CandidateScore,
  outcome: ExerciseOutcome,
): SessionState {
  const wasNew = candidate.reasons.includes('neuer Stoff passend zum Lernfortschritt')
  const historyItem: SessionHistoryItem = {
    exerciseId: candidate.exercise.id,
    learningTargets: candidate.learningTargets,
    skills: candidate.exercise.skills ?? ['schreiben'],
    correct: outcome.correct,
    timestamp: Date.now(),
    mistakeCategory: outcome.mistakeCategory,
    reason: candidate.reasons[0],
  }
  return {
    ...session,
    answered: session.answered + 1,
    correct: session.correct + (outcome.correct ? 1 : 0),
    introducedNew: session.introducedNew + (wasNew ? 1 : 0),
    recentExerciseIds: [...session.recentExerciseIds, candidate.exercise.id].slice(-8),
    history: [...session.history, historyItem].slice(-30),
  }
}
