import assert from 'node:assert/strict'
import { assessDailyTrainingLoad, buildDailyTrainingPlan } from '../lib/daily-training'
import { defaultProgress } from '../lib/storage'
import { exercises } from '../data/seed'
import type { AttemptSignal, UserProgress } from '../types'

const now=Date.now()
const attempts=(values:Array<Pick<AttemptSignal,'correct'|'responseMs'|'hintsUsed'>>):AttemptSignal[]=>values.map((value,index)=>({exerciseId:`load-${index}`,...value,occurredAt:now-index*1000}))

const base:UserProgress={...defaultProgress,preferences:{...defaultProgress.preferences,dailyGoalMinutes:10},reviews:[{key:'vocab:v001',dueAt:now-1000,lastReviewedAt:now-86_400_000,updatedAt:now-86_400_000,intervalIndex:0,status:'unsicher',successfulReviews:1,consecutiveCorrect:1}],mastery:{...defaultProgress.mastery,'skill:listening':{key:'skill:listening',kind:'skill',score:.42,attempts:5,correct:2,lastSeen:now-1000}}}
const plan=buildDailyTrainingPlan(base,exercises,2,now)
assert.equal(plan.goalMinutes,10)
assert.equal(plan.targetMinutes,10)
assert.equal(plan.load,'balanced')
assert.ok(plan.minutes>=8&&plan.minutes<=10)
assert.ok(plan.blocks.some(block=>block.kind==='review'))
assert.ok(plan.blocks.some(block=>block.kind==='weakness'))
assert.ok(plan.blocks.some(block=>block.kind==='listening'))
assert.equal(plan.primaryWeakness,'skill:listening')

const fresh:UserProgress={...defaultProgress,preferences:{...defaultProgress.preferences,dailyGoalMinutes:15},reviews:[],mastery:{}}
const freshPlan=buildDailyTrainingPlan(fresh,exercises,1,now)
assert.equal(freshPlan.goalMinutes,15)
assert.equal(freshPlan.targetMinutes,15)
assert.ok(freshPlan.blocks.some(block=>block.kind==='lesson'))
assert.ok(freshPlan.blocks.some(block=>block.kind==='speaking'))
assert.equal(freshPlan.minutes,15)

const overloaded:UserProgress={...fresh,recentAttempts:attempts([
  {correct:false,responseMs:25_000,hintsUsed:1},{correct:false,responseMs:18_000,hintsUsed:1},{correct:true,responseMs:42_000,hintsUsed:1},{correct:false,responseMs:31_000,hintsUsed:0},{correct:true,responseMs:36_000,hintsUsed:1},{correct:false,responseMs:20_000,hintsUsed:1},
])}
const overloadedLoad=assessDailyTrainingLoad(overloaded)
assert.equal(overloadedLoad.load,'high')
const overloadedPlan=buildDailyTrainingPlan(overloaded,exercises,1,now)
assert.equal(overloadedPlan.goalMinutes,15)
assert.equal(overloadedPlan.targetMinutes,11)
assert.equal(overloadedPlan.minutes,11)

const fluent:UserProgress={...fresh,recentAttempts:attempts([
  {correct:true,responseMs:7000,hintsUsed:0},{correct:true,responseMs:8000,hintsUsed:0},{correct:true,responseMs:9000,hintsUsed:0},{correct:true,responseMs:6500,hintsUsed:0},{correct:true,responseMs:10_000,hintsUsed:0},{correct:true,responseMs:7500,hintsUsed:0},
])}
const fluentLoad=assessDailyTrainingLoad(fluent)
assert.equal(fluentLoad.load,'light')
const fluentPlan=buildDailyTrainingPlan(fluent,exercises,1,now)
assert.equal(fluentPlan.goalMinutes,15)
assert.equal(fluentPlan.targetMinutes,18)
assert.equal(fluentPlan.minutes,18)

console.log('Daily training checks passed')
