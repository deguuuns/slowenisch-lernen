import test from 'node:test'
import assert from 'node:assert/strict'
import { validateFreeProduction } from '../lib/freeProduction'
import type { Exercise } from '../types'

function free(prompt: string): Exercise {
  return { id:'free', lesson:1, type:'free', prompt, answer:'Sem v Sloveniji.', evaluationMode:'free', level:'A1', skills:['schreiben'] }
}

test('Kje si zdaj accepts high-confidence Slovenian location answers', () => {
  const exercise = free('Antworte: Kje si zdaj?')
  assert.equal(validateFreeProduction(exercise, 'Sem doma.').acceptable, true)
  assert.equal(validateFreeProduction(exercise, 'Sem v Avstriji.').acceptable, true)
  assert.equal(validateFreeProduction(exercise, 'Zdaj sem v službi.').acceptable, true)
})

test('Kje si zdaj rejects malformed text even when it starts with Sem', () => {
  const exercise = free('Antworte: Kje si zdaj?')
  const screenshotRegression = validateFreeProduction(exercise, 'Sem in nemo')
  assert.equal(screenshotRegression.acceptable, false)
  assert.equal(screenshotRegression.reason, 'unverified-location')
  assert.equal(validateFreeProduction(exercise, 'Sem blabla').acceptable, false)
})

test('Kje si zdaj does not accept arbitrary German text', () => {
  const exercise = free('Antworte: Kje si zdaj?')
  assert.equal(validateFreeProduction(exercise, 'Kann hier alles eingeben was ich will').acceptable, false)
})

test('explicit accepted location alternatives remain valid', () => {
  const exercise = { ...free('Antworte: Kje si zdaj?'), acceptedAnswers:['Sem v Kopru.'] }
  assert.equal(validateFreeProduction(exercise, 'Sem v Kopru.').acceptable, true)
})

test('personal food and drink questions require the learned verb form', () => {
  assert.equal(validateFreeProduction(free('Kaj ješ danes?'), 'Danes jem pico.').acceptable, true)
  assert.equal(validateFreeProduction(free('Kaj ješ danes?'), 'Pijem vodo.').acceptable, false)
  assert.equal(validateFreeProduction(free('Kaj piješ?'), 'Pijem kavo.').acceptable, true)
})
