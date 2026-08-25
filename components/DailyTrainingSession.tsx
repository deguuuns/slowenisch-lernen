'use client'

import { Dispatch, SetStateAction, useState } from 'react'
import { Check, Headphones, Mic2, RotateCcw, Sparkles } from 'lucide-react'
import ExerciseDeck from '@/components/ExerciseDeck'
import LessonFlow from '@/components/LessonFlow'
import ListeningPractice from '@/components/ListeningPractice'
import SpeechPractice, { SpeechResultMeta } from '@/components/SpeechPractice'
import { createExerciseSession } from '@/lib/exercise-session'
import { buildDailyTrainingPlan, dailyTrainingLabel, exerciseTargetKeys, type DailyTrainingBlock, type DailyTrainingPlan } from '@/lib/daily-training'
import { buildSessionPlan, exercisesForPlan } from '@/lib/session-planner'
import { updateSkillMastery } from '@/lib/storage'
import type { Exercise, UserProgress, Vocabulary } from '@/types'

type ProgressSetter=Dispatch<SetStateAction<UserProgress>>
type ResultMeta={responseMs:number;hintsUsed:number}

type Props={
  progress:UserProgress
  setProgress:ProgressSetter
  exercises:Exercise[]
  vocabulary:Vocabulary[]
  activeLesson:number
  onExerciseResult:(exercise:Exercise,correct:boolean,meta:ResultMeta)=>void
  onFinish:()=>void
}

const speakingPrompts:[string,string][]=[
  ['Kje si zdaj?','Zdaj sem v Sloveniji.'],
  ['Od kod si?','Sem iz Nemčije.'],
  ['Kje živiš?','Živim v Nemčiji.'],
  ['Kaj piješ?','Pijem vodo.'],
  ['Kaj potrebuješ?','Potrebujem pomoč.'],
]

function blockIcon(kind:DailyTrainingBlock['kind']){
  if(kind==='review')return RotateCcw
  if(kind==='listening')return Headphones
  if(kind==='speaking')return Mic2
  return Sparkles
}

function intersects(exercise:Exercise,targets:Set<string>){return exerciseTargetKeys(exercise).some(key=>targets.has(key))}

function selectBlockExercises(block:DailyTrainingBlock,progress:UserProgress,rawExercises:Exercise[],activeLesson:number){
  const sessionPlan=buildSessionPlan(progress,rawExercises,activeLesson)
  const planned=exercisesForPlan(sessionPlan,rawExercises)
  const limit=Math.max(1,Math.min(6,Math.round(block.minutes*.8)))
  let selected:Exercise[]=[]

  if(block.kind==='review'){
    const now=Date.now(),due=new Set(progress.reviews.filter(item=>item.dueAt<=now).map(item=>item.key))
    selected=planned.filter(exercise=>intersects(exercise,due))
  }else if(block.kind==='weakness'){
    const targets=new Set(block.targetKeys)
    selected=planned.filter(exercise=>intersects(exercise,targets))
  }

  if(!selected.length)selected=planned
  return selected.slice(0,limit)
}

function ExerciseBlock({block,progress,exercises,activeLesson,onResult,onComplete}:{block:DailyTrainingBlock;progress:UserProgress;exercises:Exercise[];activeLesson:number;onResult:(exercise:Exercise,correct:boolean,meta:ResultMeta)=>void;onComplete:()=>void}){
  const [session]=useState(()=>{
    const selected=selectBlockExercises(block,progress,exercises,activeLesson)
    return createExerciseSession(block.kind==='review'?'review':'learning-block',selected,`daily:${block.id}:${Date.now()}`)
  })
  if(!session.exercises.length)return <div className="card min-w-0"><b>Für diesen Block ist gerade nichts offen.</b><p className="mt-2 text-sm text-slate-500">Der Tagesplan bleibt trotzdem zusammenhängend.</p><button className="btn-primary mt-4" onClick={onComplete}>Weiter</button></div>
  return <ExerciseDeck session={session} onResult={onResult} onComplete={onComplete}/>
}

export default function DailyTrainingSession({progress,setProgress,exercises,vocabulary,activeLesson,onExerciseResult,onFinish}:Props){
  const [plan]=useState<DailyTrainingPlan>(()=>buildDailyTrainingPlan(progress,exercises,activeLesson))
  const [blockIndex,setBlockIndex]=useState(0)
  const [finished,setFinished]=useState(false)
  const block=plan.blocks[blockIndex]
  const percent=finished?100:plan.blocks.length?Math.round((blockIndex/plan.blocks.length)*100):100

  function advance(){
    if(blockIndex>=plan.blocks.length-1){setFinished(true);return}
    setBlockIndex(index=>index+1)
  }

  function completeLesson(){
    const now=Date.now()
    setProgress(previous=>({...previous,completedLessons:Array.from(new Set([...previous.completedLessons,activeLesson])),updatedAt:now}))
    advance()
  }

  function speechResult(correct:boolean,_actual:string,meta:SpeechResultMeta){
    setProgress(previous=>{
      const hints=meta.replays+(meta.usedSlowAudio?1:0),spoken=meta.inputMode==='speech'
      let mastery=updateSkillMastery(previous.mastery||{},spoken?'speaking:spoken-response':'production:typed-fallback',correct,meta.responseMs,hints)
      mastery=updateSkillMastery(mastery,spoken?'speaking':'production',correct,meta.responseMs,hints)
      return {...previous,speakingMinutes:spoken?+(previous.speakingMinutes+.2).toFixed(1):previous.speakingMinutes,mastery,updatedAt:Date.now()}
    })
  }

  if(!plan.blocks.length||finished)return <div className="min-w-0 space-y-4"><div className="card min-w-0 border-2 border-lime-300"><div className="text-sm font-bold text-lime-700">Tagestraining abgeschlossen</div><h2 className="mt-2 text-2xl font-black">Für heute geschafft.</h2><p className="mt-2 text-slate-600 dark:text-slate-300">Wiederholung, Schwerpunkt und aktiver Transfer wurden als eine Sitzung abgearbeitet.</p><button className="btn-primary mt-5 w-full justify-center" onClick={onFinish}>Fortschritt ansehen</button></div></div>

  const Icon=blockIcon(block.kind)
  const speakingPrompt=speakingPrompts[blockIndex%speakingPrompts.length]

  return <div className="min-w-0 space-y-4">
    <div className="card min-w-0">
      <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold text-lime-700">Tageslernflow V2</div><h2 className="mt-1 text-2xl font-black">Eine Sitzung statt fünf Menüs</h2></div><div className="shrink-0 rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-800 dark:bg-lime-950 dark:text-lime-200">{dailyTrainingLabel(plan)}</div></div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{plan.loadReason}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full bg-lime-400 transition-all" style={{width:`${percent}%`}}/></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">{plan.blocks.map((item,index)=>{const ItemIcon=blockIcon(item.kind),done=index<blockIndex,current=index===blockIndex;return <div key={item.id} className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 ${current?'border-lime-400 bg-lime-50 dark:bg-lime-950/40':done?'border-slate-200 bg-slate-50 opacity-70 dark:border-slate-700 dark:bg-slate-900':'border-slate-200 dark:border-slate-700'}`}>{done?<Check size={18} className="shrink-0 text-lime-600"/>:<ItemIcon size={18} className="shrink-0"/>}<div className="min-w-0"><div className="truncate text-sm font-bold">{item.title}</div><div className="text-xs text-slate-500">ca. {item.minutes} Min.</div></div></div>})}</div>
    </div>

    <div className="card min-w-0 border border-lime-200 dark:border-lime-900">
      <div className="flex items-center gap-2 text-sm font-bold text-lime-700 dark:text-lime-300"><Icon size={18}/>Block {blockIndex+1} von {plan.blocks.length}</div>
      <h3 className="mt-1 text-xl font-black">{block.title}</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{block.reason}</p>
    </div>

    {block.kind==='lesson'?<LessonFlow key={`daily-lesson-${activeLesson}`} lessonId={activeLesson} progress={progress} setProgress={setProgress} onExerciseResult={onExerciseResult} onFinish={completeLesson}/>:block.kind==='listening'?<ListeningPractice vocabulary={vocabulary} progress={progress} onResult={onExerciseResult} onComplete={advance}/>:block.kind==='speaking'?<SpeechPractice key={`daily-speech-${block.id}`} prompt={speakingPrompt[0]} expected={speakingPrompt[1]} onResult={speechResult} onComplete={advance}/>:<ExerciseBlock key={block.id} block={block} progress={progress} exercises={exercises} activeLesson={activeLesson} onResult={onExerciseResult} onComplete={advance}/>} 
  </div>
}
