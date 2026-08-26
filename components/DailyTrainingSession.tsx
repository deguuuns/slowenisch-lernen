'use client'

import { Dispatch, SetStateAction, useState } from 'react'
import { Check, ChevronLeft, Headphones, Mic2, RotateCcw, Sparkles } from 'lucide-react'
import ExerciseDeck from '@/components/ExerciseDeck'
import LessonFlow from '@/components/LessonFlow'
import ListeningPractice from '@/components/ListeningPractice'
import SpeechPractice, { SpeechResultMeta } from '@/components/SpeechPractice'
import { createExerciseSession } from '@/lib/exercise-session'
import { buildDailyTrainingPlan, exerciseTargetKeys, type DailyTrainingBlock, type DailyTrainingPlan } from '@/lib/daily-training'
import { buildSessionPlan, exercisesForPlan } from '@/lib/session-planner'
import { updateSkillMastery } from '@/lib/storage'
import type { Exercise, UserProgress, Vocabulary } from '@/types'

type ProgressSetter=Dispatch<SetStateAction<UserProgress>>
type ResultMeta={responseMs:number;hintsUsed:number}
type Props={progress:UserProgress;setProgress:ProgressSetter;exercises:Exercise[];vocabulary:Vocabulary[];activeLesson:number;onExerciseResult:(exercise:Exercise,correct:boolean,meta:ResultMeta)=>void;onFinish:()=>void}

const speakingPrompts:[string,string][]=[
  ['Kje si zdaj?','Zdaj sem v Sloveniji.'],
  ['Od kod si?','Sem iz Nemčije.'],
  ['Kje živiš?','Živim v Nemčiji.'],
  ['Kaj piješ?','Pijem vodo.'],
  ['Kaj potrebuješ?','Potrebujem pomoč.'],
]

function blockIcon(kind:DailyTrainingBlock['kind']){if(kind==='review')return RotateCcw;if(kind==='listening')return Headphones;if(kind==='speaking')return Mic2;return Sparkles}
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
  const [session]=useState(()=>createExerciseSession(block.kind==='review'?'review':'learning-block',selectBlockExercises(block,progress,exercises,activeLesson),`daily:${block.id}:${Date.now()}`))
  if(!session.exercises.length)return <div className="surface p-5 text-center"><div className="text-2xl">✓</div><h2 className="mt-2 text-xl font-black">Hier ist nichts offen</h2><p className="mt-1 text-sm text-slate-500">Wir gehen direkt zum nächsten Teil.</p><button className="btn-primary mt-4 w-full" onClick={onComplete}>Weiter</button></div>
  return <ExerciseDeck session={session} onResult={onResult} onComplete={onComplete}/>
}

export default function DailyTrainingSession({progress,setProgress,exercises,vocabulary,activeLesson,onExerciseResult,onFinish}:Props){
  const [plan]=useState<DailyTrainingPlan>(()=>buildDailyTrainingPlan(progress,exercises,activeLesson))
  const [blockIndex,setBlockIndex]=useState(0)
  const [finished,setFinished]=useState(false)
  const block=plan.blocks[blockIndex]
  const percent=finished?100:plan.blocks.length?Math.round((blockIndex/plan.blocks.length)*100):100

  function advance(){if(blockIndex>=plan.blocks.length-1){setFinished(true);return}setBlockIndex(index=>index+1);window.scrollTo({top:0,behavior:'smooth'})}
  function completeLesson(){const now=Date.now();setProgress(previous=>({...previous,completedLessons:Array.from(new Set([...previous.completedLessons,activeLesson])),updatedAt:now}));advance()}
  function speechResult(correct:boolean,_actual:string,meta:SpeechResultMeta){setProgress(previous=>{const hints=meta.replays+(meta.usedSlowAudio?1:0),spoken=meta.inputMode==='speech';let mastery=updateSkillMastery(previous.mastery||{},spoken?'speaking:spoken-response':'production:typed-fallback',correct,meta.responseMs,hints);mastery=updateSkillMastery(mastery,spoken?'speaking':'production',correct,meta.responseMs,hints);return {...previous,speakingMinutes:spoken?+(previous.speakingMinutes+.2).toFixed(1):previous.speakingMinutes,mastery,updatedAt:Date.now()}})}

  if(!plan.blocks.length||finished)return <div className="mx-auto max-w-2xl py-6"><div className="surface p-6 text-center sm:p-8"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime-100 text-lime-800"><Check size={28}/></div><div className="eyebrow mt-5">Geschafft</div><h1 className="mt-1 text-3xl font-black">Training abgeschlossen</h1><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Dein Fortschritt ist gespeichert. Die nächste Runde passt sich wieder deinem Lernstand an.</p><button className="btn-primary mt-6 w-full sm:w-auto sm:min-w-56" onClick={onFinish}>Fortschritt ansehen</button></div></div>

  const Icon=blockIcon(block.kind)
  const speakingPrompt=speakingPrompts[blockIndex%speakingPrompts.length]
  return <div className="daily-training-screen">
    <div className="daily-training-status">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onFinish} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Training verlassen"><ChevronLeft size={21}/></button>
        <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3 text-xs font-bold"><span className="truncate text-slate-500">Teil {blockIndex+1} von {plan.blocks.length}</span><span className="shrink-0 text-slate-400">{Math.max(1,block.minutes)} Min.</span></div><div className="mt-1.5 flex items-center gap-2"><Icon size={16} className="shrink-0 text-lime-700"/><span className="truncate text-sm font-black">{block.title}</span></div></div>
      </div>
      <div className="progress-track mt-3"><div className="progress-fill" style={{width:`${percent}%`}}/></div>
    </div>
    <div className="daily-training-content">
      {block.kind==='lesson'?<LessonFlow key={`daily-lesson-${activeLesson}`} lessonId={activeLesson} progress={progress} setProgress={setProgress} onExerciseResult={onExerciseResult} onFinish={completeLesson}/>:block.kind==='listening'?<ListeningPractice vocabulary={vocabulary} progress={progress} onResult={onExerciseResult} onComplete={advance}/>:block.kind==='speaking'?<SpeechPractice key={`daily-speech-${block.id}`} prompt={speakingPrompt[0]} expected={speakingPrompt[1]} onResult={speechResult} onComplete={advance}/>:<ExerciseBlock key={block.id} block={block} progress={progress} exercises={exercises} activeLesson={activeLesson} onResult={onExerciseResult} onComplete={advance}/>} 
    </div>
  </div>
}
