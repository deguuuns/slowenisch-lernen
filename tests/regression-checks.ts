import assert from 'node:assert/strict'
import { conversations, exercises, sentences, vocabulary } from '../data/seed'
import { buildAdaptiveRecommendation, buildAdaptiveReviewDeck } from '../lib/adaptive-curriculum'
import { evaluateAnswer } from '../lib/answer-evaluation'
import { mergeProgress } from '../lib/cloud-sync'
import { GRAMMAR_RULES, isExerciseEligible, singularVerbIntroForVocabulary, verbFormKey } from '../lib/curriculum-access'
import { enrichExercises } from '../lib/curriculum-metadata'
import { buildExamPlan, EXAM_CONFIG, majorTestDue } from '../lib/exam-planner'
import { stableChoiceOptions, validateExerciseSet } from '../lib/exercise-integrity'
import { createExerciseSession, ExerciseSessionResult, sessionSummary, validateSessionResults } from '../lib/exercise-session'
import { generatedExercisesForWord, isConjugatedVerbVocabulary } from '../lib/learning-flow'
import { dedupeExercisesByTarget, inferTargetContentKeys, inferSupportingContentKeys, isReviewDue } from '../lib/learning-targets'
import { REVIEW_INTERVALS_DAYS } from '../lib/learning-config'
import { buildSessionPlan } from '../lib/session-planner'
import { defaultProgress, hydrateProgress, resetLearningProgress, scheduleReview, updateMastery } from '../lib/storage'
import { buildVerbPracticeExercises, verbFormStatus } from '../lib/verb-learning'
import type { Exercise, UserProgress, Vocabulary } from '../types'

function fresh(overrides: Partial<UserProgress> = {}): UserProgress {
  return { ...structuredClone(defaultProgress), preferences: { ...defaultProgress.preferences }, ...overrides }
}

function resultFor(sessionExerciseId: string, sourceExerciseId: string, correct = true): ExerciseSessionResult {
  return { sessionExerciseId, sourceExerciseId, correct, responseMs: 1000, vocabularyIds: [], grammarRuleIds: [] }
}

function evaluateExercise(exercise: Exercise, input: string) {
  return evaluateAnswer({ input, expected: exercise.answer, alternatives: exercise.acceptedAnswers })
}

const now = Date.now()
const day = 24 * 60 * 60_000
const enriched = enrichExercises(exercises)

const migrated = hydrateProgress({ completedLessons:[1], introducedWords:['v001'], reviews:[{ key:'e01', status:'unsicher', intervalIndex:0, dueAt:0 }, { key:'vocab:v001', status:'unsicher', intervalIndex:0, dueAt:0, updatedAt:now }] } as Partial<UserProgress>)
assert.deepEqual(migrated.completedLessons, [1])
assert.equal(migrated.reviews.some(review => review.key === 'e01'), false)
assert.equal(migrated.reviews.some(review => review.key === 'vocab:v001'), true)

let reviews = scheduleReview([], 'vocab:v001', true, now)
assert.equal(reviews[0].intervalIndex, 0)
assert.equal(reviews[0].dueAt, now + REVIEW_INTERVALS_DAYS[0] * day)
assert.equal(isReviewDue({ ...fresh(), reviews }, 'vocab:v001', now + 2 * 60 * 60_000), false)
reviews = scheduleReview(reviews, 'vocab:v001', true, now + day)
assert.equal(reviews[0].intervalIndex, 1)
assert.equal(reviews[0].dueAt, now + day + REVIEW_INTERVALS_DAYS[1] * day)
reviews = scheduleReview(reviews, 'vocab:v001', false, now + 2 * day)
assert.equal(reviews[0].intervalIndex, -1)
assert.equal(reviews[0].consecutiveCorrect, 0)

const sameTarget: Exercise[] = [
  { id:'a', lesson:1, type:'translate-de-sl', prompt:'Bruder', answer:'brat', vocabularyIds:['v001'], targetContentKeys:['vocab:v001'] },
  { id:'b', lesson:1, type:'choice', prompt:'brat?', answer:'Bruder', alternatives:['Schwester','Vater'], vocabularyIds:['v001'], targetContentKeys:['vocab:v001'] },
]
assert.equal(dedupeExercisesByTarget(sameTarget).length, 1)
assert.deepEqual(inferTargetContentKeys(sameTarget[0]), ['vocab:v001'])

const metadataExample: Exercise = { id:'meta', lesson:1, type:'translate-de-sl', prompt:'x', answer:'y', vocabularyIds:['v001','v002'], grammarRuleIds:['greeting-basic','verb-first-person'] }
assert.deepEqual(inferTargetContentKeys(metadataExample), ['grammar:greeting-basic'])
assert.ok(inferSupportingContentKeys(metadataExample).includes('vocab:v002'))

const imetiIntro = singularVerbIntroForVocabulary(['v032', 'v033'])[0]
const verbDeck = buildVerbPracticeExercises(1, imetiIntro)
assert.equal(verbDeck.length, 3)
assert.ok(verbDeck.every(exercise => exercise.verbAnswerMode === 'full-person-form'))
assert.equal(verbDeck[0].answer, 'jaz imam')
assert.ok(verbDeck[0].acceptedAnswers?.includes('imam'))
assert.ok(verbDeck[0].acceptedAnswers?.includes('jaz imam'))
assert.deepEqual(validateExerciseSet(verbDeck), [])
assert.equal(evaluateExercise(verbDeck[0], 'Jaz imam').isCorrect, true)
assert.equal(evaluateExercise(verbDeck[1], 'Ti imaš').isCorrect, true)
assert.equal(evaluateExercise(verbDeck[1], 'jaz imam').isCorrect, false)
let verbProgress = fresh({ introducedVerbForms: imetiIntro.keys })
verbProgress = { ...verbProgress, mastery:updateMastery(verbProgress.mastery, verbDeck[0], true, 3000, 0) }
assert.equal(verbFormStatus(verbProgress, { verbId:'imeti', person:1, number:'singular' }), 'KNOWN')
assert.equal(verbFormStatus(verbProgress, { verbId:'imeti', person:2, number:'dual' }), 'LOCKED')

const bitiIntro = singularVerbIntroForVocabulary(['v011', 'v012', 'v013'])[0]
const bitiDeck = buildVerbPracticeExercises(1, bitiIntro)
const bitiFirst = bitiDeck.find(exercise => exercise.requiredVerbForms?.[0].person === 1)!
const bitiSecond = bitiDeck.find(exercise => exercise.requiredVerbForms?.[0].person === 2)!
const bitiThird = bitiDeck.find(exercise => exercise.requiredVerbForms?.[0].person === 3)!
assert.equal(bitiFirst.answer, 'jaz sem')
assert.ok(bitiSecond.acceptedAnswers?.includes('ti si'))
assert.equal(evaluateExercise(bitiFirst, 'jaz sem').isCorrect, true)
assert.equal(evaluateExercise(bitiSecond, 'Ti si').isCorrect, true)
assert.equal(evaluateExercise(bitiThird, 'On je').isCorrect, true)
assert.equal(evaluateExercise(bitiThird, 'Ona je').isCorrect, true)
assert.equal(evaluateExercise(bitiThird, 'Ono je').isCorrect, true)
assert.equal(evaluateExercise(bitiSecond, 'jaz sem').isCorrect, false)

const itiIntro = singularVerbIntroForVocabulary(['v024', 'v025'])[0]
const itiDeck = buildVerbPracticeExercises(1, itiIntro)
const itiSecond = itiDeck.find(exercise => exercise.requiredVerbForms?.[0].person === 2)!
assert.equal(itiSecond.answer, 'ti greš')
assert.equal(evaluateExercise(itiSecond, 'Ti greš').isCorrect, true)
assert.equal(evaluateExercise(itiSecond, 'ti grem').isCorrect, false)

const formOnly: Exercise = { id:'form-only', lesson:1, type:'fill', prompt:'Ti ___', answer:'si', verbAnswerMode:'form-only' }
const gapFill: Exercise = { id:'gap-fill', lesson:1, type:'fill', prompt:'Jaz ___ doma.', answer:'sem', verbAnswerMode:'gap-fill' }
assert.equal(evaluateExercise(formOnly, 'si').isCorrect, true)
assert.equal(evaluateExercise(gapFill, 'sem').isCorrect, true)

const lessonOneWords = vocabulary.filter(word => word.lesson === 1)
for (const id of ['v012','v025']) {
  const word = vocabulary.find(item => item.id === id)!
  assert.equal(isConjugatedVerbVocabulary(word), true)
  assert.deepEqual(generatedExercisesForWord(word, lessonOneWords), [])
}
const imasWord = vocabulary.find(item => item.id === 'v033')!
assert.equal(isConjugatedVerbVocabulary(imasWord), true)
assert.deepEqual(generatedExercisesForWord(imasWord, vocabulary.filter(word => word.lesson === 2)), [])
const itiWord = vocabulary.find(item => item.id === 'v023')!
assert.equal(isConjugatedVerbVocabulary(itiWord), false)
assert.ok(generatedExercisesForWord(itiWord, lessonOneWords).length > 0)

const verbSessionCopy = createExerciseSession('verb-practice', bitiDeck, 'verb-answer-mode-copy')
const copiedSecond = verbSessionCopy.exercises.find(item => item.exercise.requiredVerbForms?.[0].person === 2)!.exercise
assert.equal(copiedSecond.verbAnswerMode, 'full-person-form')
assert.ok(copiedSecond.acceptedAnswers?.includes('ti si'))
assert.equal(evaluateExercise(copiedSecond, 'Ti si').isCorrect, true)

const userFacingContent = [
  ...vocabulary.flatMap(word => [word.sl, word.de, word.example, word.exampleDe]),
  ...sentences.flatMap(sentence => [sentence.sl, sentence.de]),
  ...exercises.flatMap(exercise => [exercise.prompt, exercise.answer, ...(exercise.acceptedAnswers || [])]),
  ...conversations.flatMap(conversation => conversation.turns.flatMap(turn => [turn.sl, turn.de || ''])),
  ...Object.values(GRAMMAR_RULES).flatMap(rule => [rule.title, rule.body, ...rule.examples]),
].join(' ')
assert.equal(userFacingContent.includes('Dejan'), false)
assert.equal(userFacingContent.includes('petintrideset'), false)
assert.equal(userFacingContent.includes('35 Jahre'), false)
assert.equal(vocabulary.find(word => word.id === 'v060')?.sl, 'šest')
assert.equal(vocabulary.find(word => word.id === 'v060')?.de, 'sechs')

const introduced = fresh({ introducedWords:['v001'], introducedGrammarRules:['greeting-basic'], preferences:{ ...defaultProgress.preferences, onboardingCompleted:true } })
assert.equal(buildAdaptiveReviewDeck(introduced, enriched, 8, now, vocabulary).length, 0)
assert.equal(buildSessionPlan(introduced, enriched, 1, vocabulary).total, 0)
const dueProgress = fresh({ ...introduced, reviews:[{ key:'vocab:v001', status:'unsicher', intervalIndex:0, dueAt:now - 1, updatedAt:now - day }] })
assert.equal(buildAdaptiveRecommendation(dueProgress, enriched, vocabulary, 1, now).kind, 'review')
const dueDeck = buildAdaptiveReviewDeck(dueProgress, enriched, 8, now, vocabulary)
assert.ok(dueDeck.length >= 1)
assert.ok(dueDeck.some(exercise => inferTargetContentKeys(exercise).includes('vocab:v001')))

const weakNotDue = fresh({ ...introduced, mastery:{ 'vocab:v001':{ key:'vocab:v001', kind:'vocabulary', score:.2, attempts:5, correct:1, lastSeen:now } }, reviews:[{ key:'vocab:v001', status:'unsicher', intervalIndex:1, dueAt:now + 3 * day, updatedAt:now }] })
assert.notEqual(buildAdaptiveRecommendation(weakNotDue, enriched, vocabulary, 1, now).kind, 'review')

const e08 = enriched.find(exercise => exercise.id === 'e08')!
const imetiKey = verbFormKey({ verbId:'imeti', person:1, number:'singular' })
const locked = fresh({ introducedWords:e08.vocabularyIds || [], introducedGrammarRules:['number-basics','dual-masculine-numeral','accusative-family','verb-first-person'], introducedVerbForms:[imetiKey] })
assert.equal(isExerciseEligible(e08, locked), false)
const unlocked = { ...locked, mastery:{ [`verb:${imetiKey}`]:{ key:`verb:${imetiKey}`, kind:'verb' as const, score:.5, attempts:1, correct:1, activeCorrect:1, lastSeen:now } } }
assert.equal(isExerciseEligible(e08, unlocked), true)

const choice: Exercise = { id:'choice', lesson:1, type:'choice', prompt:'ti + imeti', answer:'imaš', alternatives:['imam','ima','imamo'] }
const options = stableChoiceOptions(choice, 'session-a')
assert.equal(options.filter(option => option.correct).length, 1)
assert.equal(options.find(option => option.correct)?.text, 'imaš')

const examVocab: Vocabulary[] = Array.from({ length:30 }, (_, index) => ({ id:`tv${index}`, sl:`sl${index}`, de:`de${index}`, partOfSpeech:'Substantiv', category:'Test', example:`sl${index}.`, exampleDe:`de${index}.`, lesson:99 }))
const examExercises: Exercise[] = examVocab.map((word, index) => ({ id:`exam-${index}`, lesson:99, type:index % 3 === 0 ? 'choice' : 'translate-de-sl', prompt:`Prüfungsfrage ${index}`, answer:`odgovor ${index}`, alternatives:index % 3 === 0 ? ['x','y'] : undefined, vocabularyIds:[word.id], targetContentKeys:[`vocab:${word.id}`], skillTargets:[index % 3 === 0 ? 'recognition' : 'production'] }))
const examProgress = fresh({ introducedWords:examVocab.map(word => word.id), preferences:{ ...defaultProgress.preferences, onboardingCompleted:true } })
const checkpoint = buildExamPlan({ kind:'checkpoint', lessonId:99, exercises:examExercises, vocabulary:examVocab, progress:examProgress, seed:11, targetSize:EXAM_CONFIG.checkpoint.default })
const final = buildExamPlan({ kind:'final', lessonId:99, exercises:examExercises, vocabulary:examVocab, progress:examProgress, seed:29, targetSize:EXAM_CONFIG.final.default })
assert.equal(checkpoint.length, 6)
assert.equal(final.length, 12)
assert.equal(new Set(final.flatMap(exercise => inferTargetContentKeys(exercise))).size, final.length)

const checkpointSession = createExerciseSession('checkpoint', checkpoint, 'checkpoint-test')
const checkpointResults = checkpointSession.exercises.map(item => resultFor(item.id, item.sourceExerciseId))
assert.deepEqual(validateSessionResults(checkpointSession, checkpointResults), [])
assert.deepEqual(sessionSummary(checkpointSession, checkpointResults), { total:6, correct:6, wrong:0 })
assert.throws(() => sessionSummary(checkpointSession, checkpointResults.slice(0,5)))

const verbSession = createExerciseSession('verb-practice', verbDeck, 'verb-test')
assert.equal(verbSession.exercises.length, 3)
assert.deepEqual(sessionSummary(verbSession, verbSession.exercises.map(item => resultFor(item.id, item.sourceExerciseId))), { total:3, correct:3, wrong:0 })

const fiveLessons = fresh({ completedLessons:[1,2,3,4,5] })
assert.equal(majorTestDue(fiveLessons), true)
const afterMajor = fresh({ completedLessons:[1,2,3,4,5], examHistory:[{ sessionId:'major-5', kind:'major', lessonId:5, exerciseIds:[], firstExerciseIds:[], promptSignatures:[], vocabularyIds:[], grammarRuleIds:[], completedAt:now }] })
assert.equal(majorTestDue(afterMajor), false)

const reset = resetLearningProgress(fresh({ reviews:[{ key:'vocab:v001', status:'gelernt', intervalIndex:2, dueAt:now }], examHistory:afterMajor.examHistory, preferences:{ ...defaultProgress.preferences, dailyGoalMinutes:20 } }))
assert.equal(reset.reviews.length, 0)
assert.equal(reset.examHistory?.length, 0)
assert.equal(reset.preferences.dailyGoalMinutes, 20)

const local = fresh({ mastery:{ 'vocab:v001':{ key:'vocab:v001', kind:'vocabulary', score:.8, attempts:4, correct:4, lastSeen:now } }, updatedAt:now })
const cloud = fresh({ mastery:{ 'vocab:v001':{ key:'vocab:v001', kind:'vocabulary', score:.5, attempts:2, correct:1, lastSeen:now - 1000 } }, updatedAt:now - 1000 })
assert.equal(mergeProgress(local, cloud).mastery['vocab:v001'].score, .8)

console.log('Regression checks passed')
