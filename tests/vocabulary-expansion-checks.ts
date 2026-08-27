import assert from 'node:assert/strict'
import { vocabulary } from '../data/curriculum'
import { laterLessonVocabulary, laterLessonVocabularyUnits } from '../data/vocabulary-lessons-6-8'

assert.equal(laterLessonVocabulary.length,60,'Lessons 6-8 retain 60 curated A1 entries')
assert.deepEqual(laterLessonVocabularyUnits.map(unit=>unit.lesson),[6,7,8])
assert.ok(laterLessonVocabularyUnits.every(unit=>unit.vocabularyIds.length===20),'Each later lesson segment owns 20 stable ids')

const ids=laterLessonVocabulary.map(item=>item.id)
assert.equal(new Set(ids).size,ids.length)
assert.deepEqual(ids.map(id=>Number(id.slice(1))),Array.from({length:60},(_,index)=>121+index))

const releasedIds=new Set(vocabulary.map(item=>item.id))
for(const item of laterLessonVocabulary){
  assert.ok(releasedIds.has(item.id),`${item.id} must be reachable through the canonical vocabulary catalog`)
  assert.equal(item.cefrLevel,'A1')
}

console.log('Later-lesson vocabulary segment checks passed')
