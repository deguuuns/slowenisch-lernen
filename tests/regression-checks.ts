import assert from 'node:assert/strict'
import { exercises,vocabulary } from '../data/seed'
import { enrichExercises } from '../lib/curriculum-metadata'
import { buildAdaptiveRecommendation,buildAdaptiveReviewDeck } from '../lib/adaptive-curriculum'
import { getVocabularyStatus } from '../lib/learner-status'
import { defaultProgress,queueTransfers,resetLearningProgress,scheduleReview,updateMastery } from '../lib/storage'
import { mergeProgress } from '../lib/cloud-sync'
import { isExerciseEligible,singularVerbIntroForVocabulary,verbFormKey } from '../lib/curriculum-access'
import { buildExamPlan,EXAM_CONFIG } from '../lib/exam-planner'
import { stableChoiceOptions,validateExerciseSet } from '../lib/exercise-integrity'
import { buildVerbPracticeExercises,verbFormStatus } from '../lib/verb-learning'
import type { Exercise,UserProgress,Vocabulary } from '../types'

function fresh(overrides:Partial<UserProgress>={}):UserProgress{return {...structuredClone(defaultProgress),preferences:{...defaultProgress.preferences},...overrides}}
const enriched=enrichExercises(exercises),now=Date.now()
const choice:Exercise={id:'t-choice',lesson:1,type:'choice',prompt:'x',answer:'A',alternatives:['B'],vocabularyIds:['v001'],grammarRuleIds:[],skillTargets:['recognition']}
const produce:Exercise={id:'t-produce',lesson:1,type:'translate-de-sl',prompt:'x',answer:'Živjo',vocabularyIds:['v001'],grammarRuleIds:['greeting-basic'],skillTargets:['production']}
let p=fresh({introducedWords:['v001']});assert.equal(getVocabularyStatus('v001',p),'eingeführt');let m=updateMastery({},choice,true,3000,0);p={...p,mastery:m};assert.notEqual(getVocabularyStatus('v001',p),'sicher');assert.equal(m['vocab:v001'].activeCorrect,0)
const passive=updateMastery({},choice,true,3000,0)['vocab:v001'],active=updateMastery({},produce,true,3000,0)['vocab:v001'];assert.equal(active.activeCorrect,1);assert.equal(passive.passiveCorrect,1);assert.ok(active.score>=passive.score)
const noHint=updateMastery({},produce,true,3000,0)['vocab:v001'].score,withHint=updateMastery({},produce,true,3000,1)['vocab:v001'].score,slow=updateMastery({},produce,true,50000,0)['vocab:v001'].score;assert.ok(noHint>withHint);assert.ok(noHint>slow)
let queue=queueTransfers([],produce,false,4);assert.ok(queue.length>0);const transfer={...produce,id:'transfer',transferSourceExerciseId:produce.id,transferRuleId:'greeting-basic'};queue=queueTransfers(queue,transfer,true,8);assert.equal(queue.length,0)
let reviews=scheduleReview([],'vocab:v001',true);reviews=scheduleReview(reviews,'vocab:v001',true);assert.equal(reviews[0].intervalIndex,1);reviews=scheduleReview(reviews,'vocab:v001',false);assert.equal(reviews[0].intervalIndex,0)
const local=fresh({mastery:{'grammar:dual-masculine-numeral':{key:'grammar:dual-masculine-numeral',kind:'grammar',score:.72,attempts:5,correct:4,lastSeen:now}},updatedAt:now,preferencesUpdatedAt:now}),cloud=fresh({mastery:{'grammar:dual-masculine-numeral':{key:'grammar:dual-masculine-numeral',kind:'grammar',score:.58,attempts:4,correct:3,lastSeen:now-10000}},updatedAt:now-10000,preferencesUpdatedAt:now-10000});assert.equal(mergeProgress(local,cloud).mastery['grammar:dual-masculine-numeral'].score,.72)

const integrityIssues=validateExerciseSet(exercises,vocabulary);assert.deepEqual(integrityIssues,[],`Exercise integrity issues: ${JSON.stringify(integrityIssues)}`)
const shuffled:Exercise={id:'shuffle',lesson:1,type:'choice',prompt:'ti + imeti',answer:'imaš',alternatives:['imam','ima','imamo']};const optionsA=stableChoiceOptions(shuffled,'session-a'),optionsB=stableChoiceOptions(shuffled,'session-a');assert.deepEqual(optionsA,optionsB);assert.equal(optionsA.filter(o=>o.correct).length,1);assert.equal(optionsA.find(o=>o.correct)?.text,'imaš')

const e08=enriched.find(e=>e.id==='e08')!,e08Words=e08.vocabularyIds||[],imetiKey=verbFormKey({verbId:'imeti',person:1,number:'singular'})
const merelyIntroduced=fresh({introducedWords:e08Words,introducedGrammarRules:['number-basics','dual-masculine-numeral','accusative-family','verb-first-person'],introducedVerbForms:[imetiKey]});assert.equal(isExerciseEligible(e08,merelyIntroduced),false)
const grammarUnlocked=fresh({...merelyIntroduced,mastery:{[`verb:${imetiKey}`]:{key:`verb:${imetiKey}`,kind:'verb',score:.75,attempts:3,correct:3,activeCorrect:2,lastSeen:now}}});assert.equal(isExerciseEligible(e08,grammarUnlocked),true)

const due=fresh({preferences:{...defaultProgress.preferences,onboardingCompleted:true},introducedWords:['v001'],reviews:[{key:'vocab:v001',status:'unsicher',intervalIndex:0,dueAt:0,updatedAt:1}]});assert.equal(buildAdaptiveRecommendation(due,[choice],vocabulary,1,now).kind,'review')
const lockedWeak=fresh({preferences:{...defaultProgress.preferences,onboardingCompleted:true},mastery:{'grammar:dual-masculine-numeral':{key:'grammar:dual-masculine-numeral',kind:'grammar',score:.3,attempts:3,correct:1,lastSeen:now}}});assert.equal(buildAdaptiveRecommendation(lockedWeak,enriched,vocabulary,1,now).kind,'new-content')
const unlockedWeak=fresh({...grammarUnlocked,preferences:{...defaultProgress.preferences,onboardingCompleted:true},mastery:{...grammarUnlocked.mastery,'grammar:dual-masculine-numeral':{key:'grammar:dual-masculine-numeral',kind:'grammar',score:.3,attempts:3,correct:1,lastSeen:now}}});assert.equal(buildAdaptiveRecommendation(unlockedWeak,enriched,vocabulary,2,now).title,'Grammatik gezielt festigen');assert.ok(buildAdaptiveReviewDeck(unlockedWeak,enriched,8,now).every(ex=>isExerciseEligible(ex,unlockedWeak)))

const learned=fresh({introducedWords:['v001'],introducedGrammarRules:['greeting-basic'],wordsLearned:['v001'],completedLessons:[1],preferences:{...defaultProgress.preferences,dailyGoalMinutes:20},updatedAt:now-100}),reset=resetLearningProgress(learned);assert.equal(reset.introducedWords.length,0);assert.equal(reset.introducedGrammarRules.length,0);assert.equal(reset.preferences.dailyGoalMinutes,20);const staleCloud=fresh({introducedWords:['v001'],completedLessons:[1],updatedAt:(reset.resetAt||now)-1000});assert.equal(mergeProgress(reset,staleCloud).introducedWords.length,0)

const imetiIntro=singularVerbIntroForVocabulary(['v032','v033'])[0];assert.equal(imetiIntro.infinitiveDe,'haben');assert.deepEqual(imetiIntro.forms.map(f=>f.person),[1,2,3]);assert.deepEqual(imetiIntro.forms.map(f=>f.translationDe),['ich habe','du hast','er / sie hat'])
const verbDeck=buildVerbPracticeExercises(1,imetiIntro);assert.equal(verbDeck.length,9);assert.equal(verbDeck.filter(e=>e.requiredVerbForms?.[0].person===1).length,3);assert.ok(verbDeck.some(e=>e.type==='choice'));assert.ok(verbDeck.filter(e=>e.skillTargets?.includes('production')).length>=6);assert.deepEqual(validateExerciseSet(verbDeck),[])
let verbProgress=fresh({introducedVerbForms:imetiIntro.keys});const firstPersonDeck=verbDeck.filter(e=>e.requiredVerbForms?.[0].person===1);for(const ex of firstPersonDeck)verbProgress={...verbProgress,mastery:updateMastery(verbProgress.mastery,ex,true,3000,0)};assert.equal(verbFormStatus(verbProgress,{verbId:'imeti',person:1,number:'singular'}),'KNOWN');assert.equal(verbFormStatus(verbProgress,{verbId:'imeti',person:2,number:'dual'}),'LOCKED')

const examVocab:Vocabulary[]=[{id:'tv1',sl:'test',de:'Test',partOfSpeech:'Substantiv',category:'Test',example:'Test.',exampleDe:'Test.',lesson:99}],examExercises:Exercise[]=Array.from({length:14},(_,i)=>({id:`exam-${i}`,lesson:99,type:i%3===0?'choice':'translate-de-sl',prompt:`Prüfungsfrage ${i}`,answer:`odgovor ${i}`,alternatives:i%3===0?['x','y']:undefined,vocabularyIds:['tv1'],grammarRuleIds:[],skillTargets:[i%3===0?'recognition':'production']})),examProgress=fresh({introducedWords:['tv1'],preferences:{...defaultProgress.preferences,onboardingCompleted:true,pace:'normal',dailyGoalMinutes:10}})
const checkpoint=buildExamPlan({kind:'checkpoint',lessonId:99,exercises:examExercises,vocabulary:examVocab,progress:examProgress,seed:11,targetSize:EXAM_CONFIG.checkpoint.default}),finalA=buildExamPlan({kind:'final',lessonId:99,exercises:examExercises,vocabulary:examVocab,progress:examProgress,seed:11,targetSize:EXAM_CONFIG.final.default}),finalB=buildExamPlan({kind:'final',lessonId:99,exercises:examExercises,vocabulary:examVocab,progress:examProgress,seed:29,targetSize:EXAM_CONFIG.final.default});assert.equal(checkpoint.length,6);assert.equal(finalA.length,12);assert.equal(new Set(finalA.map(e=>e.id)).size,finalA.length);assert.ok(new Set(finalA.map(e=>e.type)).size>=2);assert.notDeepEqual(finalA.slice(0,2).map(e=>e.id),finalB.slice(0,2).map(e=>e.id));for(const planned of finalA){const original=examExercises.find(e=>e.id===planned.id);if(original){assert.equal(planned.prompt,original.prompt);assert.equal(planned.answer,original.answer)}}

console.log('Regression checks passed')
