import test from 'node:test'
import assert from 'node:assert/strict'
import { exercises as diverseExercises } from '../data/diverseContent'
import { createSessionState } from '../lib/learningEngine'
import { canActivelyTestLearningItem, isEligibleForAdaptiveSession, requiresCurriculumSafety } from '../lib/sessionEligibility'
import type { Exercise, LearnerProfile, LearningItemState, UserProgress } from '../types'

const selfAssessmentProfile: LearnerProfile = {
  id: 'p-reset',
  name: 'Reset learner',
  startMode: 'self-assessment',
  selfAssessment: 'simple-sentences',
  approximateLevel: 'A1',
  onboardingCompleted: true,
  placementCompleted: true,
  createdAt: 1,
  updatedAt: 1,
}

function emptyProgress(): UserProgress {
  return {
    schemaVersion: 4,
    completedLessons: [],
    streak: 0,
    wordsLearned: [],
    secureWords: [],
    introducedVocabulary: [],
    introducedGrammar: [],
    mistakes: [],
    reviews: [],
    speakingMinutes: 0,
    listeningMinutes: 0,
    skillXp: {},
    learningItems: {},
    recentSessionHistory: [],
  }
}

test('a reset profile is treated as curriculum-safe even when its old start mode was not zero', () => {
  assert.equal(requiresCurriculumSafety(emptyProgress(), selfAssessmentProfile), true)
})

test('legacy production like Hallo Wie geht es dir is blocked after a complete progress reset', () => {
  const legacy = diverseExercises.find(item => item.id === 'e01')
  assert.ok(legacy)
  assert.equal(legacy.prompt, 'Hallo! Wie geht es dir?')
  assert.equal(
    isEligibleForAdaptiveSession(legacy, emptyProgress(), createSessionState(), selfAssessmentProfile, Date.now(), diverseExercises),
    false,
  )
})

test('curriculum-safe introductions must contain a German explanation card', () => {
  const incompleteIntro: Exercise = {
    id: 'bad-intro', lesson: 1, type: 'introduce', prompt: 'Neu: test', answer: 'test',
    level: 'A1', skills: ['wortschatz'], contentKey: 'bad-intro', learningPhase: 'new',
    curriculumPhase: 1, curriculumOrder: 1, introducesVocabulary: ['test'], learningTargets: ['vocab:test'],
    introSl: 'test',
  }
  assert.equal(
    isEligibleForAdaptiveSession(incompleteIntro, emptyProgress(), createSessionState(), selfAssessmentProfile, Date.now(), [incompleteIntro]),
    false,
  )
})

test('a clean learning target is not actively tested before its real due date', () => {
  const now = Date.now()
  const state: LearningItemState = {
    key: 'vocab:hvala', kind: 'vocabulary', stage: 'recognition', introduced: true,
    attempts: 1, correctCount: 1, incorrectCount: 0, correctStreak: 1, incorrectStreak: 0,
    mastery: 0.4, receptiveMastery: 0.4, recallMastery: 0, productiveMastery: 0,
    difficulty: 1, lastHintsUsed: 0, nextDueAt: now + 3 * 86_400_000,
    activeTestCooldownUntil: now + 86_400_000,
  }
  assert.equal(canActivelyTestLearningItem(state, now + 86_400_001), false)
  assert.equal(canActivelyTestLearningItem(state, now + 3 * 86_400_000 + 1), true)
})

test('production without explicit dependencies fails closed for curriculum-safe learners', () => {
  const unsafe: Exercise = {
    id: 'unsafe-production', lesson: 1, type: 'translate-de-sl', prompt: 'Guten Morgen', answer: 'Dobro jutro',
    level: 'A1', skills: ['schreiben'], contentKey: 'unsafe-production', learningPhase: 'production', curriculumPhase: 1,
    learningTargets: ['vocab:dobro jutro'],
  }
  assert.equal(
    isEligibleForAdaptiveSession(unsafe, emptyProgress(), createSessionState(), selfAssessmentProfile, Date.now(), [unsafe]),
    false,
  )
})
