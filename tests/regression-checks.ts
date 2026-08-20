import assert from 'node:assert/strict'
import { exercises, vocabulary } from '../data/seed'
import { buildAdaptiveRecommendation, buildAdaptiveReviewDeck } from '../lib/adaptive-curriculum'
import { mergeProgress } from '../lib/cloud-sync'
import { isExerciseEligible, singularVerbIntroForVocabulary, verbFormKey } from '../lib/curriculum-access'
import { enrichExercises } from '../lib/curriculum-metadata'
import { buildExamPlan, EXAM_CONFIG } from '../lib/exam-planner'
import { stableChoiceOptions, validateExerciseSet } from '../lib/exercise-integrity'
import {
  createExerciseSession,
  ExerciseSessionResult,
  sessionSummary,
  validateSessionResults,
} from '../lib/exercise-session'
import { getVocabularyStatus } from '../lib/learner-status'
import {
  defaultProgress,
  queueTransfers,
  resetLearningProgress,
  scheduleReview,
  updateMastery,
} from '../lib/storage'
import { buildVerbPracticeExercises, verbFormStatus } from '../lib/verb-learning'
import type { Exercise, UserProgress, Vocabulary } from '../types'

function fresh(overrides: Partial<UserProgress> = {}): UserProgress {
  return { ...structuredClone(defaultProgress), preferences: { ...defaultProgress.preferences }, ...overrides }
}

function resultFor(sessionExerciseId: string, sourceExerciseId: string, correct = true): ExerciseSessionResult {
  return { sessionExerciseId, sourceExerciseId, correct, responseMs: 1000, vocabularyIds: [], grammarRuleIds: [] }
}

const enriched = enrichExercises(exercises)
const now = Date.now()
const choice: Exercise = { id: 't-choice', lesson: 1, type: 'choice', prompt: 'x', answer: 'A', alternatives: ['B'], vocabularyIds: ['v001'], grammarRuleIds: [], skillTargets: ['recognition'] }
const produce: Exercise = { id: 't-produce', lesson: 1, type: 'translate-de-sl', prompt: 'x', answer: 'Živjo', vocabularyIds: ['v001'], grammarRuleIds: ['greeting-basic'], skillTargets: ['production'] }

let progress = fresh({ introducedWords: ['v001'] })
assert.equal(getVocabularyStatus('v001', progress), 'eingeführt')
let mastery = updateMastery({}, choice, true, 3000, 0)
progress = { ...progress, mastery }
assert.notEqual(getVocabularyStatus('v001', progress), 'sicher')
assert.equal(mastery['vocab:v001'].activeCorrect, 0)
const passive = updateMastery({}, choice, true, 3000, 0)['vocab:v001']
const active = updateMastery({}, produce, true, 3000, 0)['vocab:v001']
assert.equal(active.activeCorrect, 1)
assert.equal(passive.passiveCorrect, 1)
assert.ok(active.score >= passive.score)
assert.ok(updateMastery({}, produce, true, 3000, 0)['vocab:v001'].score > updateMastery({}, produce, true, 3000, 1)['vocab:v001'].score)
assert.ok(updateMastery({}, produce, true, 3000, 0)['vocab:v001'].score > updateMastery({}, produce, true, 50000, 0)['vocab:v001'].score)

let queue = queueTransfers([], produce, false, 4)
assert.ok(queue.length > 0)
const transfer = { ...produce, id: 'transfer', transferSourceExerciseId: produce.id, transferRuleId: 'greeting-basic' }
queue = queueTransfers(queue, transfer, true, 8)
assert.equal(queue.length, 0)

let reviews = scheduleReview([], 'vocab:v001', true)
reviews = scheduleReview(reviews, 'vocab:v001', true)
assert.equal(reviews[0].intervalIndex, 1)
reviews = scheduleReview(reviews, 'vocab:v001', false)
assert.equal(reviews[0].intervalIndex, 0)

const local = fresh({ mastery: { 'grammar:dual-masculine-numeral': { key: 'grammar:dual-masculine-numeral', kind: 'grammar', score: .72, attempts: 5, correct: 4, lastSeen: now } }, updatedAt: now, preferencesUpdatedAt: now })
const cloud = fresh({ mastery: { 'grammar:dual-masculine-numeral': { key: 'grammar:dual-masculine-numeral', kind: 'grammar', score: .58, attempts: 4, correct: 3, lastSeen: now - 10000 } }, updatedAt: now - 10000, preferencesUpdatedAt: now - 10000 })
assert.equal(mergeProgress(local, cloud).mastery['grammar:dual-masculine-numeral'].score, .72)

assert.deepEqual(validateExerciseSet(exercises, vocabulary), [])
const shuffled: Exercise = { id: 'shuffle', lesson: 1, type: 'choice', prompt: 'ti + imeti', answer: 'imaš', alternatives: ['imam', 'ima', 'imamo'] }
const optionsA = stableChoiceOptions(shuffled, 'session-a')
assert.deepEqual(optionsA, stableChoiceOptions(shuffled, 'session-a'))
assert.equal(optionsA.filter(option => option.correct).length, 1)
assert.equal(optionsA.find(option => option.correct)?.text, 'imaš')

const e08 = enriched.find(exercise => exercise.id === 'e08')!
const e08Words = e08.vocabularyIds || []
const imetiKey = verbFormKey({ verbId: 'imeti', person: 1, number: 'singular' })
const merelyIntroduced = fresh({ introducedWords: e08Words, introducedGrammarRules: ['number-basics', 'dual-masculine-numeral', 'accusative-family', 'verb-first-person'], introducedVerbForms: [imetiKey] })
assert.equal(isExerciseEligible(e08, merelyIntroduced), false)
const grammarUnlocked = fresh({ ...merelyIntroduced, mastery: { [`verb:${imetiKey}`]: { key: `verb:${imetiKey}`, kind: 'verb', score: .75, attempts: 3, correct: 3, activeCorrect: 2, lastSeen: now } } })
assert.equal(isExerciseEligible(e08, grammarUnlocked), true)

const due = fresh({ preferences: { ...defaultProgress.preferences, onboardingCompleted: true }, introducedWords: ['v001'], reviews: [{ key: 'vocab:v001', status: 'unsicher', intervalIndex: 0, dueAt: 0, updatedAt: 1 }] })
assert.equal(buildAdaptiveRecommendation(due, [choice], vocabulary, 1, now).kind, 'review')
const lockedWeak = fresh({ preferences: { ...defaultProgress.preferences, onboardingCompleted: true }, mastery: { 'grammar:dual-masculine-numeral': { key: 'grammar:dual-masculine-numeral', kind: 'grammar', score: .3, attempts: 3, correct: 1, lastSeen: now } } })
assert.equal(buildAdaptiveRecommendation(lockedWeak, enriched, vocabulary, 1, now).kind, 'new-content')
const unlockedWeak = fresh({ ...grammarUnlocked, preferences: { ...defaultProgress.preferences, onboardingCompleted: true }, mastery: { ...grammarUnlocked.mastery, 'grammar:dual-masculine-numeral': { key: 'grammar:dual-masculine-numeral', kind: 'grammar', score: .3, attempts: 3, correct: 1, lastSeen: now } } })
assert.equal(buildAdaptiveRecommendation(unlockedWeak, enriched, vocabulary, 2, now).title, 'Grammatik gezielt festigen')
assert.ok(buildAdaptiveReviewDeck(unlockedWeak, enriched, 8, now).every(exercise => isExerciseEligible(exercise, unlockedWeak)))

const learned = fresh({ introducedWords: ['v001'], introducedGrammarRules: ['greeting-basic'], wordsLearned: ['v001'], completedLessons: [1], preferences: { ...defaultProgress.preferences, dailyGoalMinutes: 20 }, updatedAt: now - 100 })
const reset = resetLearningProgress(learned)
assert.equal(reset.introducedWords.length, 0)
assert.equal(reset.introducedGrammarRules.length, 0)
assert.equal(reset.preferences.dailyGoalMinutes, 20)
assert.equal(mergeProgress(reset, fresh({ introducedWords: ['v001'], completedLessons: [1], updatedAt: (reset.resetAt || now) - 1000 })).introducedWords.length, 0)

const imetiIntro = singularVerbIntroForVocabulary(['v032', 'v033'])[0]
assert.equal(imetiIntro.infinitiveDe, 'haben')
assert.deepEqual(imetiIntro.forms.map(form => form.person), [1, 2, 3])
assert.deepEqual(imetiIntro.forms.map(form => form.translationDe), ['ich habe', 'du hast', 'er / sie hat'])
const verbDeck = buildVerbPracticeExercises(1, imetiIntro)
assert.equal(verbDeck.length, 9)
assert.equal(verbDeck.filter(exercise => exercise.requiredVerbForms?.[0].person === 1).length, 3)
assert.ok(verbDeck.some(exercise => exercise.type === 'choice'))
assert.ok(verbDeck.filter(exercise => exercise.skillTargets?.includes('production')).length >= 6)
assert.deepEqual(validateExerciseSet(verbDeck), [])
let verbProgress = fresh({ introducedVerbForms: imetiIntro.keys })
for (const exercise of verbDeck.filter(item => item.requiredVerbForms?.[0].person === 1)) {
  verbProgress = { ...verbProgress, mastery: updateMastery(verbProgress.mastery, exercise, true, 3000, 0) }
}
assert.equal(verbFormStatus(verbProgress, { verbId: 'imeti', person: 1, number: 'singular' }), 'KNOWN')
assert.equal(verbFormStatus(verbProgress, { verbId: 'imeti', person: 2, number: 'dual' }), 'LOCKED')

const examVocab: Vocabulary[] = [{ id: 'tv1', sl: 'test', de: 'Test', partOfSpeech: 'Substantiv', category: 'Test', example: 'Test.', exampleDe: 'Test.', lesson: 99 }]
const examExercises: Exercise[] = Array.from({ length: 14 }, (_, index) => ({ id: `exam-${index}`, lesson: 99, type: index % 3 === 0 ? 'choice' : 'translate-de-sl', prompt: `Prüfungsfrage ${index}`, answer: `odgovor ${index}`, alternatives: index % 3 === 0 ? ['x', 'y'] : undefined, vocabularyIds: ['tv1'], grammarRuleIds: [], skillTargets: [index % 3 === 0 ? 'recognition' : 'production'] }))
const examProgress = fresh({ introducedWords: ['tv1'], preferences: { ...defaultProgress.preferences, onboardingCompleted: true, pace: 'normal', dailyGoalMinutes: 10 } })
const checkpoint = buildExamPlan({ kind: 'checkpoint', lessonId: 99, exercises: examExercises, vocabulary: examVocab, progress: examProgress, seed: 11, targetSize: EXAM_CONFIG.checkpoint.default })
const finalA = buildExamPlan({ kind: 'final', lessonId: 99, exercises: examExercises, vocabulary: examVocab, progress: examProgress, seed: 11, targetSize: EXAM_CONFIG.final.default })
const finalB = buildExamPlan({ kind: 'final', lessonId: 99, exercises: examExercises, vocabulary: examVocab, progress: examProgress, seed: 29, targetSize: EXAM_CONFIG.final.default })
assert.equal(checkpoint.length, 6)
assert.equal(finalA.length, 12)
assert.equal(new Set(finalA.map(exercise => exercise.id)).size, finalA.length)
assert.ok(new Set(finalA.map(exercise => exercise.type)).size >= 2)
assert.notDeepEqual(finalA.slice(0, 2).map(exercise => exercise.id), finalB.slice(0, 2).map(exercise => exercise.id))
for (const planned of finalA) {
  const original = examExercises.find(exercise => exercise.id === planned.id)
  if (original) {
    assert.equal(planned.prompt, original.prompt)
    assert.equal(planned.answer, original.answer)
  }
}

const checkpointSession = createExerciseSession('checkpoint', checkpoint, 'checkpoint-test')
assert.equal(checkpointSession.exercises.length, 6)
const checkpointResults = checkpointSession.exercises.map(item => resultFor(item.id, item.sourceExerciseId))
assert.deepEqual(validateSessionResults(checkpointSession, checkpointResults), [])
assert.deepEqual(sessionSummary(checkpointSession, checkpointResults), { total: 6, correct: 6, wrong: 0 })
assert.throws(() => sessionSummary(checkpointSession, [...checkpointResults, checkpointResults[0]]))

const finalSession = createExerciseSession('final-exam', finalA, 'final-test')
assert.equal(finalSession.exercises.length, 12)
const finalResults = finalSession.exercises.map((item, index) => resultFor(item.id, item.sourceExerciseId, index !== 0))
assert.deepEqual(sessionSummary(finalSession, finalResults), { total: 12, correct: 11, wrong: 1 })

const replacementSession = createExerciseSession('checkpoint', checkpoint.slice(0, 5), 'replacement-test')
assert.equal(replacementSession.exercises.length, 5)
assert.deepEqual(validateSessionResults(replacementSession, []), [])
assert.throws(() => sessionSummary(replacementSession, []))
assert.ok(validateSessionResults(replacementSession, checkpointResults).length > 0)

const verbSession = createExerciseSession('verb-practice', verbDeck, 'verb-test')
assert.equal(verbSession.exercises.length, 9)
assert.equal(verbSession.exercises[0].options.filter(option => option.correct).length, verbSession.exercises[0].exercise.type === 'choice' ? 1 : 0)

console.log('Regression checks passed')
