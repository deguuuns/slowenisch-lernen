import assert from 'node:assert/strict'
import { buildCefrProgressProfile, cefrReadinessLabel } from '../lib/progress-profile'
import { UserProgress } from '../types'

function progress(overrides:Partial<UserProgress>={}):UserProgress {
  return {
    completedLessons:[],streak:0,introducedWords:[],introducedGrammarRules:[],introducedVerbForms:[],wordsLearned:[],secureWords:[],mistakes:[],reviews:[],speakingMinutes:0,listeningMinutes:0,mastery:{},recentAttempts:[],transferQueue:[],preferences:{onboardingCompleted:true,nativeLanguage:'de',targetLevel:'A1',dailyGoalMinutes:10,pace:'normal',audioSpeed:'normal'},updatedAt:0,preferencesUpdatedAt:0,...overrides,
  }
}

const empty=buildCefrProgressProfile(progress(),180,8)
assert.equal(empty.level,'A1')
assert.equal(empty.readiness,0)
assert.equal(empty.evidenceSufficient,false)
assert.equal(cefrReadinessLabel(empty),'A1-Profil wird aufgebaut')
assert.equal(empty.dimensions.length,5)

const developed=buildCefrProgressProfile(progress({
  completedLessons:[1,2,3,4,5,6],
  wordsLearned:Array.from({length:135},(_,i)=>`v${i+1}`),
  secureWords:Array.from({length:90},(_,i)=>`v${i+1}`),
  speakingMinutes:18,
  listeningMinutes:24,
  mastery:{
    'vocab:v001':{key:'vocab:v001',kind:'vocabulary',score:.82,attempts:8,correct:7,lastSeen:1},
    'grammar:accusative':{key:'grammar:accusative',kind:'grammar',score:.72,attempts:7,correct:5,lastSeen:1},
    'skill:listening:sentence':{key:'skill:listening:sentence',kind:'skill',score:.76,attempts:8,correct:6,lastSeen:1},
    'skill:speaking:spoken-response':{key:'skill:speaking:spoken-response',kind:'skill',score:.68,attempts:7,correct:5,lastSeen:1},
    'skill:production:typed-fallback':{key:'skill:production:typed-fallback',kind:'skill',score:.74,attempts:7,correct:5,lastSeen:1},
  },
}),180,8)
assert.equal(developed.evidenceSufficient,true)
assert.ok(developed.readiness>=60)
assert.ok(developed.dimensions.every(item=>item.score>=0&&item.score<=100))
assert.ok(developed.focus)
assert.ok(developed.strongest)

const typedOnly=buildCefrProgressProfile(progress({
  completedLessons:[1,2],
  mastery:{'skill:production:typed-fallback':{key:'skill:production:typed-fallback',kind:'skill',score:.95,attempts:30,correct:29,lastSeen:1}},
}),180,8)
const speaking=typedOnly.dimensions.find(item=>item.id==='speaking')!
const production=typedOnly.dimensions.find(item=>item.id==='production')!
assert.equal(speaking.evidence,0,'typed production must not count as speaking evidence')
assert.ok(production.score>speaking.score,'typed production may raise production but not speaking')

console.log('progress-profile-checks: ok')
