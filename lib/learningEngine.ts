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
  penalties: string[]
  learningTargets: string[]
  breakdown: {
    urgency: number
    mistakes: number
    mastery: number
    skillBalance: number
    diversity: number
    difficulty: number
    cooldown: number
  }
}

export type ExerciseOutcome = {
  correct: boolean
  responseMs: number
  mistakeCategory?: MistakeCategory
}

const ALL_SKILLS: LearningSkill[] = ['lesen', 'hören', 'schreiben', 'sprechen', 'grammatik', 'wortschatz']
const IMMEDIATE_COOLDOWN = 4
const CONTENT_COOLDOWN = 8
const TYPE_COOLDOWN = 3
const GRAMMAR_PRESENTATION_COOLDOWN = 2
const TARGET_REVISIT_GAP = 3
const PATTERN_COOLDOWN = 5

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

function sessionSkillCounts(session: SessionState) {
  const counts = Object.fromEntries(ALL_SKILLS.map(skill => [skill, 0])) as Record<LearningSkill, number>
  for (const item of session.history.slice(-10)) {
    for (const skill of item.skills) counts[skill] += 1
  }
  return counts
}

function skillBalanceBonus(exercise: Exercise, progress: UserProgress, session: SessionState) {
  const weakestLongTerm = getWeakestSkills(progress).slice(0, 2)
  const counts = sessionSkillCounts(session)
  const minCount = Math.min(...ALL_SKILLS.map(skill => counts[skill]))
  let bonus = 0
  for (const skill of exercise.skills ?? []) {
    if (weakestLongTerm.includes(skill)) bonus += 8
    if (counts[skill] === minCount) bonus += 8
    if (counts[skill] >= 3) bonus -= 12
  }
  return bonus
}

function diversityAdjustment(exercise: Exercise, session: SessionState) {
  const recent = session.history
  let score = 0
  const reasons: string[] = []
  const penalties: string[] = []

  const contentKey = exercise.contentKey ?? exercise.answer
  if (recent.slice(-CONTENT_COOLDOWN).some(item => item.contentKey === contentKey)) {
    score -= 90
    penalties.push('gleicher Satz/Inhalt war kürzlich bereits dran')
  }

  const sameTypeCount = recent.slice(-TYPE_COOLDOWN).filter(item => item.exerciseType === exercise.type).length
  if (sameTypeCount >= 2) {
    score -= 40
    penalties.push('gleicher Aufgabentyp kam zuletzt mehrfach vor')
  } else if (sameTypeCount === 1) {
    score -= 18
    penalties.push('gleicher Aufgabentyp war gerade dran')
  } else if (recent.length) {
    score += 10
    reasons.push('abwechslungsreicher Aufgabentyp')
  }

  const modality = exercise.modality ?? (exercise.type.startsWith('listen-') ? 'listening' : exercise.type === 'speak-answer' ? 'speaking' : exercise.type === 'choice' ? 'choice' : 'text')
  const recentModalities = recent.slice(-4).map(item => item.modality)
  const modalityCount = recentModalities.filter(item => item === modality).length
  if (modalityCount >= 3) {
    score -= 38
    penalties.push('Interaktionsform kam zu oft hintereinander')
  } else if (modalityCount >= 2) {
    score -= 22
    penalties.push('diese Interaktionsform kam zuletzt häufig vor')
  } else if (!recentModalities.includes(modality)) {
    score += 12
    reasons.push('Interaktionsform ausgleichen')
  }

  if (exercise.visualType) {
    const visualRecently = recent.slice(-4).some(item => !!item.visualType)
    if (!visualRecently) {
      score += 14
      reasons.push('visueller Lernanker sorgt für Abwechslung')
    } else if (recent.slice(-2).every(item => !!item.visualType)) {
      score -= 12
      penalties.push('visuelle Aufgaben kurz mit anderer Form abwechseln')
    }
  }

  if (exercise.sentencePatternKey) {
    const patternCount = recent.slice(-PATTERN_COOLDOWN).filter(item => item.sentencePatternKey === exercise.sentencePatternKey).length
    if (patternCount >= 2) {
      score -= 34
      penalties.push('gleiches Satzmuster wurde zuletzt mehrfach verwendet')
    } else if (patternCount === 1) {
      score -= 12
      penalties.push('gleiches Satzmuster kurz entzerren')
    } else if (recent.length >= 2) {
      score += 6
      reasons.push('neues Satzmuster in dieser Session')
    }
  }

  if (exercise.grammarTag && recent.slice(-GRAMMAR_PRESENTATION_COOLDOWN).some(item => item.grammarTag === exercise.grammarTag)) {
    score -= 8
    penalties.push('gleiches Grammatikziel kurz entzerren')
  }

  if (exercise.contextTag && recent.slice(-3).some(item => item.contextTag === exercise.contextTag)) {
    score -= 14
    penalties.push('gleichen Alltagskontext nicht direkt wiederholen')
  }

  return { score, reasons, penalties }
}

function modalityMasteryFit(exercise: Exercise, mastery: number) {
  const type = exercise.type
  const isSupported = ['choice', 'fill', 'ending'].includes(type)
  const isProductive = ['translate-de-sl', 'transform', 'speak-answer', 'listen-answer', 'listen-type'].includes(type)
  let score = 0
  const reasons: string[] = []

  if (mastery < 0.35 && isSupported) {
    score += 14
    reasons.push('unterstützte Übungsform für unsicheres Lernziel')
  }
  if (mastery < 0.35 && isProductive && (exercise.difficulty ?? 2) >= 3) score -= 10
  if (mastery > 0.7 && isProductive) {
    score += 14
    reasons.push('anspruchsvollere Produktion bei sicherem Lernziel')
  }
  if (mastery > 0.82 && type === 'choice') score -= 16
  return { score, reasons }
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
  const penalties: string[] = []
  const breakdown = { urgency: 0, mistakes: 0, mastery: 0, skillBalance: 0, diversity: 0, difficulty: 0, cooldown: 0 }
  let score = 20

  if (!prerequisiteSatisfied(exercise, progress)) {
    return { exercise, score: -10_000, reasons: ['Voraussetzung noch nicht erreicht'], penalties: [], learningTargets: targets, breakdown }
  }

  const recentIds = session.recentExerciseIds.slice(-IMMEDIATE_COOLDOWN)
  if (recentIds.includes(exercise.id)) {
    breakdown.cooldown -= 160
    penalties.push('Cooldown: konkrete Aufgabe war gerade dran')
  }

  if (state.nextDueAt !== undefined) {
    const overdueMs = now - state.nextDueAt
    if (overdueMs >= 0) {
      const days = overdueMs / 86_400_000
      breakdown.urgency += 38 + Math.min(30, days * 5)
      reasons.push('überfällig')
    } else if (state.nextDueAt - now < 6 * 60 * 60_000 && state.incorrectStreak > 0) {
      breakdown.urgency += 12
      reasons.push('Reparatur-Wiederholung nach Unsicherheit')
    }
  }

  const mistakes = repeatedMistakeWeight(progress, exercise)
  if (mistakes > 0) {
    breakdown.mistakes += mistakes * 8
    reasons.push(mistakes >= 3 ? 'wiederkehrender persönlicher Fehler' : 'persönliche Problemstelle')
  }

  if (state.attempts === 0) {
    if (shouldIntroduceNewContent(progress, session)) {
      breakdown.mastery += 18
      reasons.push('neuer Stoff passend zum Lernfortschritt')
    } else {
      breakdown.mastery -= 24
      penalties.push('neuer Stoff wird noch dosiert')
    }
  } else if (state.mastery < 0.45) {
    breakdown.mastery += 28
    reasons.push('unsicheres Lernziel')
  } else if (state.mastery >= 0.82 && (!state.nextDueAt || state.nextDueAt > now)) {
    breakdown.mastery -= 28
    penalties.push('bereits sicher und noch nicht fällig')
  }

  if (state.incorrectStreak >= 2) {
    breakdown.mistakes += 22
    reasons.push('mehrfach hintereinander falsch')
  } else if (state.incorrectStreak === 1) {
    breakdown.mistakes += 10
    reasons.push('kürzlich falsch beantwortet')
  }

  breakdown.skillBalance += skillBalanceBonus(exercise, progress, session)
  if (breakdown.skillBalance > 0) reasons.push('Kompetenz-Balance verbessern')

  const recentFailedTargets = session.history.filter(item => !item.correct).slice(-7).flatMap(item => item.learningTargets)
  const transferTargets = targets.filter(target => recentFailedTargets.includes(target))
  if (transferTargets.length && !recentIds.includes(exercise.id)) {
    breakdown.mistakes += 30
    reasons.push('Transferübung zu einem aktuellen Fehler')
  }

  if (targets.some(target => targetWasRecentlySeen(target, session))) {
    breakdown.diversity -= 10
    penalties.push('Lernziel kurz entzerren')
  }

  const diversity = diversityAdjustment(exercise, session)
  breakdown.diversity += diversity.score
  reasons.push(...diversity.reasons)
  penalties.push(...diversity.penalties)

  const fit = modalityMasteryFit(exercise, state.mastery)
  breakdown.difficulty += fit.score
  reasons.push(...fit.reasons)

  const desiredDifficulty = state.mastery > 0.75 ? 3.5 : state.mastery < 0.35 ? 1.8 : 2.5
  breakdown.difficulty -= Math.abs((exercise.difficulty ?? 2) - desiredDifficulty) * 3

  score += Object.values(breakdown).reduce((sum, value) => sum + value, 0)
  score += exercise.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 7 / 10

  return {
    exercise,
    score,
    reasons: Array.from(new Set(reasons)),
    penalties: Array.from(new Set(penalties)),
    learningTargets: targets,
    breakdown,
  }
}

function seededUnit(seedText: string) {
  let hash = 2166136261
  for (let i = 0; i < seedText.length; i += 1) {
    hash ^= seedText.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4_294_967_296
}

export function selectNextExercise(
  progress: UserProgress,
  availableContent: Exercise[],
  session: SessionState,
  now = Date.now(),
): CandidateScore | null {
  if (!availableContent.length) return null
  const ranked = availableContent
    .filter(exercise => exercise.evaluationMode !== 'free' || session.answered >= 4)
    .map(exercise => scoreExerciseCandidate(exercise, progress, session, now))
    .filter(candidate => candidate.score > -1_000)
    .sort((a, b) => b.score - a.score)

  if (!ranked.length) return null
  const best = ranked[0].score
  const top = ranked.filter(candidate => candidate.score >= best - 12).slice(0, 5)
  if (top.length === 1) return top[0]

  // Stable for a rendered step, different across sessions/steps. This gives variety
  // without letting a React re-render silently replace the current exercise.
  const seed = `${session.startedAt}:${session.answered}:${top.map(item => item.exercise.id).join('|')}`
  const unit = seededUnit(seed)
  const weights = top.map(item => Math.max(1, item.score - (best - 14)))
  const total = weights.reduce((sum, value) => sum + value, 0)
  let cursor = unit * total
  for (let index = 0; index < top.length; index += 1) {
    cursor -= weights[index]
    if (cursor <= 0) return top[index]
  }
  return top[0]
}

export function analyzeContentCoverage(exercises: Exercise[]) {
  const byTarget = new Map<string, Exercise[]>()
  for (const exercise of exercises) {
    for (const target of getLearningTargets(exercise).filter(target => target.startsWith('grammar:') || target.startsWith('lesson:'))) {
      byTarget.set(target, [...(byTarget.get(target) ?? []), exercise])
    }
  }
  return [...byTarget.entries()].map(([target, items]) => ({
    target,
    exerciseCount: items.length,
    typeCount: new Set(items.map(item => item.type)).size,
    modalityCount: new Set(items.map(item => item.modality ?? 'text')).size,
    contextCount: new Set(items.map(item => item.contextTag).filter(Boolean)).size,
    needsMoreVariation: items.length < 4 || new Set(items.map(item => item.type)).size < 2,
  }))
}

function computeNextDueAt(correct: boolean, mastery: number, now: number) {
  if (!correct) return now + 10 * 60_000
  const days = mastery >= 0.85 ? 30 : mastery >= 0.65 ? 7 : mastery >= 0.4 ? 3 : 1
  return now + days * 86_400_000
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
  const exercise = candidate.exercise
  const modality = exercise.modality ?? (exercise.type.startsWith('listen-') ? 'listening' : exercise.type === 'speak-answer' ? 'speaking' : exercise.type === 'choice' ? 'choice' : 'text')
  const historyItem: SessionHistoryItem = {
    exerciseId: exercise.id,
    learningTargets: candidate.learningTargets,
    skills: exercise.skills ?? ['schreiben'],
    correct: outcome.correct,
    timestamp: Date.now(),
    mistakeCategory: outcome.mistakeCategory,
    reason: candidate.reasons[0],
    exerciseType: exercise.type,
    modality,
    grammarTag: exercise.grammarTag,
    contentKey: exercise.contentKey ?? exercise.answer,
    contextTag: exercise.contextTag,
    sentencePatternKey: exercise.sentencePatternKey,
    visualType: exercise.visualType,
  }
  return {
    ...session,
    answered: session.answered + 1,
    correct: session.correct + (outcome.correct ? 1 : 0),
    introducedNew: session.introducedNew + (wasNew ? 1 : 0),
    recentExerciseIds: [...session.recentExerciseIds, exercise.id].slice(-10),
    history: [...session.history, historyItem].slice(-40),
  }
}
