import assert from 'node:assert/strict'
import { evaluateAnswer } from '../lib/answer-evaluation'
import { conjugationMistakeCategory, inferMistakeCategoryFromExerciseId, mistakeCategoryFromEvaluation } from '../lib/learning-signals'

const typo = evaluateAnswer({ input:'domof', expected:'domov', locale:'sl-SI' })
assert.equal(mistakeCategoryFromEvaluation(typo), 'spelling-error')

const incomplete = evaluateAnswer({ input:'sem', expected:'sem doma', locale:'sl-SI' })
assert.equal(mistakeCategoryFromEvaluation(incomplete), 'incomplete-answer')

assert.equal(conjugationMistakeCategory('plural', 'dual'), 'dual-error')
assert.equal(conjugationMistakeCategory('plural', 'singular'), 'plural-error')
assert.equal(inferMistakeCategoryFromExerciseId('vocab-test:v001:de-sl:mistake:wrong-meaning'), 'wrong-meaning')
assert.equal(inferMistakeCategoryFromExerciseId('conj:iti:dual:1'), 'verb-person-error')

console.log('learning signal checks passed')
