import test from 'node:test'
import assert from 'node:assert/strict'
import { beginnerExercises } from '../data/beginnerContent'
import { beginnerReinforcementExercises } from '../data/beginnerReinforcement'
import { beginnerCurriculum, isCurriculumPhaseAdvancementReady } from '../data/beginnerCurriculum'
import { createSessionState, registerSessionOutcome, scoreExerciseCandidate } from '../lib/learningEngine'
import { registerIntroductions } from '../lib/prerequisites'
import { eligibleAdaptiveContent } from '../lib/sessionEligibility'
import { sessionQualityMetrics } from '../lib/sessionQuality'
import type { Exercise, LearnerProfile, SessionHistoryItem, UserProgress } from '../types'

const profile: LearnerProfile = {
  id:'quality-beginner', name:'Beginner', startMode:'zero', approximateLevel:'A1', onboardingCompleted:true, placementCompleted:true, createdAt:1, updatedAt:1,
}

function emptyProgress(): UserProgress {
  return {
    schemaVersion:4, resetGeneration:1, progressResetAt:1,
    completedLessons:[], streak:1, wordsLearned:[], secureWords:[], mistakes:[], reviews:[], speakingMinutes:0, listeningMinutes:0,
    introducedVocabulary:[], introducedGrammar:[], skillXp:{}, learningItems:{}, recentSessionHistory:[],
  }
}

test('an introduction is followed by active practice instead of another passive card when practice exists', () => {
  const all = [...beginnerExercises, ...beginnerReinforcementExercises]
  const firstIntro = beginnerExercises.find(item => item.id === 'zivjo')!
  let progress = emptyProgress()
  let session = createSessionState()
  const scored = scoreExerciseCandidate(firstIntro, progress, session)

  progress = registerIntroductions(progress, firstIntro)
  session = registerSessionOutcome(session, scored, { correct:true, responseMs:700 })

  const pool = eligibleAdaptiveContent(all, progress, session, profile, Date.now())
  assert.ok(pool.some(item => item.id === 'p1-zivjo-rec-de'), 'active recognition for the introduced word should be available')
  assert.ok(!pool.some(item => item.type === 'introduce'), 'the next passive introduction should wait until active processing happened')
  assert.equal(session.answered, 0, 'passive teaching must not consume the solved-exercise budget')
  assert.equal(session.correct, 0, 'passive teaching must not inflate accuracy')
  assert.equal(session.introducedNew, 1)
})

test('advancement ready is weaker than mastery but still requires all phase items to be introduced', () => {
  const phase = beginnerCurriculum.find(item => item.id === 2)!
  const progress = emptyProgress()
  progress.introducedVocabulary = ['dobro jutro','dober dan','dober večer','lahko noč','nasvidenje']
  progress.learningItems = {
    'vocab:dobro jutro': { key:'vocab:dobro jutro', kind:'vocabulary', introduced:true, stage:'recognition', attempts:1, correctCount:1, incorrectCount:0, correctStreak:1, incorrectStreak:0, mastery:0.32, difficulty:1, receptiveMastery:0.22 },
    'vocab:dober dan': { key:'vocab:dober dan', kind:'vocabulary', introduced:true, stage:'recognition', attempts:1, correctCount:1, incorrectCount:0, correctStreak:1, incorrectStreak:0, mastery:0.32, difficulty:1, receptiveMastery:0.22 },
    'vocab:dober večer': { key:'vocab:dober večer', kind:'vocabulary', introduced:true, stage:'recognition', attempts:1, correctCount:1, incorrectCount:0, correctStreak:1, incorrectStreak:0, mastery:0.32, difficulty:1, receptiveMastery:0.22 },
    'vocab:lahko noč': { key:'vocab:lahko noč', kind:'vocabulary', introduced:true, stage:'recognition', attempts:1, correctCount:1, incorrectCount:0, correctStreak:1, incorrectStreak:0, mastery:0.32, difficulty:1, receptiveMastery:0.22 },
    'vocab:nasvidenje': { key:'vocab:nasvidenje', kind:'vocabulary', introduced:true, stage:'introduced', attempts:0, correctCount:0, incorrectCount:0, correctStreak:0, incorrectStreak:0, mastery:0, difficulty:1, receptiveMastery:0 },
  }

  assert.equal(isCurriculumPhaseAdvancementReady(progress, phase), true, 'four clean recognition signals out of five are enough to move forward')
  assert.ok(Object.values(progress.learningItems).every(item => item.mastery < 0.82), 'nothing needs to be mastered to advance')

  const missingIntroduction = { ...progress, introducedVocabulary: progress.introducedVocabulary.filter(item => item !== 'nasvidenje') }
  missingIntroduction.learningItems = { ...progress.learningItems }
  delete missingIntroduction.learningItems['vocab:nasvidenje']
  assert.equal(isCurriculumPhaseAdvancementReady(missingIntroduction, phase), false, 'every new item still needs a real introduction')
})

test('session quality metrics distinguish passive teaching from active exercises', () => {
  const history: SessionHistoryItem[] = [
    { exerciseId:'intro-1', learningTargets:['vocab:a'], skills:['wortschatz'], correct:true, timestamp:1, exerciseType:'introduce', learningPhase:'new', curriculumPhase:2 },
    { exerciseId:'active-1', learningTargets:['vocab:a'], skills:['lesen'], correct:true, timestamp:2, exerciseType:'choice', modality:'choice', learningPhase:'recognition', curriculumPhase:2 },
    { exerciseId:'active-2', learningTargets:['vocab:a'], skills:['hören'], correct:true, timestamp:3, exerciseType:'listen-choice', modality:'listening', learningPhase:'recognition', curriculumPhase:2 },
  ]
  const metrics = sessionQualityMetrics(history)
  assert.equal(metrics.passiveSteps, 1)
  assert.equal(metrics.activeSteps, 2)
  assert.equal(metrics.maxIntroductionStreak, 1)
  assert.equal(metrics.modalityDiversity, 2)
  assert.ok(metrics.passiveStepRatio < 0.5)
})

test('repeating the same narrow theme receives a much stronger penalty than changing context', () => {
  const progress = emptyProgress()
  const session = createSessionState()
  session.history = [
    { exerciseId:'g1', learningTargets:['vocab:a'], skills:['lesen'], correct:true, timestamp:1, exerciseType:'choice', modality:'choice', curriculumPhase:2 },
    { exerciseId:'g2', learningTargets:['vocab:b'], skills:['hören'], correct:true, timestamp:2, exerciseType:'listen-choice', modality:'listening', curriculumPhase:2 },
  ]
  const sameTheme: Exercise = { id:'same-theme', lesson:1, type:'choice', prompt:'x', answer:'x', alternatives:['x'], skills:['lesen'], difficulty:1, curriculumPhase:2, contentKey:'same-theme' }
  const freshContext: Exercise = { id:'fresh-context', lesson:1, type:'choice', prompt:'y', answer:'y', alternatives:['y'], skills:['lesen'], difficulty:1, curriculumPhase:3, contentKey:'fresh-context' }
  const sameScore = scoreExerciseCandidate(sameTheme, progress, session).score
  const freshScore = scoreExerciseCandidate(freshContext, progress, session).score
  assert.ok(freshScore > sameScore + 20, `expected fresh context to win clearly (${freshScore} vs ${sameScore})`)
})

test('phase 2 contains active situation and listening practice, not only introduction cards', () => {
  const phaseTwo = [...beginnerExercises, ...beginnerReinforcementExercises].filter(item => item.curriculumPhase === 2)
  assert.ok(phaseTwo.some(item => item.id === 'p2-morning-situation'))
  assert.ok(phaseTwo.some(item => item.id === 'p2-night-situation'))
  assert.ok(phaseTwo.filter(item => item.type === 'listen-choice').length >= 2)
  assert.ok(phaseTwo.filter(item => item.type !== 'introduce').length > phaseTwo.filter(item => item.type === 'introduce').length)
})
