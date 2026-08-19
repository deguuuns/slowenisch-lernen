import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeProgress } from '../lib/cloudSync'
import { createResetProgress, defaultProgress } from '../lib/storage'

test('mergeProgress keeps learning from both devices', () => {
  const local = {
    ...defaultProgress,
    completedLessons: [1],
    wordsLearned: ['vocab:živjo'],
    speakingMinutes: 2,
    learningItems: {
      'grammar:dual': { key: 'grammar:dual', kind: 'grammar' as const, attempts: 3, correctCount: 2, incorrectCount: 1, correctStreak: 1, incorrectStreak: 0, mastery: 0.5, difficulty: 3, introduced: true, lastSeenAt: 200 },
    },
  }
  const cloud = {
    ...defaultProgress,
    completedLessons: [2],
    wordsLearned: ['vocab:hvala'],
    listeningMinutes: 4,
    learningItems: {
      'grammar:dual': { key: 'grammar:dual', kind: 'grammar' as const, attempts: 4, correctCount: 3, incorrectCount: 1, correctStreak: 2, incorrectStreak: 0, mastery: 0.7, difficulty: 3, introduced: true, lastSeenAt: 300 },
    },
  }

  const merged = mergeProgress(local, cloud)
  assert.deepEqual(new Set(merged.completedLessons), new Set([1, 2]))
  assert.deepEqual(new Set(merged.wordsLearned), new Set(['vocab:živjo', 'vocab:hvala']))
  assert.equal(merged.speakingMinutes, 2)
  assert.equal(merged.listeningMinutes, 4)
  assert.equal(merged.learningItems?.['grammar:dual'].mastery, 0.7)
  assert.equal(merged.learningItems?.['grammar:dual'].attempts, 4)
})

test('a newer explicit reset prevents older cloud learning from coming back', () => {
  const oldCloud = {
    ...defaultProgress,
    resetGeneration: 1,
    completedLessons: [1, 2, 3],
    wordsLearned: ['hvala'],
    reviews: [{ key: 'vocab:hvala', status: 'gelernt' as const, dueAt: 123, intervalIndex: 2 }],
    learningItems: {
      'vocab:hvala': { key: 'vocab:hvala', kind: 'vocabulary' as const, attempts: 5, correctCount: 5, incorrectCount: 0, correctStreak: 5, incorrectStreak: 0, mastery: 0.9, difficulty: 1 },
    },
  }
  const resetLocal = createResetProgress(oldCloud, 5_000)
  const merged = mergeProgress(resetLocal, oldCloud)

  assert.equal(merged.resetGeneration, 2)
  assert.equal(merged.progressResetAt, 5_000)
  assert.deepEqual(merged.completedLessons, [])
  assert.deepEqual(merged.wordsLearned, [])
  assert.deepEqual(merged.reviews, [])
  assert.deepEqual(merged.learningItems, {})
  assert.deepEqual(merged.recentSessionHistory, [])
})

test('a newer cloud reset also wins over stale local progress', () => {
  const staleLocal = {
    ...defaultProgress,
    resetGeneration: 2,
    completedLessons: [1],
    wordsLearned: ['živjo'],
  }
  const cloudReset = {
    ...defaultProgress,
    resetGeneration: 3,
    progressResetAt: 9_000,
  }
  const merged = mergeProgress(staleLocal, cloudReset)

  assert.equal(merged.resetGeneration, 3)
  assert.equal(merged.progressResetAt, 9_000)
  assert.deepEqual(merged.completedLessons, [])
  assert.deepEqual(merged.wordsLearned, [])
})
