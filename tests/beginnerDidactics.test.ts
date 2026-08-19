import test from 'node:test'
import assert from 'node:assert/strict'
import { beginnerExercises } from '../data/beginnerContent'
import { beginnerReinforcementExercises } from '../data/beginnerReinforcement'
import { getCurrentBeginnerPhase } from '../data/beginnerCurriculum'
import { createSessionState } from '../lib/learningEngine'
import { registerIntroductions } from '../lib/prerequisites'
import { eligibleAdaptiveContent, isEligibleForAdaptiveSession } from '../lib/sessionEligibility'
import { updateLearnerStateWithHelp } from '../lib/masteryWithHelp'
import type { LearnerProfile, UserProgress } from '../types'

const profile: LearnerProfile = {
  id:'zero', name:'Test', startMode:'zero', approximateLevel:'A1', onboardingCompleted:true, placementCompleted:true, createdAt:1, updatedAt:1,
}

function emptyProgress(): UserProgress {
  return {
    schemaVersion:4, completedLessons:[], streak:1, wordsLearned:[], secureWords:[], mistakes:[], reviews:[], speakingMinutes:0, listeningMinutes:0,
    introducedVocabulary:[], introducedGrammar:[], skillXp:{}, learningItems:{}, recentSessionHistory:[],
  }
}

const all = [...beginnerExercises, ...beginnerReinforcementExercises]
const byId = (id: string) => {
  const found = all.find(item => item.id === id)
  assert.ok(found, `missing exercise ${id}`)
  return found
}

test('a zero beginner receives the first introduction before any test', () => {
  const eligible = eligibleAdaptiveContent(all, emptyProgress(), createSessionState(), profile)
  assert.deepEqual(eligible.map(item => item.id), ['zivjo'])
})

test('after Živjo was introduced, active recognition becomes available instead of forcing another intro-only chain', () => {
  const progress = registerIntroductions(emptyProgress(), byId('zivjo'))
  const eligible = eligibleAdaptiveContent(all, progress, createSessionState(), profile)
  assert.ok(eligible.some(item => item.id === 'p1-zivjo-rec-de'))
  assert.ok(eligible.some(item => item.id === 'p1-zivjo-listen'))
  assert.ok(eligible.some(item => item.id === 'hvala'))
})

test('recall is stage-locked before recognition and then deferred until the real review due date', () => {
  let progress = registerIntroductions(emptyProgress(), byId('zivjo'))
  progress = registerIntroductions(progress, byId('hvala'))
  progress = registerIntroductions(progress, byId('prosim'))
  progress = registerIntroductions(progress, byId('ja'))
  progress = registerIntroductions(progress, byId('ne'))
  const recall = byId('p1-hvala-recall')
  const now = new Date(2026, 7, 19, 12, 0, 0).getTime()
  assert.equal(isEligibleForAdaptiveSession(recall, progress, createSessionState(), profile, now, all), false)

  const recognition = byId('p1-hvala-rec-de')
  progress = updateLearnerStateWithHelp(progress, recognition, { correct:true, responseMs:1500, hintsUsed:0 }, now)
  const state = progress.learningItems?.['vocab:hvala']
  assert.equal(state?.stage, 'recognition')
  assert.equal(isEligibleForAdaptiveSession(recall, progress, createSessionState(), profile, now + 60 * 60_000, all), false)
  assert.ok(state?.activeTestCooldownUntil)
  assert.ok(state?.nextDueAt)
  assert.equal(isEligibleForAdaptiveSession(recall, progress, createSessionState(), profile, state!.activeTestCooldownUntil! + 1, all), false)
  assert.equal(isEligibleForAdaptiveSession(recall, progress, createSessionState(), profile, state!.nextDueAt! + 1, all), true)
})

test('beginner phase does not advance merely because words were shown', () => {
  let progress = emptyProgress()
  for (const id of ['zivjo','hvala','prosim','ja','ne']) progress = registerIntroductions(progress, byId(id))
  assert.equal(getCurrentBeginnerPhase(progress)?.id, 1)
})

test('grammar from later phases cannot jump ahead of the vocabulary curriculum', () => {
  const grammar = byId('p10-kje-kam-intro')
  assert.equal(isEligibleForAdaptiveSession(grammar, emptyProgress(), createSessionState(), profile, Date.now(), all), false)
})

test('listening tasks keep the transcript out of the visible prompt', () => {
  const listening = byId('p1-zivjo-listen')
  assert.ok(listening.audioPrompt)
  assert.equal(listening.prompt.toLocaleLowerCase('sl-SI').includes((listening.audioPrompt ?? '').toLocaleLowerCase('sl-SI')), false)
})
