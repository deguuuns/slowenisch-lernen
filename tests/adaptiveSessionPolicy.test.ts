import test from 'node:test'
import assert from 'node:assert/strict'
import { createSessionState, type SessionState } from '../lib/learningEngine'
import { eligibleAdaptiveContent, isEligibleForAdaptiveSession } from '../lib/sessionEligibility'
import type { Exercise, LearnerProfile, SessionHistoryItem, UserProgress } from '../types'

const profile: LearnerProfile = {
  id:'p', name:'Beginner', startMode:'zero', approximateLevel:'A1', onboardingCompleted:true,
  placementCompleted:true, createdAt:1, updatedAt:1,
}

function progress(): UserProgress {
  return {
    schemaVersion:4, completedLessons:[], streak:1, wordsLearned:[], secureWords:[], mistakes:[], reviews:[],
    speakingMinutes:0, listeningMinutes:0, introducedVocabulary:['živjo','hvala','prosim','ja','ne'],
    introducedGrammar:[], skillXp:{}, learningItems:{
      'vocab:živjo': { key:'vocab:živjo', kind:'vocabulary', stage:'introduced', introduced:true, attempts:0, correctCount:0, incorrectCount:0, correctStreak:0, incorrectStreak:0, mastery:0.08, receptiveMastery:0.08, recallMastery:0, productiveMastery:0, difficulty:1 },
    }, recentSessionHistory:[],
  }
}

function history(target: string, id: string, correct = true): SessionHistoryItem {
  return {
    exerciseId:id, learningTargets:[target], skills:['wortschatz'], correct, timestamp:Date.now(),
    exerciseType:'introduce', modality:'text', contentKey:id, learningPhase:'new', curriculumPhase:1,
  }
}

function intro(id: string, word: string, order: number): Exercise {
  return {
    id, lesson:1, type:'introduce', prompt:`Neu: ${word}`, answer:word, level:'A1', skills:['wortschatz'],
    contentKey:`intro-${word}`, learningPhase:'new', curriculumPhase:1, curriculumOrder:order,
    introducesVocabulary:[word], learningTargets:[`vocab:${word}`], maxNewItemsInSession:5,
  }
}

test('new-item budget pauses introductions without dead-ending recognition practice', () => {
  const session: SessionState = {
    ...createSessionState(), answered:5, correct:5, introducedNew:5,
    history:[
      history('vocab:živjo','i1'), history('vocab:hvala','i2'), history('vocab:prosim','i3'),
      history('vocab:ja','i4'), history('vocab:ne','i5'),
    ],
  }
  const recognition: Exercise = {
    id:'r-zivjo', lesson:1, type:'choice', prompt:'Was bedeutet živjo?', answer:'Hallo', alternatives:['Hallo','Danke','Bitte'],
    level:'A1', skills:['wortschatz'], contentKey:'recognise-zivjo', learningPhase:'recognition', curriculumPhase:1,
    requiredVocabulary:['živjo'], learningTargets:['vocab:živjo'],
  }
  const content = [intro('i1','živjo',1), intro('i2','hvala',2), intro('i3','prosim',3), intro('i4','ja',4), intro('i5','ne',5), intro('i6','dober dan',6), recognition]
  const eligible = eligibleAdaptiveContent(content, progress(), session, profile)
  assert.equal(eligible.some(item => item.id === 'r-zivjo'), true)
  assert.equal(eligible.some(item => item.id === 'i6'), false)
})

test('two clean successes are enough to pause the same learning target for this session', () => {
  const first: SessionHistoryItem = { ...history('vocab:živjo','r1'), exerciseType:'choice', learningPhase:'recognition', contentKey:'meaning-zivjo' }
  const second: SessionHistoryItem = { ...history('vocab:živjo','r2'), exerciseType:'listen-choice', modality:'listening', learningPhase:'recognition', contentKey:'audio-zivjo' }
  const session: SessionState = { ...createSessionState(), answered:2, correct:2, history:[first, second] }
  const next: Exercise = {
    id:'r3', lesson:1, type:'choice', prompt:'Was heißt Hallo?', answer:'živjo', alternatives:['živjo','hvala','prosim'],
    level:'A1', skills:['wortschatz'], contentKey:'reverse-zivjo', learningPhase:'recognition', curriculumPhase:1,
    requiredVocabulary:['živjo'], learningTargets:['vocab:živjo'],
  }
  assert.equal(isEligibleForAdaptiveSession(next, progress(), session, profile, Date.now(), [next]), false)
})

test('a failed target is allowed extra varied learning opportunities', () => {
  const first: SessionHistoryItem = { ...history('vocab:živjo','r1',false), exerciseType:'choice', learningPhase:'recognition', contentKey:'meaning-zivjo' }
  const second: SessionHistoryItem = { ...history('vocab:živjo','r2',true), exerciseType:'listen-choice', modality:'listening', learningPhase:'recognition', contentKey:'audio-zivjo' }
  const session: SessionState = { ...createSessionState(), answered:2, correct:1, history:[first, second] }
  const next: Exercise = {
    id:'r3', lesson:1, type:'choice', prompt:'Was heißt Hallo?', answer:'živjo', alternatives:['živjo','hvala','prosim'],
    level:'A1', skills:['wortschatz'], contentKey:'reverse-zivjo', learningPhase:'recognition', curriculumPhase:1,
    requiredVocabulary:['živjo'], learningTargets:['vocab:živjo'],
  }
  assert.equal(isEligibleForAdaptiveSession(next, progress(), session, profile, Date.now(), [next]), true)
})
