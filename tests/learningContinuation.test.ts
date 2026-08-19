import test from 'node:test'
import assert from 'node:assert/strict'
import { beginnerCurriculum, getCurrentBeginnerPhase, isBeginnerFoundationComplete } from '../data/beginnerCurriculum'
import { resolveLearningContinuation } from '../lib/learningContinuation'
import { createSessionState } from '../lib/learningEngine'
import { eligibleAdaptiveContent } from '../lib/sessionEligibility'
import { beginnerExercises } from '../data/beginnerContent'
import { beginnerReinforcementExercises } from '../data/beginnerReinforcement'
import type { LearnerProfile, LearningItemState, UserProgress } from '../types'

const profile: LearnerProfile = { id:'p', name:'Test', startMode:'zero', approximateLevel:'A1', onboardingCompleted:true, placementCompleted:true, createdAt:1, updatedAt:1 }

function baseProgress(): UserProgress {
  return { schemaVersion:4, completedLessons:[], streak:1, wordsLearned:[], secureWords:[], mistakes:[], reviews:[], speakingMinutes:0, listeningMinutes:0, introducedVocabulary:[], introducedGrammar:[], skillXp:{}, learningItems:{}, recentSessionHistory:[] }
}

function recognised(key: string): LearningItemState {
  return { key:`vocab:${key}`, kind:'vocabulary', introduced:true, stage:'recognition', attempts:1, correctCount:1, incorrectCount:0, correctStreak:1, incorrectStreak:0, mastery:0.3, receptiveMastery:0.22, recallMastery:0, productiveMastery:0, difficulty:1 }
}

function completeThroughPhase(maxPhase: number) {
  const progress = baseProgress()
  const items: Record<string, LearningItemState> = {}
  const vocab: string[] = []
  for (const phase of beginnerCurriculum) {
    if (phase.id > maxPhase) break
    for (const item of phase.newItems) {
      items[`vocab:${item}`] = recognised(item)
      vocab.push(item)
    }
  }
  if (maxPhase >= 10) {
    items['grammar:location-direction'] = { key:'grammar:location-direction', kind:'grammar', introduced:true, stage:'recognition', attempts:1, correctCount:1, incorrectCount:0, correctStreak:1, incorrectStreak:0, mastery:0.3, receptiveMastery:0.22, difficulty:2 }
  }
  return { ...progress, introducedVocabulary:vocab, introducedGrammar:maxPhase >= 10 ? ['location-direction'] : [], learningItems:items }
}

test('phase 1 completion advances to phase 2', () => {
  assert.equal(getCurrentBeginnerPhase(completeThroughPhase(1)).id, 2)
})

test('phase 2 completion resolves continuation to phase 3', () => {
  const progress = completeThroughPhase(2)
  const next = resolveLearningContinuation(progress, 2)
  assert.equal(next.type, 'advance-curriculum')
  if (next.type !== 'advance-curriculum') return
  assert.equal(next.toPhase, 3)
  assert.match(next.title, /Mini-Dialog/)
})

test('introduction alone is not enough to complete a phase', () => {
  const progress = baseProgress()
  progress.introducedVocabulary = [...beginnerCurriculum[0].newItems]
  progress.learningItems = Object.fromEntries(beginnerCurriculum[0].newItems.map(item => [`vocab:${item}`, { ...recognised(item), attempts:0, correctCount:0, mastery:0.08, receptiveMastery:0, stage:'introduced' as const }]))
  assert.equal(getCurrentBeginnerPhase(progress).id, 1)
})

test('complete beginner foundation advances to explicit A1 stage instead of phase 10 loop', () => {
  const progress = completeThroughPhase(10)
  assert.equal(isBeginnerFoundationComplete(progress), true)
  assert.equal(getCurrentBeginnerPhase(progress).id, 11)
  assert.equal(resolveLearningContinuation(progress, 10).type, 'next-course-stage')
})

test('correct content from the previous session is cooled down on Weiterlernen', () => {
  const progress = completeThroughPhase(1)
  progress.recentSessionHistory = [{ exerciseId:'old', learningTargets:['vocab:dobro jutro'], skills:['wortschatz'], correct:true, timestamp:Date.now(), exerciseType:'choice', modality:'choice', contentKey:'dobro-jutro-listen', curriculumPhase:2, learningPhase:'recognition' }]
  progress.introducedVocabulary = [...(progress.introducedVocabulary ?? []), 'dobro jutro']
  progress.learningItems!['vocab:dobro jutro'] = { ...recognised('dobro jutro'), receptiveMastery:0.1, mastery:0.12, stage:'introduced' }
  const all = [...beginnerExercises, ...beginnerReinforcementExercises]
  const eligible = eligibleAdaptiveContent(all, progress, createSessionState(), profile)
  assert.equal(eligible.some(item => item.contentKey === 'dobro-jutro-listen'), false)
})
