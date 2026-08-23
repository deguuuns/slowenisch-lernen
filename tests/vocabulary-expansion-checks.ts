import assert from 'node:assert/strict'
import { vocabulary } from '@/data/seed'
import {
  a1VocabularyExpansion,
  curriculumUnitForVocabularyId,
  curriculumVocabularyUnits,
  vocabularyExpansionForLesson,
} from '@/data/a1-vocabulary-expansion'

assert.equal(a1VocabularyExpansion.length,60,'Phase 16 should add 60 curated A1 entries')
assert.deepEqual(curriculumVocabularyUnits.map(unit=>unit.lesson),[6,7,8])
assert.ok(curriculumVocabularyUnits.every(unit=>unit.vocabularyIds.length===20),'each planned lesson must own 20 words')

const existingIds=new Set(vocabulary.map(item=>item.id))
const existingSl=new Set(vocabulary.map(item=>item.sl.trim().toLocaleLowerCase('sl')))
const expansionIds=a1VocabularyExpansion.map(item=>item.id)
const expansionSl=a1VocabularyExpansion.map(item=>item.sl.trim().toLocaleLowerCase('sl'))
assert.equal(new Set(expansionIds).size,expansionIds.length,'expansion ids must be unique')
assert.equal(new Set(expansionSl).size,expansionSl.length,'expansion Slovene entries must be unique')
assert.ok(expansionIds.every(id=>!existingIds.has(id)),'expansion must not replace existing vocabulary ids')
assert.ok(expansionSl.every(sl=>!existingSl.has(sl)),'expansion must not duplicate existing Slovene entries')

for(const item of a1VocabularyExpansion){
  assert.match(item.id,/^v1[2-7]\d$|^v180$/,'expansion ids must stay in the reserved v121-v180 range')
  assert.ok([6,7,8].includes(item.lesson),'every imported word must be curriculum-bound to a planned lesson')
  assert.equal(item.cefrLevel,'A1')
  assert.ok(item.sl.trim()&&item.de.trim()&&item.example.trim()&&item.exampleDe.trim(),'entries require translations and examples')
  assert.ok(item.tags?.length,'entries require curriculum tags')
  assert.equal(curriculumUnitForVocabularyId(item.id)?.lesson,item.lesson,'unit binding must match vocabulary lesson')
}

for(const unit of curriculumVocabularyUnits){
  assert.deepEqual(vocabularyExpansionForLesson(unit.lesson).map(item=>item.id),unit.vocabularyIds)
}

assert.deepEqual(
  a1VocabularyExpansion.map(item=>Number(item.id.slice(1))),
  Array.from({length:60},(_,index)=>121+index),
  'stable ids must be contiguous after the existing v120 catalog',
)

console.log('Vocabulary expansion checks passed')
