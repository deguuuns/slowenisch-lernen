import assert from 'node:assert/strict'
import { buildDailyTrainingPlan, dailyTrainingBlockDestination, exerciseTargetKeys } from '../lib/daily-training'
import { defaultProgress } from '../lib/storage'
import { exercises } from '../data/seed'
import type { AttemptSignal, Exercise, UserProgress } from '../types'

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
assert.equal(dailyTrainingBlockDestination(plan.blocks.find(block=>block.kind==='listening')!),'review')

const fresh:UserProgress={...defaultProgress,preferences:{...defaultProgress.preferences,dailyGoalMinutes:15},reviews:[],mastery:{}}
const freshPlan=buildDailyTrainingPlan(fresh,exercises,1,now)
assert.equal(freshPlan.goalMinutes,15)
assert.equal(freshPlan.recommendedMinutes,15)
assert.ok(freshPlan.blocks.some(block=>block.kind==='lesson'))
assert.ok(freshPlan.blocks.some(block=>block.kind==='speaking'))
assert.equal(freshPlan.minutes,15)
assert.equal(dailyTrainingBlockDestination(freshPlan.blocks.find(block=>block.kind==='lesson')!),'lesson')
assert.equal(dailyTrainingBlockDestination(freshPlan.blocks.find(block=>block.kind==='speaking')!),'speak')

// Regression: neue Inhalte müssen auch in den inzwischen vorhandenen Lektionen 6–8
// Bestandteil des Tagesflows bleiben und dürfen nicht pauschal durch Sprechen ersetzt werden.
const laterLessonPlan=buildDailyTrainingPlan({...fresh,preferences:{...fresh.preferences,dailyGoalMinutes:15}},exercises,8,now)
assert.ok(laterLessonPlan.blocks.some(block=>block.kind==='lesson'))
assert.ok(laterLessonPlan.blocks.some(block=>block.title==='Lektion 8 fortsetzen'))

const targetExercise:Exercise={id:'daily-target-test',lesson:1,type:'fill',prompt:'Test',answer:'test',vocabularyIds:['v001'],grammarRuleIds:['g001'],skillTargets:['production'],targetContentKeys:['skill:speaking']}
const keys=exerciseTargetKeys(targetExercise)
assert.ok(keys.includes('vocab:v001'))
assert.ok(keys.includes('grammar:g001'))
assert.ok(keys.includes('skill:production'))
assert.ok(keys.includes('skill:speaking'))

function attempt(correct:boolean,responseMs:number,hintsUsed:number,index:number):AttemptSignal{return {exerciseId:`daily-load-${index}`,correct,responseMs,hintsUsed,occurredAt:now-index,vocabularyIds:[],grammarRuleIds:[],skillTargets:[],activeProduction:false}}
const overloaded:UserProgress={...fresh,preferences:{...fresh.preferences,dailyGoalMinutes:20},recentAttempts:Array.from({length:8},(_,i)=>attempt(i%3===0,45_000,1,i))}
const overloadedPlan=buildDailyTrainingPlan(overloaded,exercises,2,now)
assert.equal(overloadedPlan.loadLevel,'high')
assert.equal(overloadedPlan.goalMinutes,20)
assert.equal(overloadedPlan.recommendedMinutes,14)
assert.equal(overloadedPlan.minutes,14)

console.log('Daily training checks passed')
