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

test('after Živjo introduction the next new word is introduced before recognition starts', () => {
  const progress = registerIntroductions(emptyProgress(), byId('zivjo'))
  const eligible = eligibleAdaptiveContent(all, progress, createSessionState(), profile)
  assert.deepEqual(eligible.map(item => item.id), ['hvala'])
})

test('recall is blocked until recognition evidence exists', () => {
  let progress = registerIntroductions(emptyProgress(), byId('zivjo'))
  progress = registerIntroductions(progress, byId('hvala'))
  progress = registerIntroductions(progress, byId('prosim'))
  progress = registerIntroductions(progress, byId('ja'))
  progress = registerIntroductions(progress, byId('ne'))
  const recall = byId('p1-hvala-recall')
  const now = Date.now()
  assert.equal(isEligibleForAdaptiveSession(recall, progress, createSessionState(), profile, now, all), false)

  const recognition = byId('p1-hvala-rec-de')
  progress = updateLearnerStateWithHelp(progress, recognition, { correct:true, responseMs:1500, hintsUsed:0 }, now)
  assert.equal(progress.learningItems?.['vocab:hvala']?.stage, 'recognition')
  assert.equal(isEligibleForAdaptiveSession(recall, progress, createSessionState(), profile, now, all), true)
})

test('beginner phase does not advance merely because words were shown', () => {
  let progress = emptyProgress()
  for (const id of ['zivjo','hvala','prosim','ja','ne']) progress = registerIntroductions(progress, byId(id))
  assert.equal(getCurrentBeginnerPhase(progress).id, 1)
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
