import test from 'node:test'
import assert from 'node:assert/strict'
import { compareAnswer, normalizeSurfaceForm } from '../lib/answerMatching'

function compare(input: string, expected: string, acceptedAnswers: string[] = []) {
  return compareAnswer({ input, expected, acceptedAnswers, inputMode: 'typed', allowNumericShorthand: true }).correct
}

test('surface formatting is tolerated', () => {
  assert.equal(compare('Imam dva brata.', 'Imam dva brata.'), true)
  assert.equal(compare('imam dva brata', 'Imam dva brata.'), true)
  assert.equal(compare('  IMAM   DVA BRATA!!! ', 'Imam dva brata.'), true)
  assert.equal(normalizeSurfaceForm('Živjo'.normalize('NFD')), normalizeSurfaceForm('Živjo'))
})

test('dual and gender stay grammatical', () => {
  assert.equal(compare('Imam 2 brata.', 'Imam dva brata.'), true)
  assert.equal(compare('Imam dve brata.', 'Imam dva brata.'), false)
  assert.equal(compare('Imam dve sestri.', 'Imam dve sestri.'), true)
  assert.equal(compare('Imam dva sestri.', 'Imam dve sestri.'), false)
})

test('location and direction are not interchangeable', () => {
  assert.equal(compare('Sem v Sloveniji.', 'Sem v Sloveniji.'), true)
  assert.equal(compare('Sem v Slovenijo.', 'Sem v Sloveniji.'), false)
  assert.equal(compare('Grem v Slovenijo.', 'Grem v Slovenijo.'), true)
  assert.equal(compare('Grem v Sloveniji.', 'Grem v Slovenijo.'), false)
  assert.equal(compare('Sem doma.', 'Sem doma.'), true)
  assert.equal(compare('Sem domov.', 'Sem doma.'), false)
  assert.equal(compare('Grem domov.', 'Grem domov.'), true)
  assert.equal(compare('Grem doma.', 'Grem domov.'), false)
})

test('case forms remain distinct', () => {
  assert.equal(compare('Jem pico.', 'Jem pico.'), true)
  assert.equal(compare('Jem pica.', 'Jem pico.'), false)
})

test('digits are resolved only to the exact expected number form', () => {
  assert.equal(compare('Grem spat ob 10.', 'Grem spat ob desetih.'), true)
  assert.equal(compare('Grem spat ob deset.', 'Grem spat ob desetih.'), false)
  assert.equal(compare('Imam 2 sestri.', 'Imam dve sestri.'), true)
  assert.equal(compare('Imam dva sestri.', 'Imam dve sestri.'), false)
})

test('accepted answers are explicit and grammatical', () => {
  assert.equal(compare('V Nemčiji živim.', 'Živim v Nemčiji.', ['V Nemčiji živim.']), true)
  assert.equal(compare('Živim v Nemčijo.', 'Živim v Nemčiji.', ['V Nemčiji živim.']), false)
})

test('Kam greš can accept multiple explicitly valid destinations', () => {
  const alternatives = ['Grem domov.', 'Grem v Ljubljano.', 'Grem v trgovino.', 'Grem v službo.']
  assert.equal(compare('Grem domov.', 'Grem v Slovenijo.', alternatives), true)
  assert.equal(compare('Grem v Ljubljano.', 'Grem v Slovenijo.', alternatives), true)
  assert.equal(compare('Sem doma.', 'Grem v Slovenijo.', alternatives), false)
})

test('speech digit artifacts are context aware', () => {
  assert.equal(compareAnswer({ input: 'Imam 2 brata', expected: 'Imam dva brata.', inputMode: 'speech' }).correct, true)
  assert.equal(compareAnswer({ input: 'Grem spat ob 10', expected: 'Grem spat ob desetih.', inputMode: 'speech' }).correct, true)
  assert.equal(compareAnswer({ input: 'Imam dve brata', expected: 'Imam dva brata.', inputMode: 'speech' }).correct, false)
})
