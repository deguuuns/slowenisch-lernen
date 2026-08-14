'use client'

import { Mistake, ReviewItem, UserProgress } from '@/types'
import { scheduleReview as scheduleAdaptiveReview } from './spacedRepetition'

const CURRENT_KEY = 'slovensko-progress-v2'
const LEGACY_KEYS = ['slovensko-progress-v1']
const SCHEMA_VERSION = 2

export const defaultProgress: UserProgress = {
  schemaVersion: SCHEMA_VERSION,
  completedLessons: [],
  streak: 1,
  wordsLearned: [],
  secureWords: [],
  mistakes: [],
  reviews: [],
  speakingMinutes: 0,
  listeningMinutes: 0,
  totalLearningMinutes: 0,
  dailyActivity: [],
  skillXp: {},
}

function migrateProgress(input: Partial<UserProgress> | null | undefined): UserProgress {
  const progress: UserProgress = {
    ...defaultProgress,
    ...(input ?? {}),
    schemaVersion: SCHEMA_VERSION,
    completedLessons: Array.isArray(input?.completedLessons) ? input.completedLessons : [],
    wordsLearned: Array.isArray(input?.wordsLearned) ? input.wordsLearned : [],
    secureWords: Array.isArray(input?.secureWords) ? input.secureWords : [],
    mistakes: Array.isArray(input?.mistakes) ? input.mistakes : [],
    reviews: Array.isArray(input?.reviews) ? input.reviews : [],
    dailyActivity: Array.isArray(input?.dailyActivity) ? input.dailyActivity : [],
    skillXp: input?.skillXp ?? {},
  }

  progress.reviews = progress.reviews.map(item => ({
    ...item,
    correctCount: item.correctCount ?? Math.max(0, item.intervalIndex),
    incorrectCount: item.incorrectCount ?? 0,
    difficulty: item.difficulty ?? 3,
    ease: item.ease ?? 1,
  }))

  return progress
}

function readStoredProgress() {
  if (typeof window === 'undefined') return null
  const current = localStorage.getItem(CURRENT_KEY)
  if (current) return current
  for (const key of LEGACY_KEYS) {
    const legacy = localStorage.getItem(key)
    if (legacy) return legacy
  }
  return null
}

export function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return defaultProgress
  try {
    const raw = readStoredProgress()
    if (!raw) return defaultProgress
    const migrated = migrateProgress(JSON.parse(raw))
    localStorage.setItem(CURRENT_KEY, JSON.stringify(migrated))
    return migrated
  } catch {
    return defaultProgress
  }
}

export function saveProgress(progress: UserProgress) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(migrateProgress(progress)))
  }
}

export function scheduleReview(items: ReviewItem[], key: string, correct: boolean, responseMs?: number): ReviewItem[] {
  return scheduleAdaptiveReview(items, key, { correct, responseMs })
}

export function registerMistake(mistakes: Mistake[], key: string, category?: Mistake['category']): Mistake[] {
  const current = mistakes.find(m => m.key === key)
  const next: Mistake = {
    key,
    category: category ?? current?.category ?? 'unknown',
    count: (current?.count ?? 0) + 1,
    lastSeen: Date.now(),
  }
  return [...mistakes.filter(m => m.key !== key), next].sort((a,b) => b.count - a.count)
}

export function recordLearningTime(progress: UserProgress, minutes: number, correct?: boolean): UserProgress {
  const date = new Date().toISOString().slice(0, 10)
  const activity = [...(progress.dailyActivity ?? [])]
  const existing = activity.find(item => item.date === date)
  const nextDay = existing
    ? { ...existing, minutes: +(existing.minutes + minutes).toFixed(1), exercises: existing.exercises + 1, correct: existing.correct + (correct ? 1 : 0) }
    : { date, minutes: +minutes.toFixed(1), exercises: 1, correct: correct ? 1 : 0 }

  return {
    ...progress,
    totalLearningMinutes: +((progress.totalLearningMinutes ?? 0) + minutes).toFixed(1),
    dailyActivity: [...activity.filter(item => item.date !== date), nextDay].slice(-90),
    lastSessionAt: Date.now(),
  }
}
