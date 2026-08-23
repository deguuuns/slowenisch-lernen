import assert from 'node:assert/strict'
import { explicitSkillTargetKeys, listeningStageKey, speakingModeKey, weakestListeningStage } from '../lib/skill-mastery'
import { updateMastery, updateSkillMastery } from '../lib/storage'
import type { Exercise, MasteryItem } from '../types'

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

const listeningExercise: Exercise = {
  id:'phase13-listen-dialogue',lesson:1,type:'choice',prompt:'Kaj želi gost?',answer:'Vodo',
  skillTargets:['listening'],targetContentKeys:['skill:listening','skill:listening:dialogue'],
}
const listeningUpdated=updateMastery({},listeningExercise,true,5000,0)
assert.equal(listeningUpdated['skill:listening'].attempts,1)
assert.equal(listeningUpdated['skill:listening:dialogue'].attempts,1)

const spoken=updateSkillMastery({},'speaking:spoken-response',true,6000,0)
assert.ok(spoken['skill:speaking:spoken-response'])
assert.equal(spoken['skill:production:typed-fallback'],undefined)

const typed=updateSkillMastery({},'production:typed-fallback',true,6000,0)
assert.ok(typed['skill:production:typed-fallback'])
assert.equal(typed['skill:speaking:spoken-response'],undefined)

console.log('Skill mastery checks passed')