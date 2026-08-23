import assert from 'node:assert/strict'
import { evaluateAnswer } from '../lib/answer-evaluation'
import { mistakeCategoryFromEvaluation } from '../lib/learning-signals'

function issue(input:string, expected:string){
  return evaluateAnswer({input,expected,locale:'sl-SI'})
}

const numeral=issue('Imam dve brata.','Imam dva brata.')
assert.equal(numeral.classification,'GRAMMAR_ERROR')
assert.equal(numeral.issues[0]?.feature,'numeral')

const location=issue('Sem v Slovenijo.','Sem v Sloveniji.')
assert.equal(location.classification,'GRAMMAR_ERROR')
assert.equal(location.issues[0]?.feature,'case')
assert.equal(mistakeCategoryFromEvaluation(location),'case-error')

const direction=issue('Grem v Sloveniji.','Grem v Slovenijo.')
assert.equal(direction.classification,'GRAMMAR_ERROR')
assert.equal(direction.issues[0]?.feature,'case')

const negative=issue('Nimam čas.','Nimam časa.')
assert.equal(negative.classification,'GRAMMAR_ERROR')
assert.equal(negative.issues[0]?.feature,'case')

const number=issue('Mi greva domov.','Mi gremo domov.')
assert.equal(number.classification,'GRAMMAR_ERROR')
assert.equal(number.issues[0]?.feature,'number')
assert.equal(mistakeCategoryFromEvaluation(number),'number-error')

const person=issue('Jaz greš domov.','Jaz grem domov.')
assert.equal(person.classification,'GRAMMAR_ERROR')
assert.equal(person.issues[0]?.feature,'person')
assert.equal(mistakeCategoryFromEvaluation(person),'verb-person-error')

const reflexive=issue('peljem','peljem se')
assert.equal(reflexive.classification,'GRAMMAR_ERROR')
assert.equal(reflexive.issues[0]?.feature,'pronoun')
assert.equal(mistakeCategoryFromEvaluation(reflexive),'reflexive-error')

assert.equal(issue('Sem v Sloveniji.','Sem v Sloveniji.').isCorrect,true)
assert.equal(issue('Grem v Slovenijo.','Grem v Slovenijo.').isCorrect,true)
assert.equal(issue('Mi gremo domov.','Mi gremo domov.').isCorrect,true)

console.log('Slovene morphology checks passed')
