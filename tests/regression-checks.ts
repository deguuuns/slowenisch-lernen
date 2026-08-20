import assert from 'node:assert/strict'
import { exercises,vocabulary } from '../data/seed'
import { enrichExercises } from '../lib/curriculum-metadata'
import { buildAdaptiveRecommendation } from '../lib/adaptive-curriculum'
import { getVocabularyStatus } from '../lib/learner-status'
import { defaultProgress,queueTransfers,scheduleReview,updateMastery } from '../lib/storage'
import { mergeProgress } from '../lib/cloud-sync'
import type { Exercise,UserProgress } from '../types'

function fresh(overrides:Partial<UserProgress>={}):UserProgress{return {...structuredClone(defaultProgress),preferences:{...defaultProgress.preferences},...overrides}}
const enriched=enrichExercises(exercises)
const choice:Exercise={id:'t-choice',lesson:1,type:'choice',prompt:'x',answer:'A',alternatives:['B'],vocabularyIds:['v001'],grammarRuleIds:[],skillTargets:['recognition']}
const produce:Exercise={id:'t-produce',lesson:1,type:'translate-de-sl',prompt:'x',answer:'Živjo',vocabularyIds:['v001'],grammarRuleIds:['greeting-basic'],skillTargets:['production']}

// Vocabulary status: introduction alone is not learning/mastery.
let p=fresh({introducedWords:['v001']})
assert.equal(getVocabularyStatus('v001',p),'eingeführt')
let m=updateMastery({},choice,true,3000,0)
p={...p,mastery:m}
assert.notEqual(getVocabularyStatus('v001',p),'sicher')
assert.equal(m['vocab:v001'].activeCorrect,0)

// Active production is tracked separately and scores at least as strongly as passive recognition.
const passive=updateMastery({},choice,true,3000,0)['vocab:v001']
const active=updateMastery({},produce,true,3000,0)['vocab:v001']
assert.equal(active.activeCorrect,1)
assert.equal(passive.passiveCorrect,1)
assert.ok(active.score>=passive.score)

// Hints and very slow responses reduce the positive signal.
const noHint=updateMastery({},produce,true,3000,0)['vocab:v001'].score
const withHint=updateMastery({},produce,true,3000,1)['vocab:v001'].score
const slow=updateMastery({},produce,true,50000,0)['vocab:v001'].score
assert.ok(noHint>withHint)
assert.ok(noHint>slow)

// Wrong grammar creates delayed transfer, successful transfer removes it.
let queue=queueTransfers([],produce,false,4)
assert.ok(queue.length>0)
assert.ok(queue[0].dueAfter>=6)
const transfer={...produce,id:'transfer',transferSourceExerciseId:produce.id,transferRuleId:'greeting-basic'}
queue=queueTransfers(queue,transfer,true,8)
assert.equal(queue.length,0)

// Review scheduling keeps update timestamps and wrong answers reset the interval.
let reviews=scheduleReview([],'vocab:v001',true)
reviews=scheduleReview(reviews,'vocab:v001',true)
assert.equal(reviews[0].intervalIndex,1)
reviews=scheduleReview(reviews,'vocab:v001',false)
assert.equal(reviews[0].intervalIndex,0)
assert.ok((reviews[0].updatedAt||0)>0)

// Newer local mastery must beat an older cloud snapshot.
const now=Date.now()
const local=fresh({mastery:{'grammar:dual-masculine-numeral':{key:'grammar:dual-masculine-numeral',kind:'grammar',score:.72,attempts:5,correct:4,lastSeen:now}},updatedAt:now,preferencesUpdatedAt:now})
const cloud=fresh({mastery:{'grammar:dual-masculine-numeral':{key:'grammar:dual-masculine-numeral',kind:'grammar',score:.58,attempts:4,correct:3,lastSeen:now-10000}},updatedAt:now-10000,preferencesUpdatedAt:now-10000})
const merged=mergeProgress(local,cloud)
assert.equal(merged.mastery['grammar:dual-masculine-numeral'].score,.72)

// Adaptive curriculum: due review beats new content.
const due=fresh({preferences:{...defaultProgress.preferences,onboardingCompleted:true},reviews:[{key:'vocab:v001',status:'unsicher',intervalIndex:0,dueAt:0,updatedAt:1}]})
assert.equal(buildAdaptiveRecommendation(due,enriched,vocabulary,1,now).kind,'review')

// Weak grammar beats new content.
const weakGrammar=fresh({preferences:{...defaultProgress.preferences,onboardingCompleted:true},mastery:{'grammar:dual-masculine-numeral':{key:'grammar:dual-masculine-numeral',kind:'grammar',score:.3,attempts:3,correct:1,lastSeen:now}}})
assert.equal(buildAdaptiveRecommendation(weakGrammar,enriched,vocabulary,1,now).title,'Grammatik gezielt festigen')

// Recognition/production imbalance requests active production.
const imbalance=fresh({preferences:{...defaultProgress.preferences,onboardingCompleted:true},mastery:{'skill:recognition':{key:'skill:recognition',kind:'skill',score:.9,attempts:4,correct:4,lastSeen:now},'skill:production':{key:'skill:production',kind:'skill',score:.4,attempts:3,correct:1,lastSeen:now}}})
assert.equal(buildAdaptiveRecommendation(imbalance,enriched,vocabulary,1,now).kind,'speaking')

// Stable learner may advance to new content.
const stable=fresh({preferences:{...defaultProgress.preferences,onboardingCompleted:true}})
assert.equal(buildAdaptiveRecommendation(stable,enriched,vocabulary,1,now).kind,'new-content')

console.log('Regression checks passed')
