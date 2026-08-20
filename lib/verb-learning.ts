import { Exercise, UserProgress, VerbFormRequirement } from '@/types'
import { singularVerbIntroForVocabulary, verbFormKey } from '@/lib/curriculum-access'

export const VERB_UNLOCK_THRESHOLDS={minAttemptsPerForm:2,minActiveCorrectPerForm:1,minimumScore:.7} as const

export type VerbLearningStatus='LOCKED'|'INTRODUCED'|'LEARNING'|'KNOWN'|'MASTERED'

export function verbFormMasteryKey(r:VerbFormRequirement){return `verb:${verbFormKey(r)}`}
export function verbFormStatus(progress:UserProgress,r:VerbFormRequirement):VerbLearningStatus{
 const key=verbFormKey(r),m=progress.mastery?.[verbFormMasteryKey(r)]
 if(!progress.introducedVerbForms.includes(key))return 'LOCKED'
 if(!m||m.attempts===0)return 'INTRODUCED'
 const active=m.activeCorrect||0
 if(m.attempts>=VERB_UNLOCK_THRESHOLDS.minAttemptsPerForm&&active>=VERB_UNLOCK_THRESHOLDS.minActiveCorrectPerForm&&m.score>=VERB_UNLOCK_THRESHOLDS.minimumScore){return m.score>=.9&&m.attempts>=4?'MASTERED':'KNOWN'}
 return 'LEARNING'
}
export function verbFormReadyForNormalPractice(progress:UserProgress,r:VerbFormRequirement){const s=verbFormStatus(progress,r);return s==='KNOWN'||s==='MASTERED'}

export function verbIntrosForVocabulary(ids:string[]){return singularVerbIntroForVocabulary(ids).map(v=>({...v,examples:verbExamples(v.verbId)}))}
function verbExamples(verbId:string){const map:Record<string,{sl:string;de:string}[]>={
 biti:[{sl:'Jaz sem tukaj.',de:'Ich bin hier.'},{sl:'Ti si doma.',de:'Du bist zu Hause.'},{sl:'Ona je tukaj.',de:'Sie ist hier.'}],
 imeti:[{sl:'Jaz imam čas.',de:'Ich habe Zeit.'},{sl:'Ti imaš čas.',de:'Du hast Zeit.'},{sl:'Ona ima kavo.',de:'Sie hat Kaffee.'}],
 iti:[{sl:'Jaz grem domov.',de:'Ich gehe nach Hause.'},{sl:'Ti greš domov.',de:'Du gehst nach Hause.'},{sl:'On gre domov.',de:'Er geht nach Hause.'}],
 delati:[{sl:'Jaz delam.',de:'Ich arbeite.'},{sl:'Ti delaš.',de:'Du arbeitest.'},{sl:'Ona dela.',de:'Sie arbeitet.'}],
 živeti:[{sl:'Jaz živim v Nemčiji.',de:'Ich lebe in Deutschland.'},{sl:'Ti živiš tukaj.',de:'Du lebst hier.'},{sl:'On živi v Sloveniji.',de:'Er lebt in Slowenien.'}],
 piti:[{sl:'Jaz pijem vodo.',de:'Ich trinke Wasser.'},{sl:'Ti piješ kavo.',de:'Du trinkst Kaffee.'},{sl:'Ona pije vodo.',de:'Sie trinkt Wasser.'}],
 jesti:[{sl:'Jaz jem.',de:'Ich esse.'},{sl:'Ti ješ.',de:'Du isst.'},{sl:'On je.',de:'Er isst.'}]
 };return map[verbId]||[]}

export function buildVerbPracticeExercises(lessonId:number,verb:{verbId:string;forms:{person:1|2|3;pronounSl:string;formSl:string;translationDe:string}[]}):Exercise[]{
 const allForms=verb.forms.map(f=>f.formSl)
 const out:Exercise[]=[]
 for(const f of verb.forms){const req:VerbFormRequirement={verbId:verb.verbId,person:f.person,number:'singular'};const other=allForms.filter(x=>x!==f.formSl)
  out.push({id:`verb-${verb.verbId}-${f.person}-choice`,lesson:lessonId,type:'choice',prompt:`${f.pronounSl} + ${verb.verbId}`,answer:f.formSl,alternatives:other,skillTargets:['recognition'],requiredVerbForms:[req],evaluationMode:'exact',generated:true,verbPractice:true})
  out.push({id:`verb-${verb.verbId}-${f.person}-produce`,lesson:lessonId,type:'translate-de-sl',prompt:f.translationDe,answer:`${f.pronounSl.replace(' / ona','')} ${f.formSl}`,acceptedAnswers:[f.formSl,`${f.pronounSl.split(' / ')[0]} ${f.formSl}`],skillTargets:['production'],requiredVerbForms:[req],evaluationMode:'acceptedVariants',generated:true,verbPractice:true})
 }
 return out
}

export function allVerbFormsReady(progress:UserProgress,requirements:VerbFormRequirement[]){return requirements.every(r=>verbFormReadyForNormalPractice(progress,r))}
