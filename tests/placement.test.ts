import test from 'node:test'
import assert from 'node:assert/strict'
import { placementA1, placementA2, scorePlacement, shouldContinueToA2 } from '../lib/placement'

test('placement only continues to A2 with enough A1 evidence', () => {
  assert.equal(shouldContinueToA2(0), false)
  assert.equal(shouldContinueToA2(1), false)
  assert.equal(shouldContinueToA2(2), true)
  assert.equal(shouldContinueToA2(3), true)
})

test('a few correct A2 items can establish an A2 starting point', () => {
  const results = [
    ...placementA1.map(question => ({ question, correct: true })),
    { question: placementA2[0], correct: true },
    { question: placementA2[1], correct: true },
    { question: placementA2[2], correct: false },
  ]
  const score = scorePlacement(results)
  assert.equal(score.level, 'A2')
  assert.ok(score.knownTargets.includes('grammar:location-direction'))
  assert.ok(score.weakTargets.includes('skill:hören'))
})

test('one A2 success does not promote the learner to A2', () => {
  const results = [
    ...placementA1.map(question => ({ question, correct: true })),
    { question: placementA2[0], correct: true },
    { question: placementA2[1], correct: false },
    { question: placementA2[2], correct: false },
  ]
  assert.equal(scorePlacement(results).level, 'A1')
})
