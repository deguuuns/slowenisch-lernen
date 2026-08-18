import test from 'node:test'
import assert from 'node:assert/strict'
import { placementA1, placementA2, scorePlacement, shouldContinueToA2 } from '../lib/placement'

test('placement only continues to the extension with strong basic recognition evidence', () => {
  assert.equal(shouldContinueToA2(0), false)
  assert.equal(shouldContinueToA2(3), false)
  assert.equal(shouldContinueToA2(4), true)
  assert.equal(shouldContinueToA2(5), true)
})

test('placement starts with practical beginner vocabulary and sem recognition', () => {
  const ids = placementA1.map(question => question.id)
  assert.ok(ids.includes('p-zivjo'))
  assert.ok(ids.includes('p-hvala'))
  assert.ok(ids.includes('p-prosim'))
  assert.ok(ids.includes('p-sem'))
  assert.equal(placementA1.some(question => question.learningTargets.includes('grammar:dual')), false)
})

test('several successful extension items can establish an A2 starting point', () => {
  const results = [
    ...placementA1.map(question => ({ question, correct: true })),
    { question: placementA2[0], correct: true },
    { question: placementA2[1], correct: true },
    { question: placementA2[2], correct: false },
  ]
  const score = scorePlacement(results)
  assert.equal(score.level, 'A2')
  assert.ok(score.knownTargets.includes('conjugation:biti:2s'))
  assert.ok(score.weakTargets.includes('skill:hören'))
})

test('one extension success does not promote the learner to A2', () => {
  const results = [
    ...placementA1.map(question => ({ question, correct: true })),
    { question: placementA2[0], correct: true },
    { question: placementA2[1], correct: false },
    { question: placementA2[2], correct: false },
  ]
  assert.equal(scorePlacement(results).level, 'A1')
})
