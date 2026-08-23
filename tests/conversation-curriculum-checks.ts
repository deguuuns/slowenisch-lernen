import assert from 'node:assert/strict'
import { CONVERSATION_CURRICULUM,conversationScenario,nextConversationStep,scenarioForWeakTargets } from '../lib/conversation-curriculum'

assert.ok(CONVERSATION_CURRICULUM.length>=6)
for(const scenario of CONVERSATION_CURRICULUM){
 assert.ok(scenario.steps.length>=2,`${scenario.id}: too few steps`)
 assert.ok(scenario.goal.length>0,`${scenario.id}: missing goal`)
 for(const step of scenario.steps){
  assert.ok(step.prompt.length>0,`${scenario.id}/${step.id}: prompt missing`)
  assert.ok(step.acceptedPatterns.length>0,`${scenario.id}/${step.id}: accepted patterns missing`)
  assert.ok(step.grammarTargets.length>0,`${scenario.id}/${step.id}: grammar target missing`)
 }
}
assert.equal(conversationScenario('restaurant').steps[0].id,'drink')
assert.equal(nextConversationStep('restaurant','drink').id,'food')
assert.equal(scenarioForWeakTargets(['numeral-gender']).grammarTargets.includes('numeral-gender'),true)
assert.equal(conversationScenario('family').grammarTargets.includes('dual-vs-plural'),true)
console.log('Conversation curriculum checks passed')
