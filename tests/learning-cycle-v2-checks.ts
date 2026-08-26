import assert from 'node:assert/strict'
import { MICRO_LEARNING_CYCLE, learningPhaseForTarget, phaseForExercise, remediationPlan } from '../lib/learning-cycle'
import { orderExercisesByLearningCycle } from '../lib/learning-flow'
import { buildImmediateRemediationQueue } from '../lib/remediation-engine'
import { defaultProgress } from '../lib/storage'
import type { SessionExercise } from '../lib/exercise-session'
import type { Exercise, MistakeCategory } from '../types'

assert.deepEqual(MICRO_LEARNING_CYCLE,['understand','recognize','guided-production','active-production','variation','transfer'])

const recognition:Exercise={id:'test-recognition',lesson:1,type:'choice',prompt:'Was bedeutet brat?',answer:'Bruder',alternatives:['Schwester','Vater'],skillTargets:['recognition'],targetContentKeys:['vocab:v039']}
const guided:Exercise={id:'test-guided',lesson:1,type:'free',prompt:'Baue den Satz',answer:'Imam brata.',wordBank:['Imam','brata.'],skillTargets:['production'],targetContentKeys:['vocab:v039'],grammarRuleIds:['accusative-family']}
const active:Exercise={id:'test-active',lesson:1,type:'free',prompt:'Ich habe einen Bruder.',answer:'Imam brata.',skillTargets:['production'],targetContentKeys:['vocab:v039'],grammarRuleIds:['accusative-family'],learningPhase:'active-production'}
const transfer:Exercise={id:'test-transfer',lesson:1,type:'free',prompt:'Ich habe zwei Brüder.',answer:'Imam dva brata.',transferSourceExerciseId:'source',transferRuleId:'dual',skillTargets:['grammar-application'],targetContentKeys:['vocab:v039'],grammarRuleIds:['dual-masculine-numeral']}

assert.equal(phaseForExercise(recognition),'recognize')
assert.equal(phaseForExercise(guided),'guided-production')
assert.equal(phaseForExercise(transfer),'transfer')
assert.equal(learningPhaseForTarget(defaultProgress,'vocab:v039'),'understand')
assert.deepEqual(orderExercisesByLearningCycle([transfer,active,recognition,guided]).map(item=>phaseForExercise(item)),['recognize','guided-production','active-production','transfer'])

assert.deepEqual(remediationPlan('dual-error').steps,['recognize','guided-production','active-production','variation'])
assert.match(remediationPlan('dual-error').contrast||'',/Singular.*Dual.*Plural/)
assert.match(remediationPlan('gender-error').focus,/Genus/)
assert.match(remediationPlan('case-error').focus,/Kasus/)
assert.match(remediationPlan('conjugation-error').focus,/Verbform/)

const sessionItem=(exercise:Exercise,index:number):SessionExercise=>({id:`session:${index}:${exercise.id}`,sourceExerciseId:exercise.id,exercise,options:[]})
const items=[sessionItem(recognition,0),sessionItem(guided,1),sessionItem(active,2),sessionItem(transfer,3)]
const categories=new Map<string,MistakeCategory|undefined>([[items[3].id,'dual-error']])
const remediation=buildImmediateRemediationQueue([items[3]],items,categories)
assert.equal(remediation[remediation.length-1].id,items[3].id,'The failed task must be revisited after related preparation')
assert.ok(remediation.length>=2,'A related preparation task should be inserted before retrying when available')
assert.ok(remediation.slice(0,-1).some(item=>item.exercise.id==='test-recognition'||item.exercise.id==='test-guided'||item.exercise.id==='test-active'))

console.log('Learning cycle V2 checks passed')
