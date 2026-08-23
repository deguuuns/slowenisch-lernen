import assert from 'node:assert/strict'
import { chooseVocabularyDirection, primarySkillForDirection, rankVocabularyForPractice } from '../lib/practice-engine'
import { defaultProgress } from '../lib/storage'
import { Vocabulary } from '../types'

const words: Vocabulary[] = [
  { id:'a',sl:'danes',de:'heute',partOfSpeech:'adverb',category:'Zeit',example:'Danes delam.',exampleDe:'Heute arbeite ich.',lesson:1 },
  { id:'b',sl:'jutri',de:'morgen',partOfSpeech:'adverb',category:'Zeit',example:'Jutri delam.',exampleDe:'Morgen arbeite ich.',lesson:1 },
]

const now=1_800_000_000_000
const progress={...defaultProgress,introducedWords:['a','b'],reviews:[{key:'vocab:b',status:'unsicher' as const,dueAt:now-1,intervalIndex:0,lastReviewedAt:now-86_400_000}],mastery:{'vocab:a':{key:'vocab:a',kind:'vocabulary' as const,score:.9,attempts:5,correct:5,activeCorrect:4,passiveCorrect:1,hintsUsed:0,slowCorrect:0,lastSeen:now-1},'vocab:b':{key:'vocab:b',kind:'vocabulary' as const,score:.4,attempts:4,correct:2,activeCorrect:0,passiveCorrect:2,hintsUsed:0,slowCorrect:0,lastSeen:now-1},'skill:recognition':{key:'skill:recognition',kind:'skill' as const,score:.85,attempts:5,correct:5,lastSeen:now-1},'skill:production':{key:'skill:production',kind:'skill' as const,score:.45,attempts:3,correct:1,lastSeen:now-1}}}

assert.equal(rankVocabularyForPractice(words,progress,now)[0].id,'b','due/weak vocabulary should be ranked first')
assert.equal(chooseVocabularyDirection(words[1],progress,0),'de-sl','weak production should trigger active recall')
assert.equal(primarySkillForDirection('de-sl'),'production')
assert.equal(primarySkillForDirection('sl-de'),'recognition')

console.log('practice engine checks passed')
