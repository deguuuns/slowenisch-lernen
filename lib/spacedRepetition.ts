import { LearningStatus, ReviewItem } from '@/types'

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE
const REPAIR_INTERVAL = 10 * MINUTE
const SUCCESS_INTERVALS = [DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY, 60 * DAY]

export type ReviewResult = {
  correct: boolean
  responseMs?: number
  confidence?: 1 | 2 | 3 | 4 | 5
  difficulty?: number
  now?: number
}

export function effectiveStatus(item: ReviewItem, now = Date.now()): LearningStatus {
  if (item.dueAt <= now && item.status !== 'neu') return 'überfällig'
  return item.status
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function intervalMultiplier(result: ReviewResult, current?: ReviewItem) {
  let multiplier = current?.ease ?? 1
  if (result.responseMs && result.responseMs < 4_000) multiplier += 0.08
  if (result.responseMs && result.responseMs > 15_000) multiplier -= 0.1
  if (result.confidence) multiplier += (result.confidence - 3) * 0.04
  if (result.difficulty) multiplier -= clamp(result.difficulty - 3, -2, 2) * 0.04
  return clamp(multiplier, 0.7, 1.4)
}

export function scheduleReviewItem(current: ReviewItem | undefined, key: string, result: ReviewResult): ReviewItem {
  const now = result.now ?? Date.now()
  const correctCount = (current?.correctCount ?? 0) + (result.correct ? 1 : 0)
  const incorrectCount = (current?.incorrectCount ?? 0) + (result.correct ? 0 : 1)

  if (!result.correct) {
    return {
      key,
      status: incorrectCount >= 2 ? 'unsicher' : 'neu',
      dueAt: now + REPAIR_INTERVAL,
      intervalIndex: 0,
      correctCount,
      incorrectCount,
      lastReviewedAt: now,
      lastResponseMs: result.responseMs,
      confidence: result.confidence,
      difficulty: result.difficulty ?? current?.difficulty ?? 3,
      ease: clamp((current?.ease ?? 1) - 0.12, 0.7, 1.4),
    }
  }

  // A clean success is never scheduled again after only a few minutes. The first
  // normal review is about a day later; 10 minutes is reserved for repair after errors.
  const previousSuccessfulIndex = current && current.correctCount && current.correctCount > 0 ? current.intervalIndex : -1
  const nextIndex = Math.min(previousSuccessfulIndex + 1, SUCCESS_INTERVALS.length - 1)
  const multiplier = intervalMultiplier(result, current)
  const dueAt = now + Math.round(SUCCESS_INTERVALS[nextIndex] * multiplier)
  const status: LearningStatus = nextIndex >= 4 ? 'sicher' : nextIndex >= 2 ? 'gelernt' : 'unsicher'

  return {
    key,
    status,
    dueAt,
    intervalIndex: nextIndex,
    correctCount,
    incorrectCount,
    lastReviewedAt: now,
    lastResponseMs: result.responseMs,
    confidence: result.confidence,
    difficulty: result.difficulty ?? current?.difficulty ?? 3,
    ease: multiplier,
  }
}

export function scheduleReview(items: ReviewItem[], key: string, result: ReviewResult): ReviewItem[] {
  const current = items.find(item => item.key === key)
  const next = scheduleReviewItem(current, key, result)
  return [...items.filter(item => item.key !== key), next]
}

export function selectReviewQueue(items: ReviewItem[], mistakeCounts: Record<string, number>, limit = 12, now = Date.now()) {
  return [...items]
    .map(item => ({
      item,
      overdueMs: Math.max(0, now - item.dueAt),
      mistakes: mistakeCounts[item.key] ?? 0,
    }))
    .sort((a, b) => {
      const scoreA = (a.overdueMs > 0 ? 10 : 0) + Math.min(a.overdueMs / DAY, 10) + a.mistakes * 2 + (a.item.status === 'unsicher' ? 3 : 0)
      const scoreB = (b.overdueMs > 0 ? 10 : 0) + Math.min(b.overdueMs / DAY, 10) + b.mistakes * 2 + (b.item.status === 'unsicher' ? 3 : 0)
      return scoreB - scoreA
    })
    .slice(0, limit)
    .map(entry => entry.item.key)
}
