'use client'

import { Mistake, ReviewItem, UserProgress } from '@/types'

const KEY = 'slovensko-progress-v1'

export const defaultProgress: UserProgress = {
  completedLessons: [],
  streak: 1,
  introducedWords: [],
  wordsLearned: [],
  secureWords: [],
  mistakes: [],
  reviews: [],
  speakingMinutes: 0,
  listeningMinutes: 0,
}

export function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return defaultProgress
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...defaultProgress, ...JSON.parse(raw) } : defaultProgress
  } catch {
    return defaultProgress
  }
}

export function saveProgress(progress: UserProgress) {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(progress))
}

const intervals = [10 * 60_000, 24 * 60 * 60_000, 3 * 24 * 60 * 60_000, 7 * 24 * 60 * 60_000, 14 * 24 * 60 * 60_000, 30 * 24 * 60 * 60_000]

export function scheduleReview(items: ReviewItem[], key: string, correct: boolean): ReviewItem[] {
  const now = Date.now()
  const current = items.find(i => i.key === key)
  const nextIndex = correct ? Math.min((current?.intervalIndex ?? -1) + 1, intervals.length - 1) : 0
  const status = nextIndex >= 4 ? 'sicher' : nextIndex >= 2 ? 'gelernt' : correct ? 'unsicher' : 'neu'
  const next: ReviewItem = { key, intervalIndex: nextIndex, status, dueAt: now + intervals[nextIndex] }
  return [...items.filter(i => i.key !== key), next]
}

export function registerMistake(mistakes: Mistake[], key: string): Mistake[] {
  const current = mistakes.find(m => m.key === key)
  const next: Mistake = { key, count: (current?.count ?? 0) + 1, lastSeen: Date.now() }
  return [...mistakes.filter(m => m.key !== key), next].sort((a,b) => b.count - a.count)
}
