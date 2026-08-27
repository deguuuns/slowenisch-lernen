import assert from 'node:assert/strict'
import { vocabulary } from '../data/curriculum'
import { CONTENT_VERSION, legacyProgressVocabularyMap } from '../data/content-version'
import { vocabularyUnits } from '../data/vocabulary-catalog'

assert.equal(CONTENT_VERSION,3)
assert.ok(vocabulary.length>=220,'Canonical A1 catalog should preserve the broad released vocabulary')
assert.equal(new Set(vocabulary.map(word=>word.id)).size,vocabulary.length,'Vocabulary ids must be unique')
assert.equal(new Set(vocabulary.map(word=>word.sl.trim().toLocaleLowerCase('sl'))).size,vocabulary.length,'Canonical Slovene entries must not be duplicated')
assert.ok(vocabulary.every(word=>word.cefrLevel),'Every released word needs a CEFR level')
assert.ok(vocabulary.every(word=>word.priority),'Every released word needs a didactic priority')
assert.ok(vocabulary.every(word=>word.topic),'Every released word needs a normalized topic')
assert.ok(vocabulary.every(word=>word.curriculumUnit),'Every released word needs a curriculum unit')
assert.ok(vocabulary.every(word=>word.contentType),'Every released word needs a content type')
assert.equal(vocabularyUnits.length,8,'A1 must remain organized into eight coherent curriculum units')

for(const required of ['živjo','kako','biti','si','govoriti','razumeti','mama','oče','ponedeljek','račun','majica','hotel','glava']){
  assert.ok(vocabulary.some(word=>word.sl===required),`Missing high-frequency A1 content: ${required}`)
}

const brother=vocabulary.find(word=>word.sl==='brat')
assert.equal(brother?.id,'v039','Stable legacy ids must survive migration')
assert.equal(brother?.cefrLevel,'A1')
assert.ok(brother?.curriculumUnit?.includes('Familie'))

const how=vocabulary.find(word=>word.id==='v181')
assert.equal(how?.sl,'kako')
assert.match(how?.usageNote||'',/Kako si/)
const be=vocabulary.find(word=>word.id==='v231')
assert.equal(be?.lemma,'biti')
const si=vocabulary.find(word=>word.id==='v012')
assert.equal(si?.contentType,'form')
assert.equal(si?.parentId,'v231')

for(const duplicateId of Object.keys(legacyProgressVocabularyMap)){
  assert.ok(!vocabulary.some(word=>word.id===duplicateId),`${duplicateId} is migration-only and must not remain active content`)
}

console.log('Canonical vocabulary checks passed')
