import test from 'node:test'
import assert from 'node:assert/strict'
import { exercises } from '../data/diverseContent'

function byId(id: string) {
  const exercise = exercises.find(item => item.id === id)
  assert.ok(exercise, `missing exercise ${id}`)
  return exercise
}

test('listening answer does not reveal its audio transcript in the visible prompt', () => {
  const exercise = byId('d-loc-listen')
  assert.ok(exercise.audioPrompt)
  assert.equal(exercise.prompt.toLocaleLowerCase('sl-SI').includes(exercise.audioPrompt!.toLocaleLowerCase('sl-SI')), false)
})

test('direction production requires the location-direction grammar introduction', () => {
  const exercise = byId('d-dir-speak')
  assert.ok(exercise.requiredGrammar?.includes('location-direction'))
  assert.ok(exercise.requiredVocabulary?.includes('grem'))
  assert.ok(exercise.requiredVocabulary?.includes('kam'))
})

test('greeting production requires the corresponding chunk to be introduced', () => {
  const exercise = byId('d-greet-speak')
  assert.ok(exercise.requiredVocabulary?.includes('dobro jutro'))
})

test('dual, time and accusative have explicit introduction exercises', () => {
  const dual = byId('gf-dual-rule-intro')
  const time = byId('gf-time-rule-intro')
  const accusative = byId('gf-accusative-rule-intro')
  assert.ok(dual.introducesGrammar?.includes('dual'))
  assert.ok(time.introducesGrammar?.includes('time-number-form'))
  assert.ok(accusative.introducesGrammar?.includes('accusative'))
})
