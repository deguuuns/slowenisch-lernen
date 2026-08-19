import { buildAdaptiveRecommendation, buildAdaptiveReviewDeck } from '@/lib/adaptive-curriculum'
import { Exercise, UserProgress, Vocabulary } from '@/types'

const base:UserProgress={completedLessons:[],streak:1,introducedWords:[],wordsLearned:[],secureWords:[],mistakes:[],reviews:[],speakingMinutes:0,listeningMinutes:0,mastery:{}}
const vocab:Vocabulary[]=[{id:'v1',sl:'brat',de:'Bruder',partOfSpeech:'Substantiv',category:'Familie',example:'Imam brata.',exampleDe:'Ich habe einen Bruder.',lesson:1}]
const ex:Exercise[]=[{id:'e1',lesson:1,type:'translate-de-sl',prompt:'Bruder',answer:'brat',vocabularyIds:['v1']},{id:'e2',lesson:1,type:'choice',prompt:'Bruder',answer:'brat',alternatives:['sestra'],vocabularyIds:['v1']}]

function assert(ok:boolean,message:string){if(!ok)throw new Error(`Adaptive curriculum check failed: ${message}`)}

export function runAdaptiveCurriculumChecks(){
  const due={...base,reviews:[{key:'e1',status:'unsicher' as const,dueAt:0,intervalIndex:0}]}
  assert(buildAdaptiveRecommendation(due,ex,vocab,1,1).kind==='review','due reviews must win')

  const weak={...base,mastery:{'vocab:v1':{key:'vocab:v1',kind:'vocabulary' as const,score:.3,attempts:3,correct:1,lastSeen:1}}}
  assert(buildAdaptiveRecommendation(weak,ex,vocab,1,1).kind==='strengthen','weak mastery must trigger strengthening')
  assert(buildAdaptiveReviewDeck(weak,ex,10,1).some(x=>x.id==='e1'),'weak vocabulary must surface linked exercise')

  const fresh=buildAdaptiveRecommendation(base,ex,vocab,1,1)
  assert(fresh.kind==='new-content','fresh learner should receive new content')
  assert(fresh.focusKeys.includes('vocab:v1'),'new content should point at unseen vocabulary')
}
