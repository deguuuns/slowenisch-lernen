import assert from 'node:assert/strict'
import { MICRO_LEARNING_CYCLE, learningPhaseForTarget, phaseForExercise, remediationPlan } from '../lib/learning-cycle'
import { defaultProgress } from '../lib/storage'
import type { Exercise } from '../types'

assert.deepEqual(MICRO_LEARNING_CYCLE,['understand','recognize','guided-production','active-production','variation','transfer'])

const recognition:Exercise={id:'test-recognition',lesson:1,type:'choice',prompt:'Was bedeutet brat?',answer:'Bruder',alternatives:['Schwester'],skillTargets:['recognition']}
const guided:Exercise={id:'test-guided',lesson:1,type:'free',prompt:'Baue den Satz',answer:'Imam brata.',wordBank:['Imam','brata.'],skillTargets:['production']}
const transfer:Exercise={id:'test-transfer',lesson:1,type:'free',prompt:'Ich habe zwei Brüder.',answer:'Imam dva brata.',transferSourceExerciseId:'source',transferRuleId:'dual',skillTargets:['grammar-application']}

assert.equal(phaseForExercise(recognition),'recognize')
assert.equal(phaseForExercise(guided),'guided-production')
assert.equal(phaseForExercise(transfer),'transfer')
assert.equal(learningPhaseForTarget(defaultProgress,'vocab:v039'),'understand')
assert.deepEqual(remediationPlan('dual-error').steps,['recognize','guided-production','active-production','variation'])
assert.match(remediationPlan('dual-error').contrast||'',/Singular.*Dual.*Plural/)
assert.match(remediationPlan('gender-error').focus,/Genus/)
assert.match(remediationPlan('case-error').focus,/Kasus/)
assert.match(remediationPlan('conjugation-error').focus,/Verbform/)

console.log('Learning cycle V2 checks passed')
