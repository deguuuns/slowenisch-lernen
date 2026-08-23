import assert from 'node:assert/strict'
import { LISTENING_CURRICULUM, auditListeningCurriculum, listeningKnownRatio, recommendedListeningItems } from '../lib/listening-curriculum'

assert.equal(auditListeningCurriculum().length,0)
assert.ok(LISTENING_CURRICULUM.some(item=>item.stage==='word'))
assert.ok(LISTENING_CURRICULUM.some(item=>item.stage==='sentence'))
assert.ok(LISTENING_CURRICULUM.some(item=>item.stage==='dialogue'))
assert.ok(LISTENING_CURRICULUM.some(item=>item.stage==='story'))

const sentence=LISTENING_CURRICULUM.find(item=>item.id==='listen-sentence-location')!
assert.equal(listeningKnownRatio(sentence,new Set(['danes','slovenija'])),1)
assert.equal(listeningKnownRatio(sentence,new Set(['danes'])),.5)

const beginner=recommendedListeningItems(new Set(['doma','Slovenija','trgovina','restavracija']),.2)
assert.ok(beginner.length>0)
assert.ok(beginner.every(item=>item.stage==='word'||item.stage==='sentence'))

const advanced=recommendedListeningItems(new Set(['danes','jutri','iti','trgovina','želeti','piti','voda','doma']),.8)
assert.ok(advanced.some(item=>item.stage==='dialogue'||item.stage==='story'))

console.log('Listening curriculum checks passed')
