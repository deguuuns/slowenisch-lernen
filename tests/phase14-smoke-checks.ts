import assert from 'node:assert/strict'
import { assessSessionLoad } from '../lib/session-load'
import { defaultProgress } from '../lib/storage'

const load=assessSessionLoad(defaultProgress)
assert.equal(load.level,'balanced')
assert.equal(load.recommendedMinutes,defaultProgress.preferences.dailyGoalMinutes)
console.log('Phase 14 smoke checks passed')
