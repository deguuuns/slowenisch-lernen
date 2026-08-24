import assert from 'node:assert/strict'
import { rankIntroducedVerbForms, rankVocabularyForPractice } from '@/lib/practice-engine'
import { UserProgress, Vocabulary } from '@/types'

const progress={
  introducedWords:['v001','v002'],
  wordsLearned:[],
  secureWords:[],
  introducedVerbForms:['biti:singular:1','biti:singular:2'],
  mastery:{
    'vocab:v001':{score:.9,attempts:4,correct:4,activeCorrect:2,passiveCorrect:2},
    'vocab:v002':{score:.35,attempts:4,correct:1,activeCorrect:0,passiveCorrect:1},
    'verb:biti:singular:1':{score:.85,attempts:4,correct:4,activeCorrect:2,passiveCorrect:0},
    'verb:biti:singular:2':{score:.3,attempts:4,correct:1,activeCorrect:0,passiveCorrect:0},
  },
  reviews:[],
  mistakes:[],
} as unknown as UserProgress

const words=[
  {id:'v001',sl:'da',de:'ja',lesson:1,category:'Basis',example:'Da.','exampleDe':'Ja.'},
  {id:'v002',sl:'ne',de:'nein',lesson:1,category:'Basis',example:'Ne.','exampleDe':'Nein.'},
  {id:'v999',sl:'skrito',de:'versteckt',lesson:99,category:'Test',example:'Skrito.','exampleDe':'Versteckt.'},
] as Vocabulary[]

const rankedVocabulary=rankVocabularyForPractice(words,progress,Date.now())
assert.deepEqual(rankedVocabulary.map(word=>word.id),['v002','v001'],'Unbekannter Wortschatz darf nicht in den Test gelangen und schwacher Wortschatz muss priorisiert werden')

const rankedForms=rankIntroducedVerbForms(progress,Date.now())
assert.equal(rankedForms.length,2,'Nur curriculumseitig eingeführte Verbformen dürfen trainiert werden')
assert.equal(rankedForms[0].key,'biti:singular:2','Die schwächere eingeführte Verbform muss zuerst trainiert werden')
assert.equal(rankedForms[1].key,'biti:singular:1')
assert(rankedForms.every(candidate=>candidate.verbId==='biti'),'Nicht eingeführte Verben dürfen nicht auftauchen')

console.log('Phase 21 vocab/conjugation checks passed')
