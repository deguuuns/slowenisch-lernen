import { buildAdaptiveRecommendation,buildAdaptiveReviewDeck } from '@/lib/adaptive-curriculum'
import { defaultPreferences } from '@/lib/storage'
import { Exercise,UserProgress,Vocabulary } from '@/types'

const base:UserProgress={completedLessons:[],streak:1,introducedWords:[],introducedGrammarRules:[],introducedVerbForms:[],wordsLearned:[],secureWords:[],mistakes:[],reviews:[],speakingMinutes:0,listeningMinutes:0,mastery:{},recentAttempts:[],transferQueue:[],preferences:{...defaultPreferences,onboardingCompleted:true},updatedAt:0,preferencesUpdatedAt:0}
const unlocked:UserProgress={...base,introducedWords:['v1'],introducedGrammarRules:['dual-masculine']}
const vocab:Vocabulary[]=[{id:'v1',sl:'brat',de:'Bruder',partOfSpeech:'Substantiv',category:'Familie',example:'Imam brata.',exampleDe:'Ich habe einen Bruder.',lesson:1}]
const ex:Exercise[]=[{id:'e1',lesson:1,type:'translate-de-sl',prompt:'Ich habe zwei Brüder.',answer:'Imam dva brata.',vocabularyIds:['v1'],grammarRuleIds:['dual-masculine'],skillTargets:['production']},{id:'e2',lesson:1,type:'translate-de-sl',prompt:'Bruder im Dual',answer:'dva brata',vocabularyIds:['v1'],grammarRuleIds:['dual-masculine'],skillTargets:['production']},{id:'e3',lesson:1,type:'choice',prompt:'Bruder',answer:'brat',alternatives:['sestra'],vocabularyIds:['v1'],grammarRuleIds:[],skillTargets:['recognition']}]
function assert(ok:boolean,message:string){if(!ok)throw new Error(`Adaptive curriculum check failed: ${message}`)}
export function runAdaptiveCurriculumChecks(){
 const due={...unlocked,reviews:[{key:'e1',status:'unsicher' as const,dueAt:0,intervalIndex:0,updatedAt:1}]};assert(buildAdaptiveRecommendation(due,ex,vocab,1,1).kind==='review','eligible due reviews must win')
 const weak={...unlocked,mastery:{'vocab:v1':{key:'vocab:v1',kind:'vocabulary' as const,score:.3,attempts:3,correct:1,lastSeen:1}}};assert(buildAdaptiveRecommendation(weak,ex,vocab,1,1).kind==='strengthen','introduced weak mastery must trigger strengthening')
 const lockedWeak={...base,mastery:{'grammar:dual-masculine':{key:'grammar:dual-masculine',kind:'grammar' as const,score:.2,attempts:4,correct:0,lastSeen:1}}};assert(buildAdaptiveRecommendation(lockedWeak,ex,vocab,1,1).kind==='new-content','locked grammar must not be treated as weak practice')
 const slow={...unlocked,recentAttempts:[1,2,3,4].map(n=>({exerciseId:'e1',correct:true,responseMs:35000+n,hintsUsed:n===1?1:0,occurredAt:n}))};assert(buildAdaptiveRecommendation(slow,ex,vocab,1,1).title.includes('flüssiger'),'slow/helped correct answers should trigger fluency practice')
 const transfer={...unlocked,recentAttempts:[1,2,3,4].map(n=>({exerciseId:'e1',correct:true,responseMs:5000,hintsUsed:0,occurredAt:n})),transferQueue:[{sourceExerciseId:'e1',grammarRuleId:'dual-masculine',dueAfter:3,createdAt:1}]};assert(buildAdaptiveRecommendation(transfer,ex,vocab,1,1).focusKeys.includes('grammar:dual-masculine'),'due unlocked grammar transfer should outrank new content');assert(buildAdaptiveReviewDeck(transfer,ex,10,1).some(x=>x.id==='e2'),'transfer must use a different eligible exercise with same grammar rule')
 const fresh=buildAdaptiveRecommendation(base,ex,vocab,1,1);assert(fresh.kind==='new-content','fresh learner should receive new content')
}
