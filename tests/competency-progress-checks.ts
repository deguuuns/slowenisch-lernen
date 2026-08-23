import assert from 'node:assert/strict'
import { buildCefrProgress, competencyScores, percent } from '../lib/competency-progress'
import { UserProgress } from '../types'

const progress:UserProgress={
 completedLessons:[1,2,3],streak:4,introducedWords:['a','b','c','d'],introducedGrammarRules:['dual','case'],introducedVerbForms:[],wordsLearned:['a','b','c'],secureWords:['a','b'],mistakes:[],reviews:[],speakingMinutes:8,listeningMinutes:12,
 mastery:{
  'vocab:a':{key:'vocab:a',kind:'vocabulary',score:.9,attempts:5,correct:5,lastSeen:1},
  'vocab:b':{key:'vocab:b',kind:'vocabulary',score:.75,attempts:4,correct:3,lastSeen:1},
  'skill:listening':{key:'skill:listening',kind:'skill',score:.8,attempts:6,correct:5,lastSeen:1},
  'skill:speaking':{key:'skill:speaking',kind:'skill',score:.62,attempts:5,correct:3,lastSeen:1},
  'skill:production':{key:'skill:production',kind:'skill',score:.68,attempts:5,correct:3,lastSeen:1},
  'grammar:dual':{key:'grammar:dual',kind:'grammar',score:.35,attempts:6,correct:2,lastSeen:1},
  'grammar:case:locative':{key:'grammar:case:locative',kind:'grammar',score:.7,attempts:5,correct:4,lastSeen:1},
 },recentAttempts:[],transferQueue:[],preferences:{onboardingCompleted:true,nativeLanguage:'de',targetLevel:'A1',dailyGoalMinutes:10,pace:'normal',audioSpeed:'normal'},updatedAt:1,preferencesUpdatedAt:1,
}
const scores=competencyScores(progress)
assert.equal(scores.length,7)
assert.equal(scores.find(x=>x.domain==='listening')?.score,.8)
assert.equal(scores.find(x=>x.domain==='dual')?.status,'aufbau')
const report=buildCefrProgress(progress)
assert.equal(report.level,'A1')
assert.equal(report.weakest?.domain,'dual')
assert.match(report.recommendation,/Dual/)
assert.ok(report.overall>0&&report.overall<1)
assert.equal(percent(.756),76)
assert.equal(percent(3),100)
console.log('Competency progress checks passed')
