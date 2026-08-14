import test from 'node:test'
import assert from 'node:assert/strict'
import { validateFreeProduction } from '../lib/freeProduction'
import type { Exercise } from '../types'

function free(prompt: string): Exercise {
  return { id:'free', lesson:1, type:'free', prompt, answer:'Sem v Sloveniji.', evaluationMode:'free', level:'A1', skills:['schreiben'] }
}

test('Kje si zdaj accepts plausible Slovenian location answers', () => {
  const exercise = free('Antworte: Kje si zdaj?')
  assert.equal(validateFreeProduction(exercise, 'Sem doma.').acceptable, true)
  assert.equal(validateFreeProduction(exercise, 'Sem v Avstriji.').acceptable, true)
  assert.equal(validateFreeProduction(exercise, 'Zdaj sem v službi.').acceptable, true)
})

test('Kje si zdaj does not accept arbitrary German text', () => {
  const exercise = free('Antworte: Kje si zdaj?')
  assert.equal(validateFreeProduction(exercise, 'Kann hier alles eingeben was ich will').acceptable, false)
})

test('personal food and drink questions require the learned verb form', () => {
  assert.equal(validateFreeProduction(free('Kaj ješ danes?'), 'Danes jem pico.').acceptable, true)
  assert.equal(validateFreeProduction(free('Kaj ješ danes?'), 'Pijem vodo.').acceptable, false)
  assert.equal(validateFreeProduction(free('Kaj piješ?'), 'Pijem kavo.').acceptable, true)
})
