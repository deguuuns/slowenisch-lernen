import assert from 'node:assert/strict'
import { explicitSkillTargetKeys, listeningStageKey, speakingModeKey, weakestListeningStage } from '../lib/skill-mastery'
import type { MasteryItem } from '../types'

assert.equal(listeningStageKey('word'),'skill:listening:word')
assert.equal(listeningStageKey('sentence'),'skill:listening:sentence')
assert.equal(listeningStageKey('dialogue'),'skill:listening:dialogue')
assert.equal(listeningStageKey('story'),'skill:listening:story')
assert.equal(speakingModeKey('spoken-response'),'skill:speaking:spoken-response')
assert.equal(speakingModeKey('typed-fallback'),'skill:production:typed-fallback')

assert.deepEqual(
  explicitSkillTargetKeys(['skill:listening','skill:listening:dialogue','grammar:topic:travel','skill:listening']),
  ['skill:listening','skill:listening:dialogue'],
)

const mastery: Record<string, MasteryItem> = {
  'skill:listening:word': { key:'skill:listening:word',kind:'skill',score:.82,attempts:4,correct:4,lastSeen:1 },
  'skill:listening:sentence': { key:'skill:listening:sentence',kind:'skill',score:.61,attempts:3,correct:2,lastSeen:2 },
  'skill:listening:dialogue': { key:'skill:listening:dialogue',kind:'skill',score:.44,attempts:2,correct:1,lastSeen:3 },
  'skill:listening:story': { key:'skill:listening:story',kind:'skill',score:.3,attempts:1,correct:0,lastSeen:4 },
}

assert.equal(weakestListeningStage(mastery)?.stage,'dialogue')
assert.equal(weakestListeningStage(mastery,4)?.stage,'word')
assert.equal(weakestListeningStage({},2),null)

console.log('Skill mastery checks passed')
