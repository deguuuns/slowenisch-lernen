import assert from 'node:assert/strict'
import { buildSessionPlan } from '../lib/session-planner'
import { defaultProgress } from '../lib/storage'
import { exercises } from '../data/seed'
import type { AttemptSignal, UserProgress } from '../types'

function attempt(correct:boolean,responseMs:number,hintsUsed:number,index:number):AttemptSignal{return {exerciseId:`planner-${index}`,correct,responseMs,hintsUsed,occurredAt:index+1,vocabularyIds:[],grammarRuleIds:[],skillTargets:[],activeProduction:false}}
const calm:UserProgress={...defaultProgress,preferences:{...defaultProgress.preferences,dailyGoalMinutes:10},recentAttempts:Array.from({length:8},(_,i)=>attempt(true,8000,0,i))}
const hard:UserProgress={...defaultProgress,preferences:{...defaultProgress.preferences,dailyGoalMinutes:10},recentAttempts:Array.from({length:8},(_,i)=>attempt(i%4===0,45000,1,i))}
const calmPlan=buildSessionPlan(calm,exercises,2)
const hardPlan=buildSessionPlan(hard,exercises,2)
assert.equal(calmPlan.loadLevel,'fresh')
assert.equal(calmPlan.recommendedMinutes,12)
assert.equal(hardPlan.loadLevel,'high')
assert.equal(hardPlan.recommendedMinutes,7)
assert.ok(hardPlan.total<=calmPlan.total)
assert.ok(hardPlan.loadReason.length>10)
console.log('Session planner duration checks passed')
