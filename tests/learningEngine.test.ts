import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createSessionState,
  scoreExerciseCandidate,
  selectNextExercise,
  shouldIntroduceNewContent,
  updateLearnerState,
  type SessionState,
} from '../lib/learningEngine'
import type { Exercise, UserProgress } from '../types'

const baseProgress: UserProgress = {
  schemaVersion: 3,
  completedLessons: [1, 2],
  streak: 1,
  wordsLearned: [],
  secureWords: [],
  mistakes: [],
  reviews: [],
  speakingMinutes: 0,
  listeningMinutes: 0,
  skillXp: { schreiben: 20, grammatik: 20, hören: 2, sprechen: 2, lesen: 10, wortschatz: 10 },
  learningItems: {},
  recentSessionHistory: [],
}

function exercise(id: string, overrides: Partial<Exercise> = {}): Exercise {
  return {
    id,
    lesson: 2,
    type: 'translate-de-sl',
    prompt: id,
    answer: 'Imam dva brata.',
    level: 'A1',
    skills: ['schreiben', 'grammatik'],
    difficulty: 2,
    grammarTag: 'dual',
    ...overrides,
  }
}

test('overdue learning items are strongly preferred', () => {
  const now = Date.now()
  const due = exercise('due')
  const fresh = exercise('fresh', { grammarTag: 'accusative' })
  const progress: UserProgress = {
    ...baseProgress,
    learningItems: {
      'exercise:due': {
        key: 'exercise:due', kind: 'exercise', attempts: 3, correctCount: 2, incorrectCount: 1,
        correctStreak: 1, incorrectStreak: 0, mastery: 0.55, difficulty: 2, nextDueAt: now - 86_400_000,
      },
      'exercise:fresh': {
        key: 'exercise:fresh', kind: 'exercise', attempts: 3, correctCount: 3, incorrectCount: 0,
        correctStreak: 3, incorrectStreak: 0, mastery: 0.85, difficulty: 2, nextDueAt: now + 86_400_000,
      },
    },
  }
  const selected = selectNextExercise(progress, [fresh, due], createSessionState(), now)
  assert.equal(selected?.exercise.id, 'due')
  assert.ok(selected?.reasons.includes('überfällig'))
})

test('repeated mistakes increase priority', () => {
  const weak = exercise('weak')
  const neutral = exercise('neutral', { grammarTag: 'accusative' })
  const progress: UserProgress = {
    ...baseProgress,
    mistakes: [{ key: 'weak', count: 4, lastSeen: Date.now(), category: 'dual' }],
  }
  const session = { ...createSessionState(), answered: 3, correct: 2 }
  const weakScore = scoreExerciseCandidate(weak, progress, session).score
  const neutralScore = scoreExerciseCandidate(neutral, progress, session).score
  assert.ok(weakScore > neutralScore)
})

test('secure non-due content is deprioritized', () => {
  const now = Date.now()
  const safe = exercise('safe')
  const uncertain = exercise('uncertain', { grammarTag: 'location' })
  const progress: UserProgress = {
    ...baseProgress,
    learningItems: {
      'exercise:safe': { key:'exercise:safe', kind:'exercise', attempts:5, correctCount:5, incorrectCount:0, correctStreak:5, incorrectStreak:0, mastery:0.92, difficulty:2, nextDueAt:now + 2 * 86_400_000 },
      'exercise:uncertain': { key:'exercise:uncertain', kind:'exercise', attempts:3, correctCount:1, incorrectCount:2, correctStreak:0, incorrectStreak:1, mastery:0.3, difficulty:2, nextDueAt:now + 2 * 86_400_000 },
    },
  }
  assert.equal(selectNextExercise(progress, [safe, uncertain], createSessionState(), now)?.exercise.id, 'uncertain')
})

test('new content is not introduced at the beginning of a session', () => {
  assert.equal(shouldIntroduceNewContent(baseProgress, createSessionState()), false)
  const later = { ...createSessionState(), answered: 4, correct: 4 }
  assert.equal(shouldIntroduceNewContent(baseProgress, later), true)
})

test('same concrete task is not immediately repeated', () => {
  const first = exercise('same')
  const alternative = exercise('other', { answer:'Imam dve sestri.', grammarTag:'dual' })
  const session = { ...createSessionState(), answered: 3, correct: 2, recentExerciseIds: ['same'], history: [] }
  const selected = selectNextExercise(baseProgress, [first, alternative], session)
  assert.equal(selected?.exercise.id, 'other')
})

test('same failed learning target can return through a different transfer exercise', () => {
  const transfer = exercise('transfer', { prompt:'Vidim dva prijatelja.', answer:'Vidim dva prijatelja.' })
  const session: SessionState = {
    ...createSessionState(),
    answered: 3,
    correct: 2,
    recentExerciseIds: ['original'],
    history: [{
      exerciseId:'original',
      learningTargets:['lesson:2','grammar:dual','skill:schreiben'],
      skills:['schreiben'],
      correct:false,
      timestamp:Date.now(),
      mistakeCategory:'dual',
    }],
  }
  const score = scoreExerciseCandidate(transfer, baseProgress, session)
  assert.ok(score.reasons.includes('Transferübung zu einem aktuellen Fehler'))
})

test('weak skills receive a selection bonus', () => {
  const listening = exercise('listen', { skills:['hören'], grammarTag:undefined })
  const writing = exercise('write', { skills:['schreiben'], grammarTag:undefined })
  const session = { ...createSessionState(), answered: 3, correct: 3 }
  assert.ok(scoreExerciseCandidate(listening, baseProgress, session).score > scoreExerciseCandidate(writing, baseProgress, session).score)
})

test('prerequisites block advanced content until mastery is sufficient', () => {
  const advanced = exercise('advanced', { lesson:3, prerequisites:['grammar:dual'] })
  const blocked = scoreExerciseCandidate(advanced, baseProgress, createSessionState())
  assert.ok(blocked.score < -1000)
  const ready: UserProgress = {
    ...baseProgress,
    learningItems: {
      'grammar:dual': { key:'grammar:dual', kind:'grammar', attempts:6, correctCount:5, incorrectCount:1, correctStreak:3, incorrectStreak:0, mastery:0.8, difficulty:2 },
    },
  }
  assert.ok(scoreExerciseCandidate(advanced, ready, createSessionState()).score > -1000)
})

test('one error lowers mastery but does not permanently classify the item', () => {
  const item = exercise('item')
  const onceWrong = updateLearnerState(baseProgress, item, { correct:false, responseMs:3000, mistakeCategory:'dual' })
  const state = onceWrong.learningItems?.['exercise:item']
  assert.equal(state?.attempts, 1)
  assert.equal(state?.incorrectStreak, 1)
  assert.ok((state?.mastery ?? 0) >= 0)
  const recovered = updateLearnerState(onceWrong, item, { correct:true, responseMs:2500 })
  assert.ok((recovered.learningItems?.['exercise:item']?.mastery ?? 0) > (state?.mastery ?? 0))
})

test('repeated errors build a stronger incorrect streak', () => {
  const item = exercise('repeat')
  const first = updateLearnerState(baseProgress, item, { correct:false, responseMs:3000, mistakeCategory:'dual' })
  const second = updateLearnerState(first, item, { correct:false, responseMs:3200, mistakeCategory:'dual' })
  assert.equal(second.learningItems?.['exercise:repeat']?.incorrectStreak, 2)
})
