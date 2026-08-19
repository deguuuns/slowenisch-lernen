import test from 'node:test'
import assert from 'node:assert/strict'
import { createSessionState } from '../lib/learningEngine'
import { isEligibleForAdaptiveSession } from '../lib/sessionEligibility'
import type { Exercise, LearnerProfile, SessionHistoryItem, UserProgress } from '../types'

const profile: LearnerProfile = {
  id: 'p1', name: 'Test', startMode: 'zero', approximateLevel: 'A1', onboardingCompleted: true, placementCompleted: true, createdAt: 1, updatedAt: 1,
}

const experiencedProfile: LearnerProfile = {
  ...profile,
  id: 'p2',
  startMode: 'self-assessment',
  selfAssessment: 'simple-sentences',
}

function progress(overrides: Partial<UserProgress> = {}): UserProgress {
  return {
    schemaVersion: 4, completedLessons: [], streak: 1, wordsLearned: [], secureWords: [], mistakes: [], reviews: [],
    speakingMinutes: 0, listeningMinutes: 0, introducedVocabulary: ['živjo','da','ne','jaz','sem','doma','domov','kje','kam','grem','danes'],
    introducedGrammar: ['biti-1s','biti-basic','kje-kam','location-direction'], skillXp: {}, learningItems: {
      'grammar:location-direction': { key:'grammar:location-direction', kind:'grammar', stage:'recall', attempts:2, correctCount:2, incorrectCount:0, correctStreak:2, incorrectStreak:0, mastery:0.6, recallMastery:0.4, difficulty:2 },
    }, recentSessionHistory: [], ...overrides,
  }
}

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'x1', lesson: 1, type: 'translate-de-sl', prompt: 'Ich gehe nach Slowenien.', answer: 'Grem v Slovenijo.',
    level: 'A1', skills: ['schreiben','grammatik'], requiredVocabulary: ['grem'], requiredOutputVocabulary:['grem'], requiredGrammar: ['location-direction'],
    learningTargets: ['grammar:location-direction'], contentKey: 'go-slovenia', contextTag: 'reisen', learningPhase:'production', requiredTargetStage:'recall', requirementsComplete:true, ...overrides,
  }
}

function hist(overrides: Partial<SessionHistoryItem> = {}): SessionHistoryItem {
  return {
    exerciseId: 'old', learningTargets: ['grammar:location-direction'], skills: ['schreiben'], correct: true, timestamp: Date.now(),
    exerciseType: 'translate-de-sl', modality: 'text', contentKey: 'old', contextTag: 'reisen', ...overrides,
  }
}

test('correct concrete exercise is blocked for the rest of the session', () => {
  const ex = exercise()
  const session = { ...createSessionState(), history: [hist({ exerciseId: ex.id, contentKey: ex.contentKey, correct: true })] }
  assert.equal(isEligibleForAdaptiveSession(ex, progress(), session, experiencedProfile), false)
})

test('productive exercise is blocked until required grammar was introduced', () => {
  const p = progress({ introducedGrammar: ['biti-1s','biti-basic'] })
  assert.equal(isEligibleForAdaptiveSession(exercise(), p, createSessionState(), experiencedProfile), false)
})

test('productive exercise is blocked until required vocabulary was introduced', () => {
  const p = progress({ introducedVocabulary: ['živjo','da','ne','jaz','sem','doma','kje','kam'] })
  assert.equal(isEligibleForAdaptiveSession(exercise(), p, createSessionState(), experiencedProfile), false)
})

test('secure concrete task is not actively tested again before due date', () => {
  const now = Date.now()
  const p = progress({ learningItems: {
    'grammar:location-direction': { key:'grammar:location-direction', kind:'grammar', stage:'mastered', attempts:5, correctCount:5, incorrectCount:0, correctStreak:5, incorrectStreak:0, mastery:0.94, difficulty:2, nextDueAt:now + 86_400_000 },
  } })
  assert.equal(isEligibleForAdaptiveSession(exercise(), p, createSessionState(), experiencedProfile, now), false)
})

test('mastered vocabulary may still be used naturally in a different new sentence for an established learner', () => {
  const now = Date.now()
  const p = progress({ learningItems: {
    'vocab:danes': { key:'vocab:danes', kind:'vocabulary', stage:'mastered', attempts:5, correctCount:5, incorrectCount:0, correctStreak:5, incorrectStreak:0, mastery:0.95, difficulty:1, nextDueAt:now + 7*86_400_000 },
    'grammar:location-direction': { key:'grammar:location-direction', kind:'grammar', stage:'recall', attempts:2, correctCount:2, incorrectCount:0, correctStreak:2, incorrectStreak:0, mastery:0.6, recallMastery:0.4, difficulty:2 },
  } })
  const newSentence = exercise({ id:'new-sentence', prompt:'Heute gehe ich nach Hause.', answer:'Danes grem domov.', requiredVocabulary:['danes','grem','domov'], requiredOutputVocabulary:['grem','domov'], contentKey:'today-go-home', contextOnlyTargets:['vocab:danes'] })
  assert.equal(isEligibleForAdaptiveSession(newSentence, p, createSessionState(), experiencedProfile, now), true)
})

test('same target can return after an error with different content for an established learner', () => {
  const session = { ...createSessionState(), history: [hist({ exerciseId:'bad-one', correct:false, contentKey:'old-content' })] }
  const transfer = exercise({ id:'transfer', prompt:'Ich gehe nach Hause.', answer:'Grem domov.', requiredVocabulary:['grem','domov'], requiredOutputVocabulary:['grem','domov'], contentKey:'go-home', contextTag:'alltag' })
  assert.equal(isEligibleForAdaptiveSession(transfer, progress(), session, experiencedProfile), true)
})

test('one target cannot dominate indefinitely without a recent error', () => {
  const session = { ...createSessionState(), history: [
    hist({ exerciseId:'a', contentKey:'a' }), hist({ exerciseId:'b', contentKey:'b' }), hist({ exerciseId:'c', contentKey:'c' }),
  ] }
  assert.equal(isEligibleForAdaptiveSession(exercise({ id:'d', contentKey:'d' }), progress(), session, experiencedProfile), false)
})

test('zero beginners do not receive unannotated legacy exercises in adaptive mode', () => {
  const legacy = exercise({ id:'legacy', contentKey:undefined, requirementsComplete:false, requiredTargetStage:undefined, learningPhase:undefined })
  assert.equal(isEligibleForAdaptiveSession(legacy, progress(), createSessionState(), profile), false)
})
