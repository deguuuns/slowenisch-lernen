import assert from 'node:assert/strict'
import { exercises,vocabulary } from '../data/seed'
import { enrichExercises } from '../lib/curriculum-metadata'
import { buildAdaptiveRecommendation,buildAdaptiveReviewDeck } from '../lib/adaptive-curriculum'
import { getVocabularyStatus } from '../lib/learner-status'
import { defaultProgress,queueTransfers,resetLearningProgress,scheduleReview,updateMastery } from '../lib/storage'
import { mergeProgress } from '../lib/cloud-sync'
import { isExerciseEligible,verbFormKey } from '../lib/curriculum-access'
import type { Exercise,UserProgress } from '../types'

function fresh(overrides:Partial<UserProgress>={}):UserProgress{return {...structuredClone(defaultProgress),preferences:{...defaultProgress.preferences},...overrides}}
const enriched=enrichExercises(exercises)
const choice:Exercise={id:'t-choice',lesson:1,type:'choice',prompt:'x',answer:'A',alternatives:['B'],vocabularyIds:['v001'],grammarRuleIds:[],skillTargets:['recognition']}
const produce:Exercise={id:'t-produce',lesson:1,type:'translate-de-sl',prompt:'x',answer:'Živjo',vocabularyIds:['v001'],grammarRuleIds:['greeting-basic'],skillTargets:['production']}

let p=fresh({introducedWords:['v001']})
assert.equal(getVocabularyStatus('v001',p),'eingeführt')
let m=updateMastery({},choice,true,3000,0)
p={...p,mastery:m}
assert.notEqual(getVocabularyStatus('v001',p),'sicher')
assert.equal(m['vocab:v001'].activeCorrect,0)

const passive=updateMastery({},choice,true,3000,0)['vocab:v001']
const active=updateMastery({},produce,true,3000,0)['vocab:v001']
assert.equal(active.activeCorrect,1)
assert.equal(passive.passiveCorrect,1)
assert.ok(active.score>=passive.score)

const noHint=updateMastery({},produce,true,3000,0)['vocab:v001'].score
const withHint=updateMastery({},produce,true,3000,1)['vocab:v001'].score
const slow=updateMastery({},produce,true,50000,0)['vocab:v001'].score
assert.ok(noHint>withHint)
assert.ok(noHint>slow)

let queue=queueTransfers([],produce,false,4)
assert.ok(queue.length>0)
assert.ok(queue[0].dueAfter>=6)
const transfer={...produce,id:'transfer',transferSourceExerciseId:produce.id,transferRuleId:'greeting-basic'}
queue=queueTransfers(queue,transfer,true,8)
assert.equal(queue.length,0)

let reviews=scheduleReview([],'vocab:v001',true)
reviews=scheduleReview(reviews,'vocab:v001',true)
assert.equal(reviews[0].intervalIndex,1)
reviews=scheduleReview(reviews,'vocab:v001',false)
assert.equal(reviews[0].intervalIndex,0)
assert.ok((reviews[0].updatedAt||0)>0)

const now=Date.now()
const local=fresh({mastery:{'grammar:dual-masculine-numeral':{key:'grammar:dual-masculine-numeral',kind:'grammar',score:.72,attempts:5,correct:4,lastSeen:now}},updatedAt:now,preferencesUpdatedAt:now})
const cloud=fresh({mastery:{'grammar:dual-masculine-numeral':{key:'grammar:dual-masculine-numeral',kind:'grammar',score:.58,attempts:4,correct:3,lastSeen:now-10000}},updatedAt:now-10000,preferencesUpdatedAt:now-10000})
assert.equal(mergeProgress(local,cloud).mastery['grammar:dual-masculine-numeral'].score,.72)

// Locked vocabulary and grammar are not eligible.
const e08=enriched.find(e=>e.id==='e08')!
assert.equal(isExerciseEligible(e08,fresh()),false)
const e08Words=e08.vocabularyIds||[]
const grammarUnlocked=fresh({introducedWords:e08Words,introducedGrammarRules:['number-basics','dual-masculine-numeral','accusative-family','verb-first-person'],introducedVerbForms:[verbFormKey({verbId:'imeti',person:1,number:'singular'})]})
assert.equal(isExerciseEligible(e08,grammarUnlocked),true)

// Due review beats new content only when the reviewed material is unlocked.
const due=fresh({preferences:{...defaultProgress.preferences,onboardingCompleted:true},introducedWords:['v001'],introducedGrammarRules:['greeting-basic'],reviews:[{key:'vocab:v001',status:'unsicher',intervalIndex:0,dueAt:0,updatedAt:1}]})
assert.equal(buildAdaptiveRecommendation(due,enriched,vocabulary,1,now).kind,'review')

// Locked weak grammar must never be drilled before introduction.
const lockedWeak=fresh({preferences:{...defaultProgress.preferences,onboardingCompleted:true},mastery:{'grammar:dual-masculine-numeral':{key:'grammar:dual-masculine-numeral',kind:'grammar',score:.3,attempts:3,correct:1,lastSeen:now}}})
assert.equal(buildAdaptiveRecommendation(lockedWeak,enriched,vocabulary,1,now).kind,'new-content')
const unlockedWeak=fresh({preferences:{...defaultProgress.preferences,onboardingCompleted:true},introducedWords:e08Words,introducedGrammarRules:['number-basics','dual-masculine-numeral','accusative-family','verb-first-person'],introducedVerbForms:[verbFormKey({verbId:'imeti',person:1,number:'singular'})],mastery:{'grammar:dual-masculine-numeral':{key:'grammar:dual-masculine-numeral',kind:'grammar',score:.3,attempts:3,correct:1,lastSeen:now}}})
assert.equal(buildAdaptiveRecommendation(unlockedWeak,enriched,vocabulary,2,now).title,'Grammatik gezielt festigen')

// Review deck must contain only eligible content and avoid recent duplicates where alternatives exist.
const reviewDeck=buildAdaptiveReviewDeck(unlockedWeak,enriched,8,now)
assert.ok(reviewDeck.every(ex=>isExerciseEligible(ex,unlockedWeak)))

// Reset clears learning state but keeps preferences, and a newer reset defeats stale cloud data.
const learned=fresh({introducedWords:['v001'],introducedGrammarRules:['greeting-basic'],wordsLearned:['v001'],completedLessons:[1],preferences:{...defaultProgress.preferences,dailyGoalMinutes:20},updatedAt:now-100})
const reset=resetLearningProgress(learned)
assert.equal(reset.introducedWords.length,0)
assert.equal(reset.introducedGrammarRules.length,0)
assert.equal(reset.completedLessons.length,0)
assert.equal(reset.preferences.dailyGoalMinutes,20)
const staleCloud=fresh({introducedWords:['v001'],completedLessons:[1],updatedAt:(reset.resetAt||now)-1000})
assert.equal(mergeProgress(reset,staleCloud).introducedWords.length,0)

const imbalance=fresh({preferences:{...defaultProgress.preferences,onboardingCompleted:true},mastery:{'skill:recognition':{key:'skill:recognition',kind:'skill',score:.9,attempts:4,correct:4,lastSeen:now},'skill:production':{key:'skill:production',kind:'skill',score:.4,attempts:3,correct:1,lastSeen:now}}})
assert.equal(buildAdaptiveRecommendation(imbalance,enriched,vocabulary,1,now).kind,'new-content')

const stable=fresh({preferences:{...defaultProgress.preferences,onboardingCompleted:true}})
assert.equal(buildAdaptiveRecommendation(stable,enriched,vocabulary,1,now).kind,'new-content')

console.log('Regression checks passed')
