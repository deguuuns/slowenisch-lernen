'use client'

import { AttemptSignal, Exercise, LearnerPreferences, MasteryItem, Mistake, ReviewItem, SkillTarget, TransferItem, UserProgress } from '@/types'
import { verbFormKey } from '@/lib/curriculum-access'
import { ERROR_RETRY_DELAY_MINUTES, REVIEW_INTERVALS_DAYS } from '@/lib/learning-config'
import { inferTargetContentKeys, isCanonicalReviewKey } from '@/lib/learning-targets'
import { inferMistakeCategoryFromExerciseId } from '@/lib/learning-signals'
import { explicitSkillTargetKeys } from '@/lib/skill-mastery'

const LEGACY_KEY = 'slovensko-progress-v1'
const KEY_PREFIX = 'slovensko-progress-v2'
const DAY = 24 * 60 * 60_000

export const defaultPreferences: LearnerPreferences = {
  onboardingCompleted: false,
  nativeLanguage: 'de',
  targetLevel: 'A1',
  dailyGoalMinutes: 10,
  pace: 'normal',
  audioSpeed: 'normal',
}

export const defaultProgress: UserProgress = {
  completedLessons: [],
  streak: 1,
  introducedWords: [],
  introducedGrammarRules: [],
  introducedVerbForms: [],
  wordsLearned: [],
  secureWords: [],
  mistakes: [],
  reviews: [],
  speakingMinutes: 0,
  listeningMinutes: 0,
  mastery: {},
  recentAttempts: [],
  transferQueue: [],
  examHistory: [],
  preferences: defaultPreferences,
  updatedAt: 0,
  preferencesUpdatedAt: 0,
}

function key(ownerId?: string | null) {
  return `${KEY_PREFIX}:${ownerId || 'guest'}`
}

function migrateReview(review: ReviewItem): ReviewItem {
  const index = Math.max(-1, Math.min(review.intervalIndex ?? -1, REVIEW_INTERVALS_DAYS.length - 1))
  const lastReviewedAt = Number(review.lastReviewedAt || review.updatedAt || 0)
  const successfulReviews = Number(review.successfulReviews ?? Math.max(0, index + 1))
  const consecutiveCorrect = Number(review.consecutiveCorrect ?? successfulReviews)
  let dueAt = Number(review.dueAt || 0)
  if (successfulReviews > 0 && lastReviewedAt > 0) {
    const safeIndex = Math.max(0, index)
    const canonicalDue = lastReviewedAt + REVIEW_INTERVALS_DAYS[safeIndex] * DAY
    dueAt = Math.max(dueAt, canonicalDue)
  }
  return { ...review, intervalIndex:index, dueAt, lastReviewedAt:lastReviewedAt || undefined, successfulReviews, consecutiveCorrect }
}

export function hydrateProgress(parsed: Partial<UserProgress> | null | undefined): UserProgress {
  return {
    ...defaultProgress,
    ...parsed,
    completedLessons: parsed?.completedLessons || [],
    introducedWords: parsed?.introducedWords || [],
    introducedGrammarRules: parsed?.introducedGrammarRules || [],
    introducedVerbForms: parsed?.introducedVerbForms || [],
    wordsLearned: parsed?.wordsLearned || [],
    secureWords: parsed?.secureWords || [],
    mistakes: (parsed?.mistakes || []).map(mistake => ({ ...mistake, category:mistake.category || inferMistakeCategoryFromExerciseId(mistake.key) })),
    reviews: (parsed?.reviews || []).filter(review => isCanonicalReviewKey(review.key)).map(migrateReview),
    mastery: { ...(parsed?.mastery || {}) },
    recentAttempts: parsed?.recentAttempts || [],
    transferQueue: parsed?.transferQueue || [],
    examHistory: parsed?.examHistory || [],
    preferences: { ...defaultPreferences, ...(parsed?.preferences || {}) },
    updatedAt: Number(parsed?.updatedAt || 0),
    preferencesUpdatedAt: Number(parsed?.preferencesUpdatedAt || 0),
    resetAt: Number(parsed?.resetAt || 0) || undefined,
    lastSyncedAt: Number(parsed?.lastSyncedAt || 0) || undefined,
  }
}

export function hasMeaningfulProgress(progress: UserProgress) {
  return Boolean(progress.completedLessons.length || progress.introducedWords.length || progress.introducedGrammarRules.length || progress.recentAttempts.length || Object.keys(progress.mastery || {}).length)
}

export function loadProgress(ownerId?: string | null): UserProgress {
  if (typeof window === 'undefined') return { ...defaultProgress, preferences: { ...defaultPreferences } }
  try {
    const scoped = localStorage.getItem(key(ownerId))
    if (scoped) return hydrateProgress(JSON.parse(scoped))
    if (!ownerId) {
      const legacy = localStorage.getItem(LEGACY_KEY)
      if (legacy) {
        const migrated = hydrateProgress(JSON.parse(legacy))
        localStorage.setItem(key(null), JSON.stringify(migrated))
        return migrated
      }
    }
    return { ...defaultProgress, preferences: { ...defaultPreferences } }
  } catch {
    return { ...defaultProgress, preferences: { ...defaultPreferences } }
  }
}

export function saveProgress(progress: UserProgress, ownerId?: string | null) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key(ownerId), JSON.stringify({ ...progress, updatedAt: Date.now() }))
}

export function clearGuestProgress() { if (typeof window !== 'undefined') localStorage.removeItem(key(null)) }

export function resetLearningProgress(current: UserProgress): UserProgress {
  const now = Date.now()
  return { ...defaultProgress, preferences:{ ...current.preferences }, preferencesUpdatedAt:current.preferencesUpdatedAt || now, updatedAt:now, resetAt:now }
}

function normalizedReviewKey(keyValue: string): string | null {
  if (isCanonicalReviewKey(keyValue)) return keyValue
  const verbExercise = keyValue.match(/^verb-(.+)-(1|2|3)-(?:choice|produce|fill)$/)
  if (verbExercise) return `verb:${verbExercise[1]}:singular:${verbExercise[2]}`
  return null
}

export function scheduleReview(items: ReviewItem[], rawKey: string, correct: boolean, now = Date.now()): ReviewItem[] {
  const keyValue = normalizedReviewKey(rawKey)
  if (!keyValue) return items
  const current = items.find(item => item.key === keyValue)
  if (!correct) {
    const next: ReviewItem = { key:keyValue, intervalIndex:-1, status:'neu', dueAt:now + ERROR_RETRY_DELAY_MINUTES * 60_000, updatedAt:now, lastReviewedAt:now, successfulReviews:current?.successfulReviews || 0, consecutiveCorrect:0 }
    return [...items.filter(item => item.key !== keyValue), next]
  }
  const nextIndex = Math.min((current?.intervalIndex ?? -1) + 1, REVIEW_INTERVALS_DAYS.length - 1)
  const successfulReviews = (current?.successfulReviews || 0) + 1
  const status: ReviewItem['status'] = nextIndex >= 5 ? 'sicher' : nextIndex >= 2 ? 'gelernt' : 'unsicher'
  const next: ReviewItem = { key:keyValue, intervalIndex:nextIndex, status, dueAt:now + REVIEW_INTERVALS_DAYS[nextIndex] * DAY, updatedAt:now, lastReviewedAt:now, successfulReviews, consecutiveCorrect:(current?.consecutiveCorrect || 0) + 1 }
  return [...items.filter(item => item.key !== keyValue), next]
}

export function scheduleExerciseReviews(items: ReviewItem[], exercise: Exercise, correct: boolean, now = Date.now()) {
  let reviews = items
  for (const target of inferTargetContentKeys(exercise)) reviews = scheduleReview(reviews, target, correct, now)
  return reviews
}

export function registerMistake(mistakes: Mistake[], keyValue: string, category = inferMistakeCategoryFromExerciseId(keyValue)): Mistake[] {
  const current = mistakes.find(mistake => mistake.key === keyValue)
  const next: Mistake = { key:keyValue, category, count:(current?.count ?? 0) + 1, lastSeen:Date.now() }
  return [...mistakes.filter(mistake => mistake.key !== keyValue), next].sort((a, b) => b.count - a.count)
}

function quality(correct: boolean, responseMs: number, hintsUsed: number, active: boolean) {
  if (!correct) return 0
  const speed = responseMs <= 8_000 ? 1 : responseMs <= 20_000 ? .9 : responseMs <= 45_000 ? .78 : .65
  const mode = active ? 1 : .88
  return Math.max(.4, (speed - hintsUsed * .18) * mode)
}

function updateItem(old: MasteryItem | undefined, keyValue: string, kind: MasteryItem['kind'], correct: boolean, responseMs = 0, hintsUsed = 0, active = false): MasteryItem {
  const attempts = (old?.attempts || 0) + 1
  const hits = (old?.correct || 0) + (correct ? 1 : 0)
  const observed = quality(correct, responseMs, hintsUsed, active)
  const previous = old?.score ?? .25
  const score = Math.max(0, Math.min(1, previous * .72 + observed * .28))
  return { key:keyValue, kind, score:+score.toFixed(3), attempts, correct:hits, activeCorrect:(old?.activeCorrect || 0) + (correct && active ? 1 : 0), passiveCorrect:(old?.passiveCorrect || 0) + (correct && !active ? 1 : 0), hintsUsed:(old?.hintsUsed || 0) + hintsUsed, slowCorrect:(old?.slowCorrect || 0) + (correct && responseMs > 30_000 ? 1 : 0), lastSeen:Date.now() }
}

function inferredSkills(exercise: Exercise): SkillTarget[] {
  if (exercise.skillTargets?.length) return exercise.skillTargets
  if (exercise.type === 'choice') return ['recognition']
  if (exercise.type === 'translate-de-sl' || exercise.type === 'free') return ['production']
  return ['grammar-application']
}

export function isActiveProduction(exercise: Exercise) {
  const skills = inferredSkills(exercise)
  return skills.includes('production') || skills.includes('speaking') || exercise.type === 'translate-de-sl' || exercise.type === 'free' || exercise.type === 'fill' || exercise.type === 'ending'
}

export function updateMastery(mastery: Record<string, MasteryItem>, exercise: Exercise, correct: boolean, responseMs = 0, hintsUsed = 0) {
  const next = { ...mastery }
  const active = isActiveProduction(exercise)
  for (const id of exercise.vocabularyIds || []) next[`vocab:${id}`] = updateItem(next[`vocab:${id}`], `vocab:${id}`, 'vocabulary', correct, responseMs, hintsUsed, active)
  for (const id of exercise.grammarRuleIds || []) next[`grammar:${id}`] = updateItem(next[`grammar:${id}`], `grammar:${id}`, 'grammar', correct, responseMs, hintsUsed, active)
  for (const requirement of exercise.requiredVerbForms || []) {
    const reviewKey = `verb:${verbFormKey(requirement)}`
    next[reviewKey] = updateItem(next[reviewKey], reviewKey, 'verb', correct, responseMs, hintsUsed, active)
  }
  const skillKeys = new Set([
    ...inferredSkills(exercise).map(skill => `skill:${skill}`),
    ...explicitSkillTargetKeys(exercise.targetContentKeys),
  ])
  for (const keyValue of skillKeys) {
    const activeSkill = keyValue.startsWith('skill:production') || keyValue.startsWith('skill:speaking')
    next[keyValue] = updateItem(next[keyValue], keyValue, 'skill', correct, responseMs, hintsUsed, activeSkill)
  }
  return next
}

export function updateSkillMastery(mastery: Record<string, MasteryItem>, skill: SkillTarget | string, correct: boolean, responseMs = 0, hintsUsed = 0) {
  const keyValue = `skill:${skill}`
  const active = skill === 'speaking' || skill === 'production' || skill.startsWith('speaking:') || skill.startsWith('production:')
  return { ...mastery, [keyValue]:updateItem(mastery[keyValue], keyValue, 'skill', correct, responseMs, hintsUsed, active) }
}

export function recordAttempt(items: AttemptSignal[], signal: AttemptSignal) { return [...items, signal].slice(-150) }

export function queueTransfers(items: TransferItem[], exercise: Exercise, correct: boolean, attemptCount: number) {
  if (correct && exercise.transferSourceExerciseId && exercise.transferRuleId) return items.filter(item => !(item.sourceExerciseId === exercise.transferSourceExerciseId && item.grammarRuleId === exercise.transferRuleId))
  if (!correct && exercise.transferSourceExerciseId && exercise.transferRuleId) return items.map(item => item.sourceExerciseId === exercise.transferSourceExerciseId && item.grammarRuleId === exercise.transferRuleId ? { ...item, failedTransfers:(item.failedTransfers || 0) + 1, dueAfter:attemptCount + 3 } : item)
  if (correct || !exercise.grammarRuleIds?.length) return items
  const created = exercise.grammarRuleIds.map(grammarRuleId => ({ sourceExerciseId:exercise.id, grammarRuleId, dueAfter:attemptCount + 2, createdAt:Date.now(), failedTransfers:0 }))
  const map = new Map(items.map(item => [`${item.sourceExerciseId}:${item.grammarRuleId}`, item]))
  created.forEach(item => map.set(`${item.sourceExerciseId}:${item.grammarRuleId}`, item))
  return Array.from(map.values())
}
