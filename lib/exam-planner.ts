import { Exercise, UserProgress, Vocabulary } from '@/types'
import { isExerciseEligible } from '@/lib/curriculum-access'
import { enrichExercise } from '@/lib/curriculum-metadata'
import { generatedExercisesForWord } from '@/lib/learning-flow'

export const EXAM_CONFIG = {
  checkpoint: { min: 4, default: 6, max: 7 },
  final: { min: 10, default: 12, max: 15 }
} as const

export type ExamKind = 'checkpoint' | 'final'

type PlanOptions = {
  kind: ExamKind
  lessonId: number
  exercises: Exercise[]
  vocabulary: Vocabulary[]
  progress: UserProgress
  seed?: number
  targetSize?: number
}

function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n))}

export function examSize(kind:ExamKind,progress:UserProgress,newContentCount=0,errorCount=0){
  const cfg=EXAM_CONFIG[kind]
  if(kind==='final'){
    const paceBonus=progress.preferences.pace==='intensiv'?2:progress.preferences.pace==='ruhig'?-1:0
    const goalBonus=progress.preferences.dailyGoalMinutes>=20?1:0
    return clamp(cfg.default+paceBonus+goalBonus,cfg.min,cfg.max)
  }
  const paceBonus=progress.preferences.pace==='intensiv'?1:progress.preferences.pace==='ruhig'?-1:0
  const contentBonus=newContentCount>=3?1:0
  const errorBonus=errorCount>=2?1:0
  return clamp(cfg.default+paceBonus+contentBonus+errorBonus,cfg.min,cfg.max)
}

function hash(text:string){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rotate<T>(items:T[],offset:number){if(!items.length)return items;const n=((offset%items.length)+items.length)%items.length;return [...items.slice(n),...items.slice(0,n)]}
function promptSignature(ex:Exercise){return ex.prompt.toLocaleLowerCase('sl').replace(/[^a-z0-9čšžćđäöüß ]/gi,' ').replace(/\s+/g,' ').trim()}
function vocabKeys(ex:Exercise){return ex.vocabularyIds||[]}
function grammarKeys(ex:Exercise){return ex.grammarRuleIds||[]}
function typeGroup(ex:Exercise){if(ex.type==='choice')return 'recognition';if(ex.skillTargets?.includes('listening'))return 'listening';if(ex.skillTargets?.includes('production'))return 'production';return ex.type}

function candidatePool(options:PlanOptions){
  const {lessonId,exercises,vocabulary,progress,kind}=options
  const curated=exercises.filter(e=>e.lesson===lessonId).map(enrichExercise)
  if(kind==='checkpoint') return curated.filter(e=>isExerciseEligible(e,progress))

  const lessonWords=vocabulary.filter(v=>v.lesson===lessonId && progress.introducedWords.includes(v.id))
  const generated=lessonWords.flatMap(w=>generatedExercisesForWord(w,lessonWords)).map(enrichExercise)
  const combined=[...curated,...generated]
  return combined.filter(e=>isExerciseEligible(e,progress))
}

export function buildExamPlan(options:PlanOptions):Exercise[]{
  const cfg=EXAM_CONFIG[options.kind]
  const requested=clamp(options.targetSize??examSize(options.kind,options.progress),cfg.min,cfg.max)
  const pool=candidatePool(options)
  if(!pool.length)return []

  const recent=(options.progress.recentAttempts||[]).slice(-10)
  const recentIds=new Set(recent.map(a=>a.exerciseId))
  const recentExercises=pool.filter(e=>recentIds.has(e.id))
  const recentVocab=new Set(recentExercises.flatMap(vocabKeys))
  const recentGrammar=new Set(recentExercises.flatMap(grammarKeys))
  const seed=options.seed??Date.now()

  const scored=pool.map(ex=>{
    let score=0
    if(!recentIds.has(ex.id))score+=30
    if(!(ex.vocabularyIds||[]).some(id=>recentVocab.has(id)))score+=8
    if(!(ex.grammarRuleIds||[]).some(id=>recentGrammar.has(id)))score+=8
    if(ex.skillTargets?.includes('production'))score+=6
    if(ex.type==='choice')score+=2
    const weak=[...(ex.vocabularyIds||[]).map(id=>options.progress.mastery?.[`vocab:${id}`]?.score),...(ex.grammarRuleIds||[]).map(id=>options.progress.mastery?.[`grammar:${id}`]?.score)].filter((n):n is number=>typeof n==='number')
    if(weak.some(n=>n<.65))score+=10
    score+=(hash(`${ex.id}:${seed}`)%1000)/1000
    return {ex,score}
  }).sort((a,b)=>b.score-a.score)

  const rotated=rotate(scored,seed%Math.max(1,Math.min(5,scored.length)))
  const chosen:Exercise[]=[]
  const usedIds=new Set<string>(),usedPrompts=new Set<string>(),typeCounts=new Map<string,number>(),vocabCounts=new Map<string,number>(),grammarCounts=new Map<string,number>()
  const maxPerKey=Math.max(2,Math.ceil(requested*.25))

  function canAdd(ex:Exercise,relaxed=false){
    if(usedIds.has(ex.id)||usedPrompts.has(promptSignature(ex)))return false
    if(!relaxed){
      if((ex.vocabularyIds||[]).some(id=>(vocabCounts.get(id)||0)>=maxPerKey))return false
      if((ex.grammarRuleIds||[]).some(id=>(grammarCounts.get(id)||0)>=maxPerKey))return false
    }
    return true
  }
  function add(ex:Exercise){
    chosen.push(ex);usedIds.add(ex.id);usedPrompts.add(promptSignature(ex));const group=typeGroup(ex);typeCounts.set(group,(typeCounts.get(group)||0)+1)
    for(const id of ex.vocabularyIds||[])vocabCounts.set(id,(vocabCounts.get(id)||0)+1)
    for(const id of ex.grammarRuleIds||[])grammarCounts.set(id,(grammarCounts.get(id)||0)+1)
  }

  // First pass deliberately spreads exercise/skill types.
  for(const group of ['production','recognition','listening']){
    const found=rotated.find(x=>typeGroup(x.ex)===group&&canAdd(x.ex))
    if(found)add(found.ex)
  }
  for(const {ex} of rotated){if(chosen.length>=requested)break;if(canAdd(ex))add(ex)}
  for(const {ex} of rotated){if(chosen.length>=requested)break;if(canAdd(ex,true))add(ex)}

  // Rotate the finished plan as well so question 1/2 do not become fixed just because
  // the diversity pass always starts with the same skill group. The plan is stable for one seed.
  return rotate(chosen,hash(`exam:${seed}:${options.lessonId}:${options.kind}`)%Math.max(1,chosen.length)).slice(0,requested)
}
