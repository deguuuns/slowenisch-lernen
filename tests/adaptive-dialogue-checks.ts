import assert from 'node:assert/strict'
import { adaptiveDialogueDecision, conversationScenario, dialogueProgress, dialogueResponseQuality, scenarioForWeakTargets } from '../lib/conversation-curriculum'

const shopping=conversationScenario('shopping')
assert.equal(shopping.steps[0].id,'product')
assert.equal(dialogueProgress('shopping','product').current,1)
assert.equal(dialogueProgress('shopping','quantity').percent,100)

assert.equal(dialogueResponseQuality('Iščem kruh.',0),'supported')
assert.equal(dialogueResponseQuality('Danes iščem dva velika kruha.',0),'strong')
assert.equal(dialogueResponseQuality('Kruh',0),'weak')
assert.equal(dialogueResponseQuality('Iščem kruh.',2),'weak')

const reinforce=adaptiveDialogueDecision('shopping','product','weak',1)
assert.equal(reinforce.reason,'reinforce')
assert.equal(reinforce.step.id,'product')
assert.equal(reinforce.completed,false)

const advance=adaptiveDialogueDecision('shopping','product','supported',1)
assert.equal(advance.reason,'advance')
assert.equal(advance.step.id,'quantity')

const secondAttemptAdvance=adaptiveDialogueDecision('shopping','product','weak',2)
assert.equal(secondAttemptAdvance.reason,'advance')
assert.equal(secondAttemptAdvance.step.id,'quantity')

const complete=adaptiveDialogueDecision('shopping','quantity','strong',1)
assert.equal(complete.reason,'complete')
assert.equal(complete.completed,true)

assert.equal(scenarioForWeakTargets(['numeral-gender']).grammarTargets.includes('numeral-gender'),true)

console.log('adaptive dialogue checks passed')
