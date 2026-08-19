import test from 'node:test'
import assert from 'node:assert/strict'
import { updateLearnerStateWithHelp } from '../lib/masteryWithHelp'
import { canActivelyTestLearningItem, isEligibleForAdaptiveSession } from '../lib/sessionEligibility'
import { createSessionState, scoreExerciseCandidate, selectNextExercise } from '../lib/learningEngine'
import { visualVocabularyExercises } from '../data/visualVocabulary'
import type { Exercise, LearnerProfile, UserProgress } from '../types'

const profile: LearnerProfile = { id:'p', name:'Test', startMode:'self-assessment', approximateLevel:'A1', onboardingCompleted:true, placementCompleted:true, createdAt:1, updatedAt:1 }

function progress(): UserProgress {
  return { completedLessons:[1], streak:1, wordsLearned:[], secureWords:[], mistakes:[], reviews:[], speakingMinutes:0, listeningMinutes:0, introducedVocabulary:['hvala'], introducedGrammar:[], skillXp:{}, learningItems:{}, recentSessionHistory:[] }
}

const hvala: Exercise = {
  id:'hvala-recognition', lesson:1, type:'choice', prompt:'Was bedeutet hvala?', answer:'Danke', alternatives:['Bitte'],
  level:'A1', modality:'choice', learningPhase:'recognition', learningTargets:['vocab:hvala'], contentKey:'hvala-meaning', contextTag:'politeness', sentencePatternKey:'word-meaning', skills:['wortschatz']
}

test('clean success creates an active-test cooldown until a later day', () => {
  const now = new Date(2026, 7, 19, 12, 0, 0).getTime()
  const next = updateLearnerStateWithHelp(progress(), hvala, { correct:true, responseMs:900, hintsUsed:0 }, now)
  const state = next.learningItems?.['vocab:hvala']
  assert.ok(state?.activeTestCooldownUntil && state.activeTestCooldownUntil > now)
  assert.equal(canActivelyTestLearningItem(state, now + 60 * 60_000), false)
  assert.equal(canActivelyTestLearningItem(state, state!.activeTestCooldownUntil! + 1), true)
})

test('cleanly learned target is not actively tested again the same day', () => {
  const now = new Date(2026, 7, 19, 12, 0, 0).getTime()
  const next = updateLearnerStateWithHelp(progress(), hvala, { correct:true, responseMs:900, hintsUsed:0 }, now)
  assert.equal(isEligibleForAdaptiveSession(hvala, next, createSessionState(), profile, now + 60 * 60_000, [hvala]), false)
})

test('context-only use remains eligible while the learned word itself is cooled down', () => {
  const now = new Date(2026, 7, 19, 12, 0, 0).getTime()
  const next = updateLearnerStateWithHelp(progress(), hvala, { correct:true, responseMs:900, hintsUsed:0 }, now)
  const contextExercise: Exercise = {
    id:'prosim-dialog', lesson:1, type:'choice', prompt:'A: Hvala! B: ___', answer:'Prosim', alternatives:['Živjo'],
    level:'A1', modality:'choice', learningPhase:'application', learningTargets:['vocab:hvala'], contextOnlyTargets:['vocab:hvala'],
    contentKey:'dialog-hvala-prosim', contextTag:'dialog', sentencePatternKey:'dialog-response', skills:['lesen']
  }
  assert.equal(isEligibleForAdaptiveSession(contextExercise, next, createSessionState(), profile, now + 60 * 60_000, [contextExercise]), true)
})

test('a failed or helped item may return before the one-day cooldown', () => {
  const now = Date.now()
  const failed = updateLearnerStateWithHelp(progress(), hvala, { correct:false, responseMs:1200, hintsUsed:0 }, now)
  assert.equal(canActivelyTestLearningItem(failed.learningItems?.['vocab:hvala'], now + 11 * 60_000), true)
  const helped = updateLearnerStateWithHelp(progress(), hvala, { correct:true, responseMs:1200, hintsUsed:1 }, now)
  assert.equal(canActivelyTestLearningItem(helped.learningItems?.['vocab:hvala'], now + 11 * 60_000), true)
})

test('repeated sentence pattern is strongly penalized compared with a fresh pattern', () => {
  const p = progress()
  const session = createSessionState()
  session.history = [
    { exerciseId:'a', learningTargets:['vocab:x'], skills:['lesen'], correct:true, timestamp:1, exerciseType:'choice', modality:'choice', contentKey:'a', sentencePatternKey:'same' },
    { exerciseId:'b', learningTargets:['vocab:y'], skills:['lesen'], correct:true, timestamp:2, exerciseType:'fill', modality:'text', contentKey:'b', sentencePatternKey:'same' },
  ]
  const repeated: Exercise = { id:'c', lesson:1, type:'choice', prompt:'C', answer:'c', level:'A1', sentencePatternKey:'same', contentKey:'c', skills:['lesen'] }
  const fresh: Exercise = { id:'d', lesson:1, type:'choice', prompt:'D', answer:'d', level:'A1', sentencePatternKey:'fresh', contentKey:'d', skills:['lesen'] }
  assert.ok(scoreExerciseCandidate(fresh, p, session).score > scoreExerciseCandidate(repeated, p, session).score)
})

test('top-k selection is stable for the same rendered session step', () => {
  const p = progress()
  const session = createSessionState()
  session.startedAt = 123456789
  session.answered = 3
  const items: Exercise[] = ['a','b','c'].map((id, index) => ({ id, lesson:1, type:'choice', prompt:id, answer:id, alternatives:['x'], level:'A1', difficulty:2, contentKey:id, sentencePatternKey:`p${index}`, skills:['lesen'] }))
  const first = selectNextExercise(p, items, session)?.exercise.id
  const second = selectNextExercise(p, items, session)?.exercise.id
  assert.equal(first, second)
})

test('visual pilot contains ten concrete words with visual and listening variants', () => {
  const intros = visualVocabularyExercises.filter(item => item.type === 'introduce')
  const visualChoices = visualVocabularyExercises.filter(item => item.visualType === 'image-choice')
  const audioChoices = visualVocabularyExercises.filter(item => item.visualType === 'audio-image-choice')
  assert.equal(intros.length, 10)
  assert.equal(visualChoices.length, 10)
  assert.equal(audioChoices.length, 10)
  assert.ok(intros.some(item => item.answer === 'hiša' && item.introSl?.includes('🏠')))
  assert.ok(audioChoices.every(item => item.prompt === 'Höre zu und wähle das passende Bild.'))
  assert.ok(audioChoices.every(item => !item.prompt.includes(item.audioPrompt ?? '___')))
})
