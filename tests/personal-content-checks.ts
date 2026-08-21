import assert from 'node:assert/strict'
import { exercises, vocabulary } from '../data/seed'
import { enrichExercises } from '../lib/curriculum-metadata'
import { isStrictlyAssessableExercise, validateExerciseIntegrity } from '../lib/exercise-integrity'
import { buildLearningBlocks } from '../lib/learning-flow'
import type { Exercise } from '../types'

const enriched = enrichExercises(exercises)
const personalIds = ['e07', 'e12', 'e18', 'e23', 'e24']

for (const id of personalIds) {
  const exercise = enriched.find(item => item.id === id)
  assert.ok(exercise, `Missing personal-open exercise ${id}`)
  assert.equal(exercise.responseScope, 'personal-open', `${id} must be personal-open`)
  assert.equal(exercise.evaluationMode, 'open', `${id} must use open evaluation`)
  assert.equal(isStrictlyAssessableExercise(exercise), false, `${id} must not enter strict assessment pools`)
}

const brotherQuestion = enriched.find(item => item.id === 'e12')!
assert.equal(brotherQuestion.prompt, 'Koliko bratov imaš?')
assert.equal(isStrictlyAssessableExercise(brotherQuestion), false)

const fixedTranslation = enriched.find(item => item.id === 'e08')!
assert.equal(fixedTranslation.prompt, 'Ich habe zwei Brüder.')
assert.equal(fixedTranslation.answer, 'Imam dva brata.')
assert.equal(fixedTranslation.responseScope, 'fixed')
assert.equal(isStrictlyAssessableExercise(fixedTranslation), true)

const invalidPersonalFixed: Exercise = {
  id: 'invalid-personal-fixed',
  lesson: 2,
  type: 'free',
  prompt: 'Koliko bratov imaš?',
  answer: 'Imam dva brata.',
  responseScope: 'personal-open',
  evaluationMode: 'exact',
}
assert.ok(validateExerciseIntegrity(invalidPersonalFixed).some(issue => issue.message.includes('personal-open exercise must use open or semantic evaluation')))

const validPersonalOpen: Exercise = {
  id: 'valid-personal-open',
  lesson: 2,
  type: 'free',
  prompt: 'Koliko bratov imaš?',
  answer: 'Imam dva brata.',
  acceptedAnswers: ['Nimam bratov.', 'Imam enega brata.'],
  responseScope: 'personal-open',
  evaluationMode: 'open',
}
assert.deepEqual(validateExerciseIntegrity(validPersonalOpen), [])
assert.equal(isStrictlyAssessableExercise(validPersonalOpen), false)

const lessonTwoBlocks = buildLearningBlocks(2, vocabulary, exercises, [])
assert.ok(lessonTwoBlocks.length > 0)
assert.equal(
  lessonTwoBlocks.flatMap(block => block.exercises).some(exercise => exercise.responseScope === 'personal-open'),
  false,
  'personal-open prompts must not enter strict learning blocks',
)

console.log('Personal content integrity checks passed')
