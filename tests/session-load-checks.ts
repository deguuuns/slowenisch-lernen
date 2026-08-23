import assert from 'node:assert/strict'
import { assessSessionLoad, exercisesForMinutes } from '../lib/session-load'
import { defaultProgress } from '../lib/storage'
import type { AttemptSignal, LearnerPreferences, UserProgress } from '../types'

function attempt(correct:boolean,responseMs:number,hintsUsed=0,index=0):AttemptSignal{
  return {exerciseId:`load-${index}`,correct,responseMs,hintsUsed,occurredAt:index+1,vocabularyIds:[],grammarRuleIds:[],skillTargets:[],activeProduction:false}
}
function progress(goal:LearnerPreferences['dailyGoalMinutes'],attempts:AttemptSignal[]):UserProgress{
  return {...defaultProgress,preferences:{...defaultProgress.preferences,dailyGoalMinutes:goal},recentAttempts:attempts}
}

const sparse=assessSessionLoad(progress(10,[attempt(true,5000,0,1)]))
assert.equal(sparse.level,'balanced')
assert.equal(sparse.recommendedMinutes,10)

const fresh=assessSessionLoad(progress(10,Array.from({length:8},(_,i)=>attempt(true,7000,0,i))))
assert.equal(fresh.level,'fresh')
assert.equal(fresh.recommendedMinutes,12)

const elevated=assessSessionLoad(progress(20,[
  attempt(true,32000,0,1),attempt(true,35000,1,2),attempt(false,22000,0,3),attempt(true,31000,0,4),
  attempt(true,29000,0,5),attempt(false,26000,0,6),attempt(true,28000,0,7),attempt(true,27000,0,8),
]))
assert.equal(elevated.level,'elevated')
assert.equal(elevated.recommendedMinutes,17)

const high=assessSessionLoad(progress(15,[
  attempt(false,45000,1,1),attempt(false,42000,1,2),attempt(true,50000,1,3),attempt(false,38000,0,4),
  attempt(true,46000,1,5),attempt(false,41000,1,6),attempt(false,39000,0,7),attempt(true,43000,1,8),
]))
assert.equal(high.level,'high')
assert.equal(high.recommendedMinutes,11)
assert.ok(high.recommendedMinutes>=5)
assert.ok(exercisesForMinutes(high.recommendedMinutes)<exercisesForMinutes(15))

console.log('Session load checks passed')
