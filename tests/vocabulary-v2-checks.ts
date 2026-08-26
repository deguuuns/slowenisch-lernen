import assert from 'node:assert/strict'
import { vocabulary } from '../data/curriculum'
import { a1VocabularyExpansion } from '../data/a1-vocabulary-expansion'
import { vocabularyV2Units } from '../data/a1-vocabulary-v2'
import { vocabulary as seedVocabulary } from '../data/seed'

assert.ok(vocabulary.length>=230,'A1 vocabulary V2 should contain the renewed core plus the new high-frequency additions')
assert.equal(new Set(vocabulary.map(word=>word.id)).size,vocabulary.length,'Vocabulary ids must stay unique for progress migration')
assert.ok(vocabulary.every(word=>word.cefrLevel),'Every released word needs a CEFR level')
assert.ok(vocabulary.every(word=>word.priority),'Every released word needs a didactic priority')
assert.ok(vocabulary.every(word=>word.topic),'Every released word needs a normalized topic')
assert.ok(vocabulary.every(word=>word.curriculumUnit),'Every released word needs a curriculum unit')
assert.equal(vocabularyV2Units.length,8,'A1 must be organized into eight coherent curriculum units')

const finalIds=new Set(vocabulary.map(word=>word.id))
for(const legacy of [...seedVocabulary,...a1VocabularyExpansion]){
  assert.ok(finalIds.has(legacy.id),`Legacy progress id ${legacy.id} must survive curriculum V2`)
}

for(const required of ['govoriti','razumeti','mama','oče','ponedeljek','račun','majica','hotel','glava']){
  assert.ok(vocabulary.some(word=>word.sl===required),`Missing high-frequency A1 word: ${required}`)
}

const brother=vocabulary.find(word=>word.sl==='brat')
assert.ok(brother,'brat must remain available under its stable id')
assert.equal(brother?.id,'v039','Existing vocabulary ids must remain stable for saved progress')
assert.equal(brother?.cefrLevel,'A1')
assert.ok(brother?.curriculumUnit?.includes('Familie'))

const speak=vocabulary.find(word=>word.sl==='govoriti')
assert.equal(speak?.lemma,'govoriti')
assert.equal(speak?.priority,1)

console.log('Vocabulary V2 checks passed')
