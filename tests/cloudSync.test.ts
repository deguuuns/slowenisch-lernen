import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeProgress } from '../lib/cloudSync'
import { defaultProgress } from '../lib/storage'

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
