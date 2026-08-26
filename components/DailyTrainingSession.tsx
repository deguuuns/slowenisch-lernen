'use client'

import { Dispatch, SetStateAction, useState } from 'react'
import { Check, Headphones, Mic2, RotateCcw, Sparkles } from 'lucide-react'
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

const speakingPrompts:[string,string][]=[['Kje si zdaj?','Zdaj sem v Sloveniji.'],['Od kod si?','Sem iz Nemčije.'],['Kje živiš?','Živim v Nemčiji.'],['Kaj piješ?','Pijem vodo.'],['Kaj potrebuješ?','Potrebujem pomoč.']]
function blockIcon(kind:DailyTrainingBlock['kind']){if(kind==='review')return RotateCcw;if(kind==='listening')return Headphones;if(kind==='speaking')return Mic2;return Sparkles}
function intersects(exercise:Exercise,targets:Set<string>){return exerciseTargetKeys(exercise).some(key=>targets.has(key))}
function selectBlockExercises(block:DailyTrainingBlock,progress:UserProgress,rawExercises:Exercise[],activeLesson:number){const sessionPlan=buildSessionPlan(progress,rawExercises,activeLesson),planned=exercisesForPlan(sessionPlan,rawExercises),limit=Math.max(1,Math.min(6,Math.round(block.minutes*.8)));let selected:Exercise[]=[];if(block.kind==='review'){const now=Date.now(),due=new Set(progress.reviews.filter(item=>item.dueAt<=now).map(item=>item.key));selected=planned.filter(exercise=>intersects(exercise,due))}else if(block.kind==='weakness'){const targets=new Set(block.targetKeys);selected=planned.filter(exercise=>intersects(exercise,targets))}if(!selected.length)selected=planned;return selected.slice(0,limit)}
function ExerciseBlock({block,progress,exercises,activeLesson,onResult,onComplete}:{block:DailyTrainingBlock;progress:UserProgress;exercises:Exercise[];activeLesson:number;onResult:(exercise:Exercise,correct:boolean,meta:ResultMeta)=>void;onComplete:()=>void}){const [session]=useState(()=>createExerciseSession(block.kind==='review'?'review':'learning-block',selectBlockExercises(block,progress,exercises,activeLesson),`daily:${block.id}:${Date.now()}`));if(!session.exercises.length)return <div className="card min-w-0"><b>Für diesen Block ist gerade nichts offen.</b><button className="btn-primary mt-4 w-full justify-center" onClick={onComplete}>Weiter</button></div>;return <ExerciseDeck session={session} onResult={onResult} onComplete={onComplete}/>}

export default function DailyTrainingSession({progress,setProgress,exercises,vocabulary,activeLesson,onExerciseResult,onFinish}:Props){
 const [plan]=useState<DailyTrainingPlan>(()=>buildDailyTrainingPlan(progress,exercises,activeLesson)),[blockIndex,setBlockIndex]=useState(0),[finished,setFinished]=useState(false);const block=plan.blocks[blockIndex],percent=finished?100:plan.blocks.length?Math.round((blockIndex/plan.blocks.length)*100):100
 function advance(){if(blockIndex>=plan.blocks.length-1){setFinished(true);return}setBlockIndex(index=>index+1)}
 function completeLesson(){const now=Date.now();setProgress(previous=>({...previous,completedLessons:Array.from(new Set([...previous.completedLessons,activeLesson])),updatedAt:now}));advance()}
 function speechResult(correct:boolean,_actual:string,meta:SpeechResultMeta){setProgress(previous=>{const hints=meta.replays+(meta.usedSlowAudio?1:0),spoken=meta.inputMode==='speech';let mastery=updateSkillMastery(previous.mastery||{},spoken?'speaking:spoken-response':'production:typed-fallback',correct,meta.responseMs,hints);mastery=updateSkillMastery(mastery,spoken?'speaking':'production',correct,meta.responseMs,hints);return {...previous,speakingMinutes:spoken?+(previous.speakingMinutes+.2).toFixed(1):previous.speakingMinutes,mastery,updatedAt:Date.now()}})}
 if(!plan.blocks.length||finished)return <div className="daily-training-screen"><div className="card border-2 border-lime-300"><div className="text-sm font-bold text-lime-700">Tagestraining abgeschlossen</div><h2 className="mt-2 text-2xl font-black">Für heute geschafft.</h2><p className="mt-2 text-slate-600 dark:text-slate-300">Wiederholung, Schwerpunkt und aktiver Transfer sind erledigt.</p><button className="btn-primary mt-5 w-full justify-center" onClick={onFinish}>Fortschritt ansehen</button></div></div>
 const Icon=blockIcon(block.kind),speakingPrompt=speakingPrompts[blockIndex%speakingPrompts.length]
 return <div className="daily-training-screen">
   <div className="daily-training-status">
     <div className="flex min-w-0 items-center gap-2"><Icon size={17} className="shrink-0 text-lime-700"/><div className="min-w-0"><div className="truncate text-sm font-black">{block.title}</div><div className="text-xs text-slate-500">Block {blockIndex+1}/{plan.blocks.length} · ca. {block.minutes} Min.</div></div></div>
     <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-lime-400 transition-all" style={{width:`${percent}%`}}/></div>
   </div>
   <div className="daily-training-content">{block.kind==='lesson'?<LessonFlow key={`daily-lesson-${activeLesson}`} lessonId={activeLesson} progress={progress} setProgress={setProgress} onExerciseResult={onExerciseResult} onFinish={completeLesson}/>:block.kind==='listening'?<ListeningPractice vocabulary={vocabulary} progress={progress} onResult={onExerciseResult} onComplete={advance}/>:block.kind==='speaking'?<SpeechPractice key={`daily-speech-${block.id}`} prompt={speakingPrompt[0]} expected={speakingPrompt[1]} onResult={speechResult} onComplete={advance}/>:<ExerciseBlock key={block.id} block={block} progress={progress} exercises={exercises} activeLesson={activeLesson} onResult={onExerciseResult} onComplete={advance}/>}</div>
 </div>
}
