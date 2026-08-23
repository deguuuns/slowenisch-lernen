import assert from 'node:assert/strict'
import { buildDailyTrainingPlan } from '../lib/daily-training'
import { defaultProgress } from '../lib/storage'
import { exercises } from '../data/seed'
import type { AttemptSignal, UserProgress } from '../types'

const now=Date.now()
const base:UserProgress={...defaultProgress,preferences:{...defaultProgress.preferences,dailyGoalMinutes:10},reviews:[{key:'vocab:v001',dueAt:now-1000,lastReviewedAt:now-86_400_000,updatedAt:now-86_400_000,intervalIndex:0,status:'unsicher',successfulReviews:1,consecutiveCorrect:1}],mastery:{...defaultProgress.mastery,'skill:listening':{key:'skill:listening',kind:'skill',score:.42,attempts:5,correct:2,lastSeen:now-1000}}}
const plan=buildDailyTrainingPlan(base,exercises,2,now)
assert.equal(plan.goalMinutes,10)
assert.equal(plan.recommendedMinutes,10)
assert.equal(plan.loadLevel,'balanced')
assert.ok(plan.minutes>=8&&plan.minutes<=10)
assert.ok(plan.blocks.some(block=>block.kind==='review'))
assert.ok(plan.blocks.some(block=>block.kind==='weakness'))
assert.ok(plan.blocks.some(block=>block.kind==='listening'))
assert.equal(plan.primaryWeakness,'skill:listening')

const fresh:UserProgress={...defaultProgress,preferences:{...defaultProgress.preferences,dailyGoalMinutes:15},reviews:[],mastery:{}}
const freshPlan=buildDailyTrainingPlan(fresh,exercises,1,now)
assert.equal(freshPlan.goalMinutes,15)
assert.equal(freshPlan.recommendedMinutes,15)
assert.ok(freshPlan.blocks.some(block=>block.kind==='lesson'))
assert.ok(freshPlan.blocks.some(block=>block.kind==='speaking'))
assert.equal(freshPlan.minutes,15)

function attempt(correct:boolean,responseMs:number,hintsUsed:number,index:number):AttemptSignal{return {exerciseId:`daily-load-${index}`,correct,responseMs,hintsUsed,occurredAt:now-index,vocabularyIds:[],grammarRuleIds:[],skillTargets:[],activeProduction:false}}
const overloaded:UserProgress={...fresh,preferences:{...fresh.preferences,dailyGoalMinutes:20},recentAttempts:Array.from({length:8},(_,i)=>attempt(i%3===0,45_000,1,i))}
const overloadedPlan=buildDailyTrainingPlan(overloaded,exercises,2,now)
assert.equal(overloadedPlan.loadLevel,'high')
assert.equal(overloadedPlan.goalMinutes,20)
assert.equal(overloadedPlan.recommendedMinutes,14)
assert.equal(overloadedPlan.minutes,14)

console.log('Daily training checks passed')
