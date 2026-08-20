import { buildAdaptiveRecommendation,buildAdaptiveReviewDeck } from '@/lib/adaptive-curriculum'
import { defaultPreferences } from '@/lib/storage'
import { Exercise,UserProgress,Vocabulary } from '@/types'

const base:UserProgress={completedLessons:[],streak:1,introducedWords:[],wordsLearned:[],secureWords:[],mistakes:[],reviews:[],speakingMinutes:0,listeningMinutes:0,mastery:{},recentAttempts:[],transferQueue:[],preferences:{...defaultPreferences,onboardingCompleted:true},updatedAt:0,preferencesUpdatedAt:0}
const vocab:Vocabulary[]=[{id:'v1',sl:'brat',de:'Bruder',partOfSpeech:'Substantiv',category:'Familie',example:'Imam brata.',exampleDe:'Ich habe einen Bruder.',lesson:1}]
const ex:Exercise[]=[{id:'e1',lesson:1,type:'translate-de-sl',prompt:'Ich habe zwei Brüder.',answer:'Imam dva brata.',vocabularyIds:['v1'],grammarRuleIds:['dual-masculine'],skillTargets:['production']},{id:'e2',lesson:1,type:'translate-de-sl',prompt:'Ich habe zwei Söhne.',answer:'Imam dva sina.',grammarRuleIds:['dual-masculine'],skillTargets:['production']},{id:'e3',lesson:1,type:'choice',prompt:'Bruder',answer:'brat',alternatives:['sestra'],vocabularyIds:['v1'],skillTargets:['recognition']}]
function assert(ok:boolean,message:string){if(!ok)throw new Error(`Adaptive curriculum check failed: ${message}`)}
export function runAdaptiveCurriculumChecks(){
 const due={...base,reviews:[{key:'e1',status:'unsicher' as const,dueAt:0,intervalIndex:0,updatedAt:1}]};assert(buildAdaptiveRecommendation(due,ex,vocab,1,1).kind==='review','due reviews must win')
 const weak={...base,mastery:{'vocab:v1':{key:'vocab:v1',kind:'vocabulary' as const,score:.3,attempts:3,correct:1,lastSeen:1}}};assert(buildAdaptiveRecommendation(weak,ex,vocab,1,1).kind==='strengthen','weak mastery must trigger strengthening')
 const slow={...base,recentAttempts:[1,2,3,4].map(n=>({exerciseId:'e1',correct:true,responseMs:35000+n,hintsUsed:n===1?1:0,occurredAt:n}))};assert(buildAdaptiveRecommendation(slow,ex,vocab,1,1).title.includes('flüssiger'),'slow/helped correct answers should trigger fluency practice')
 const transfer={...base,recentAttempts:[1,2,3,4].map(n=>({exerciseId:'e1',correct:true,responseMs:5000,hintsUsed:0,occurredAt:n})),transferQueue:[{sourceExerciseId:'e1',grammarRuleId:'dual-masculine',dueAfter:3,createdAt:1}]};assert(buildAdaptiveRecommendation(transfer,ex,vocab,1,1).focusKeys.includes('grammar:dual-masculine'),'due grammar transfer should outrank new content');assert(buildAdaptiveReviewDeck(transfer,ex,10,1).some(x=>x.id==='e2'),'transfer must use a different exercise with same grammar rule')
 const fresh=buildAdaptiveRecommendation(base,ex,vocab,1,1);assert(fresh.kind==='new-content','fresh learner should receive new content')
}
