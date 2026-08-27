import assert from 'node:assert/strict'
import { exercises, sentences, vocabulary } from '../data/curriculum'
import { CONTENT_VERSION, legacyProgressVocabularyMap } from '../data/content-version'
import { atomicIntroductionIssues, contentValidationIssues } from '../lib/content-validation'
import { enrichExercises } from '../lib/curriculum-metadata'
import { buildLearningBlocks, orderVocabularyByPrerequisites } from '../lib/learning-flow'
import { exerciseSemanticFingerprint } from '../lib/learning-targets'
import { hydrateProgress } from '../lib/storage'

assert.equal(CONTENT_VERSION,3)
assert.deepEqual(legacyProgressVocabularyMap,{v189:'v120',v214:'v115',v215:'v105',v216:'v113',v217:'v116'})

const enriched=enrichExercises(exercises)
const structural=contentValidationIssues({vocabulary,exercises:enriched,sentences})
assert.deepEqual(structural,[],`Content validation failed:\n${structural.join('\n')}`)
assert.deepEqual(atomicIntroductionIssues(vocabulary),[])

const lesson1=orderVocabularyByPrerequisites(vocabulary.filter(word=>word.lesson===1))
const ids=lesson1.map(word=>word.id)
for(const [before,after] of [['v001','v181'],['v181','v231'],['v231','v010'],['v010','v012']] as const){
  assert.ok(ids.indexOf(before)<ids.indexOf(after),`${before} must be introduced before ${after}`)
}

const zivjo=vocabulary.find(word=>word.id==='v001')!
assert.equal(zivjo.introExample,false,'Živjo intro must not expose the old multi-unknown example')
const kako=vocabulary.find(word=>word.id==='v181')!
assert.match(kako.usageNote||'',/wie/i)
const biti=vocabulary.find(word=>word.id==='v231')!
assert.equal(biti.sl,'biti')
const si=vocabulary.find(word=>word.id==='v012')!
assert.equal(si.parentId,'v231')
assert.ok(si.prerequisites?.includes('vocab:v010'))

const blocks=buildLearningBlocks(1,vocabulary,exercises,[],3)
const fingerprints=blocks.flatMap(block=>block.exercises.map(exerciseSemanticFingerprint))
assert.equal(new Set(fingerprints).size,fingerprints.length,'A lesson must not repeat the same semantic exercise across internal batches')

const phraseExercise=enriched.find(item=>item.id==='e01')!
assert.ok(phraseExercise.prerequisites?.includes('vocab:v181'),'Full greeting phrase must wait for kako')
assert.ok(phraseExercise.prerequisites?.includes('vocab:v012'),'Full greeting phrase must wait for si')
assert.equal(phraseExercise.learningPhase,'variation')

const migrated=hydrateProgress({
  introducedWords:['v189','v214','v001'],wordsLearned:['v215'],secureWords:['v216','v217'],
  reviews:[{key:'vocab:v189',status:'gelernt',dueAt:1,intervalIndex:0}],
  mastery:{'vocab:v214':{key:'vocab:v214',kind:'vocabulary',score:.8,attempts:2,correct:2,lastSeen:1}},
} as never)
assert.ok(migrated.introducedWords.includes('v120'))
assert.ok(migrated.introducedWords.includes('v115'))
assert.ok(migrated.wordsLearned.includes('v105'))
assert.ok(migrated.secureWords.includes('v113')&&migrated.secureWords.includes('v116'))
assert.ok(migrated.reviews.some(review=>review.key==='vocab:v120'))
assert.ok(migrated.mastery['vocab:v115'])
assert.equal(migrated.contentVersion,CONTENT_VERSION)

console.log('Atomic curriculum checks passed')
