import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeContentCoverage, createSessionState, scoreExerciseCandidate, selectNextExercise } from '../lib/learningEngine'
import type { Exercise, SessionHistoryItem, UserProgress } from '../types'

const progress: UserProgress = {
  schemaVersion: 3,
  completedLessons: [1,2,3,4,5],
  streak: 1,
  wordsLearned: [], secureWords: [], mistakes: [], reviews: [],
  speakingMinutes: 0, listeningMinutes: 0,
  skillXp: { schreiben: 40, grammatik: 35, lesen: 25, wortschatz: 30, hören: 2, sprechen: 1 },
  learningItems: {}, recentSessionHistory: [],
}

function ex(id: string, overrides: Partial<Exercise> = {}): Exercise {
  return {
    id, lesson: 2, type: 'translate-de-sl', modality: 'text', prompt: id,
    answer: `Antwort ${id}`, level: 'A1', difficulty: 2,
    skills: ['schreiben','grammatik'], grammarTag: 'dual',
    learningTargets: ['grammar:dual'], contentKey: id, contextTag: 'familie',
    ...overrides,
  }
}

function historyItem(overrides: Partial<SessionHistoryItem> = {}): SessionHistoryItem {
  return {
    exerciseId: 'old', learningTargets: ['grammar:dual'], skills: ['schreiben'],
    correct: true, timestamp: Date.now(), exerciseType: 'translate-de-sl', modality: 'text',
    grammarTag: 'dual', contentKey: 'old-content', contextTag: 'familie', ...overrides,
  }
}

test('same sentence/content gets a strong cooldown', () => {
  const repeated = ex('repeat', { contentKey:'same-sentence' })
  const fresh = ex('fresh', { contentKey:'new-sentence', grammarTag:'accusative', learningTargets:['grammar:accusative'], contextTag:'essen' })
  const session = { ...createSessionState(), answered:4, correct:4, history:[historyItem({ contentKey:'same-sentence' })] }
  assert.equal(selectNextExercise(progress, [repeated, fresh], session)?.exercise.id, 'fresh')
  assert.ok(scoreExerciseCandidate(repeated, progress, session).penalties.includes('gleicher Satz/Inhalt war kürzlich bereits dran'))
})

test('same exercise type is penalized and a different interaction gets a bonus', () => {
  const translate = ex('translate')
  const listen = ex('listen', { type:'listen-type', modality:'listening', audioPrompt:'Imam dva brata.', skills:['hören','grammatik'], contentKey:'audio-dual', contextTag:'hören' })
  const session = { ...createSessionState(), answered:3, correct:3, history:[historyItem()] }
  const a = scoreExerciseCandidate(translate, progress, session)
  const b = scoreExerciseCandidate(listen, progress, session)
  assert.ok(b.score > a.score)
  assert.ok(a.penalties.includes('gleicher Aufgabentyp war gerade dran'))
})

test('failed target stays important but another concrete task wins', () => {
  const original = ex('original', { contentKey:'dual-original' })
  const transfer = ex('transfer', { type:'fill', prompt:'Imam ___ brata.', answer:'dva', contentKey:'dual-fill', contextTag:'familie-2' })
  const unrelated = ex('unrelated', { grammarTag:'accusative', learningTargets:['grammar:accusative'], contentKey:'pizza', contextTag:'essen' })
  const session = {
    ...createSessionState(), answered:3, correct:2, recentExerciseIds:['original'],
    history:[historyItem({ exerciseId:'original', correct:false, contentKey:'dual-original', mistakeCategory:'dual' })],
  }
  const selected = selectNextExercise(progress, [original, transfer, unrelated], session)
  assert.equal(selected?.exercise.id, 'transfer')
  assert.ok(selected?.reasons.includes('Transferübung zu einem aktuellen Fehler'))
})

test('listening and speaking are boosted when long-term skills are weak', () => {
  const writing = ex('write', { grammarTag:undefined, learningTargets:['skill:schreiben'], skills:['schreiben'], contextTag:'arbeit' })
  const listening = ex('listen', { type:'listen-answer', modality:'listening', grammarTag:undefined, learningTargets:['skill:hören'], skills:['hören'], contextTag:'cafe' })
  const speaking = ex('speak', { type:'speak-answer', modality:'speaking', grammarTag:undefined, learningTargets:['skill:sprechen'], skills:['sprechen'], contextTag:'reisen' })
  const session = { ...createSessionState(), answered:4, correct:4 }
  assert.ok(scoreExerciseCandidate(listening, progress, session).score > scoreExerciseCandidate(writing, progress, session).score)
  assert.ok(scoreExerciseCandidate(speaking, progress, session).score > scoreExerciseCandidate(writing, progress, session).score)
})

test('secure targets favor productive forms over basic choice', () => {
  const secureProgress: UserProgress = {
    ...progress,
    learningItems: {
      'exercise:choice': { key:'exercise:choice', kind:'exercise', attempts:6, correctCount:6, incorrectCount:0, correctStreak:6, incorrectStreak:0, mastery:0.9, difficulty:1 },
      'exercise:speak': { key:'exercise:speak', kind:'exercise', attempts:6, correctCount:6, incorrectCount:0, correctStreak:6, incorrectStreak:0, mastery:0.9, difficulty:3 },
    },
  }
  const choice = ex('choice', { type:'choice', modality:'choice', difficulty:1, alternatives:['dva','dve'] })
  const speak = ex('speak', { type:'speak-answer', modality:'speaking', difficulty:3, skills:['sprechen','grammatik'] })
  const session = { ...createSessionState(), answered:4, correct:4 }
  assert.ok(scoreExerciseCandidate(speak, secureProgress, session).score > scoreExerciseCandidate(choice, secureProgress, session).score)
})

test('content coverage flags targets with too little variation', () => {
  const sparse = [ex('a'), ex('b')]
  const report = analyzeContentCoverage(sparse).find(item => item.target === 'grammar:dual')
  assert.equal(report?.needsMoreVariation, true)
})

test('urgency can still overcome diversity penalties when learning value is very high', () => {
  const now = Date.now()
  const urgent = ex('urgent', { contentKey:'same' })
  const neutral = ex('neutral', { grammarTag:'accusative', learningTargets:['grammar:accusative'], contentKey:'fresh', contextTag:'essen' })
  const urgentProgress: UserProgress = {
    ...progress,
    mistakes:[{ key:'urgent', count:5, lastSeen:now, category:'dual' }],
    learningItems:{
      'exercise:urgent': { key:'exercise:urgent', kind:'exercise', attempts:5, correctCount:1, incorrectCount:4, correctStreak:0, incorrectStreak:3, mastery:0.12, difficulty:2, nextDueAt:now - 4*86_400_000 },
    },
  }
  const session = { ...createSessionState(), answered:6, correct:3, history:[historyItem({ contentKey:'same' })] }
  assert.ok(scoreExerciseCandidate(urgent, urgentProgress, session, now).score > scoreExerciseCandidate(neutral, urgentProgress, session, now).score)
})
