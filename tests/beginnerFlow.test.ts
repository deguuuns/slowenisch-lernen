import test from 'node:test'
import assert from 'node:assert/strict'
import { guidedHint } from '../lib/guidedFeedback'
import { isExerciseUnlocked, registerIntroductions } from '../lib/prerequisites'
import type { Exercise, LearnerProfile, UserProgress } from '../types'

const profile: LearnerProfile = {
  id: 'p1', name: 'Neu', startMode: 'zero', approximateLevel: 'A1', onboardingCompleted: true,
  createdAt: 1, updatedAt: 1,
}

const empty: UserProgress = {
  completedLessons: [], streak: 1, wordsLearned: [], secureWords: [], introducedVocabulary: [], introducedGrammar: [],
  mistakes: [], reviews: [], speakingMinutes: 0, listeningMinutes: 0, skillXp: {}, learningItems: {}, recentSessionHistory: [],
}

const advancedExercise: Exercise = {
  id: 'dual', lesson: 2, type: 'fill', prompt: 'Imam ___ brata.', answer: 'dva',
  requiredVocabulary: ['brat','dva'], requiredGrammar: ['dual'], contextTag: 'familie',
}

test('absolute beginner cannot receive exercises with unknown prerequisites', () => {
  assert.equal(isExerciseUnlocked(advancedExercise, empty, profile), false)
})

test('starter introduction is allowed before broad content', () => {
  const intro: Exercise = { id:'intro', lesson:1, type:'introduce', prompt:'Živjo', answer:'Živjo', contextTag:'beginner-foundation', introducesVocabulary:['živjo'] }
  assert.equal(isExerciseUnlocked(intro, empty, profile), true)
  const next = registerIntroductions(empty, intro)
  assert.deepEqual(next.introducedVocabulary, ['živjo'])
})

test('required vocabulary and grammar unlock after introduction', () => {
  const ready = { ...empty, introducedVocabulary:['brat','dva','živjo','da','ne','jaz','sem','doma','sestra','dve','imam','prijatelj'], introducedGrammar:['dual'] }
  assert.equal(isExerciseUnlocked(advancedExercise, ready, profile), true)
})

test('first hint identifies the problem without giving the full expected sentence', () => {
  const hint = guidedHint('dual', 'Imam dve brata.', 'Imam dva brata.', 1)
  assert.match(hint, /dve|männlich|Genus/i)
  assert.equal(hint.includes('Imam dva brata.'), false)
})

test('second hint can be stronger without printing the full solution sentence', () => {
  const hint = guidedHint('location-direction', 'Sem v Slovenijo.', 'Sem v Sloveniji.', 2)
  assert.match(hint, /Ort|Richtung|Form/i)
  assert.equal(hint.includes('Sem v Sloveniji.'), false)
})
