'use client'

import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { BookOpen, Brain, ChevronRight, Flame, GraduationCap, Home, LucideIcon, Mic2, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import AccountMenu from '@/components/AccountMenu'
import DailyTrainingSession from '@/components/DailyTrainingSession'
import ExerciseDeck from '@/components/ExerciseDeck'
import LessonFlow from '@/components/LessonFlow'
import Onboarding from '@/components/Onboarding'
import ProgressProfile from '@/components/ProgressProfile'
import SpeechPractice, { SpeechResultMeta } from '@/components/SpeechPractice'
import TutorChat from '@/components/TutorChat'
import VocabWorkspace from '@/components/VocabWorkspace'
import { exercises, lessons, vocabulary } from '@/data/curriculum'
import { CloudSession, ensureProfile, loadCloudProgress, loadSession, mergeProgress, saveCloudProgress } from '@/lib/cloud-sync'
import { buildDailyTrainingPlan } from '@/lib/daily-training'
import { createExerciseSession } from '@/lib/exercise-session'
import { reconcileVocabularyProgress } from '@/lib/learner-status'
import { buildSessionPlan, exercisesForPlan } from '@/lib/session-planner'
import { clearGuestProgress, defaultProgress, hasMeaningfulProgress, isActiveProduction, loadProgress, queueTransfers, recordAttempt, registerMistake, saveProgress, scheduleExerciseReviews, updateMastery, updateSkillMastery } from '@/lib/storage'
import { Exercise, LearnerPreferences, UserProgress } from '@/types'

type Tab='home'|'today'|'learn'|'practice'|'vocab'|'progress'
type ProgressSetter=Dispatch<SetStateAction<UserProgress>>
type NavTab=Exclude<Tab,'today'>
type NavItem={id:NavTab;label:string;icon:LucideIcon}
const nav:NavItem[]=[
  {id:'home',label:'Start',icon:Home},
  {id:'learn',label:'Lernen',icon:BookOpen},
  {id:'practice',label:'Üben',icon:Sparkles},
  {id:'vocab',label:'Vokabeln',icon:Brain},
  {id:'progress',label:'Fortschritt',icon:Trophy},
]
const errorText=(error:unknown)=>error instanceof Error?error.message:''

export default function Page(){
  const [tab,setTab]=useState<Tab>('home')
  const [progress,setProgress]=useState<UserProgress>(defaultProgress)
  const [lessonId,setLessonId]=useState(1)
  const [session,setSession]=useState<CloudSession|null>(null)
  const [profileId,setProfileId]=useState<string|null>(null)
  const [progressScope,setProgressScope]=useState<string|null>(null)
  const [syncState,setSyncState]=useState('nur lokal')
  const hydrated=useRef(false)
  const syncTimer=useRef<ReturnType<typeof setTimeout>|null>(null)

  useEffect(()=>{const saved=loadSession(),scope=saved?.user.id||null;setSession(saved);setProgressScope(scope);setProgress(loadProgress(scope));hydrated.current=true},[])
  useEffect(()=>{if(hydrated.current)saveProgress(progress,progressScope)},[progress,progressScope])
  useEffect(()=>{if(!session){setProfileId(null);return}let cancelled=false;(async()=>{try{setSyncState('verbinde …');const profile=await ensureProfile(session);if(cancelled)return;setProfileId(profile.id);const userLocal=loadProgress(session.user.id),cloud=await loadCloudProgress(session,profile.id);if(cancelled)return;let merged:UserProgress;if(cloud)merged=mergeProgress(userLocal,cloud);else if(hasMeaningfulProgress(userLocal))merged=userLocal;else{const guest=loadProgress(null);merged=hasMeaningfulProgress(guest)?mergeProgress(userLocal,guest):userLocal;if(hasMeaningfulProgress(guest))clearGuestProgress()}setProgressScope(session.user.id);setProgress(merged);saveProgress(merged,session.user.id);setSyncState(`synchronisiert · ${new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}`)}catch(error){console.error('Cloud sync connection failed');setSyncState(errorText(error).includes('abgelaufen')?'Anmeldung erforderlich':'offline – lokal gespeichert')}})();return()=>{cancelled=true}},[session])
  useEffect(()=>{if(!session||!profileId||progressScope!==session.user.id||!hydrated.current)return;if(syncTimer.current)clearTimeout(syncTimer.current);syncTimer.current=setTimeout(async()=>{try{setSyncState('synchronisiere …');await saveCloudProgress(session,profileId,progress);setSyncState(`synchronisiert · ${new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}`)}catch{console.error('Cloud sync save failed');setSyncState('offline – lokal gespeichert')}},1200);return()=>{if(syncTimer.current)clearTimeout(syncTimer.current)}},[progress,session,profileId,progressScope])

  const activeLesson=Math.min(lessons.length,Math.max(1,[...progress.completedLessons,0].sort((a,b)=>b-a)[0]+1))
  useEffect(()=>{if(hydrated.current&&lessonId===1&&activeLesson!==1)setLessonId(activeLesson)},[activeLesson,lessonId])
  function handleSession(next:CloudSession|null){if(!next){if(progressScope)saveProgress(progress,progressScope);setProgressScope(null);setProgress(loadProgress(null));setProfileId(null);setSyncState('nur lokal')}setSession(next)}
  function finishLesson(id:number){setProgress(previous=>({...previous,completedLessons:Array.from(new Set([...previous.completedLessons,id])),updatedAt:Date.now()}));setTab('progress')}
  function setPreferences(preferences:LearnerPreferences){const now=Date.now();setProgress(previous=>({...previous,preferences,preferencesUpdatedAt:now,updatedAt:now}))}
  function go(next:NavTab){setTab(next);window.scrollTo({top:0,behavior:'smooth'})}

  return <main className="min-h-screen min-w-0 max-w-full pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-10">
    <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-4 sm:px-5 md:px-8 md:py-6">
      <Header streak={progress.streak} session={session} syncState={syncState} preferences={progress.preferences} onSession={handleSession} onPreferences={setPreferences}/>
      <div className="mt-5 grid min-w-0 gap-6 md:grid-cols-[190px_minmax(0,1fr)] md:items-start">
        <aside className="hidden md:block"><DesktopNav tab={tab} setTab={go}/></aside>
        <section className="mx-auto w-full min-w-0 max-w-4xl">
          {tab==='home'&&<HomeView progress={progress} activeLesson={activeLesson} onContinue={()=>{setTab('today');window.scrollTo({top:0,behavior:'smooth'})}} onGo={go}/>} 
          {tab==='today'&&<DailyTrainingSession progress={progress} setProgress={setProgress} exercises={exercises} vocabulary={vocabulary} activeLesson={activeLesson} onExerciseResult={(exercise,correct,meta)=>handleExercise(exercise,correct,meta,setProgress)} onFinish={()=>setTab('progress')}/>} 
          {tab==='learn'&&<LearnView lessonId={lessonId} setLessonId={setLessonId} activeLesson={activeLesson} progress={progress} setProgress={setProgress} finishLesson={finishLesson}/>} 
          {tab==='practice'&&<PracticeHub progress={progress} activeLesson={activeLesson} setProgress={setProgress}/>} 
          {tab==='vocab'&&<VocabWorkspace vocabulary={vocabulary} progress={progress} onResult={(exercise,correct,meta)=>handleExercise(exercise,correct,meta,setProgress)}/>} 
          {tab==='progress'&&<ProgressView progress={progress} cloud={Boolean(session)} syncState={syncState}/>} 
        </section>
      </div>
    </div>
    <MobileNav tab={tab} setTab={go}/>
    <Onboarding preferences={progress.preferences} onSave={setPreferences}/>
  </main>
}

function Header({streak,session,syncState,preferences,onSession,onPreferences}:{streak:number;session:CloudSession|null;syncState:string;preferences:LearnerPreferences;onSession:(session:CloudSession|null)=>void;onPreferences:(preferences:LearnerPreferences)=>void}){
  return <header className="flex min-w-0 items-center justify-between gap-3">
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-lime-300 text-lg font-black text-slate-950">S</div>
      <div className="min-w-0"><div className="text-sm font-black tracking-tight">Slovensko</div><div className="truncate text-xs text-slate-500">Slowenisch lernen</div></div>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <div className="flex min-h-10 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-black shadow-sm ring-1 ring-slate-200/70"><Flame size={16} className="text-orange-500"/><span>{streak}</span></div>
      <AccountMenu session={session} syncState={syncState} preferences={preferences} onSession={onSession} onPreferences={onPreferences}/>
    </div>
  </header>
}

function DesktopNav({tab,setTab}:{tab:Tab;setTab:(tab:NavTab)=>void}){
  const active:NavTab=tab==='today'?'learn':tab
  return <nav className="sticky top-5 space-y-1 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm">{nav.map(item=><button key={item.id} onClick={()=>setTab(item.id)} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition ${active===item.id?'bg-lime-100 text-slate-950':'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><item.icon size={18}/>{item.label}</button>)}</nav>
}

function MobileNav({tab,setTab}:{tab:Tab;setTab:(tab:NavTab)=>void}){
  const active:NavTab=tab==='today'?'learn':tab
  return <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pt-1.5 pb-[max(.4rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">{nav.map(item=><button key={item.id} onClick={()=>setTab(item.id)} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold ${active===item.id?'bg-lime-50 text-lime-800':'text-slate-500'}`} aria-label={item.label}><item.icon size={19}/><span className="max-w-full truncate">{item.label}</span></button>)}</nav>
}

function HomeView({progress,activeLesson,onContinue,onGo}:{progress:UserProgress;activeLesson:number;onContinue:()=>void;onGo:(tab:NavTab)=>void}){
  const due=progress.reviews.filter(review=>review.dueAt<=Date.now()).length
  const plan=buildDailyTrainingPlan(progress,exercises,activeLesson)
  const lesson=lessons.find(item=>item.id===activeLesson)
  return <div className="space-y-5">
    <div><div className="eyebrow">Heute</div><h1 className="page-title mt-1">Bereit für eine Runde?</h1><p className="page-copy">Dein Training ist vorbereitet. Einfach starten und Schritt für Schritt durchgehen.</p></div>

    <section className="overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><div className="text-sm font-bold text-lime-300">Heute lernen</div><h2 className="mt-1 text-3xl font-black tracking-tight">{plan.recommendedMinutes} Minuten</h2></div><div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{plan.blocks.length} Teile</div></div>
      <div className="mt-4 flex flex-wrap gap-2">{plan.blocks.slice(0,4).map(block=><span key={block.id} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">{block.title}</span>)}</div>
      <button onClick={onContinue} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-lime-300 px-5 py-3.5 font-black text-slate-950">Training starten <ChevronRight size={20}/></button>
    </section>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Quick icon={RotateCcw} label="Wiederholen" detail={due?`${due} fällig`:'Alles erledigt'} onClick={()=>onGo('practice')}/>
      <Quick icon={Mic2} label="Sprechen" detail="Aktiv üben" onClick={()=>onGo('practice')}/>
      <Quick icon={Brain} label="Vokabeln" detail={`${progress.wordsLearned.length} gelernt`} onClick={()=>onGo('vocab')}/>
      <Quick icon={BookOpen} label="Lektion" detail={lesson?`Nr. ${lesson.id}`:'Weiter'} onClick={()=>onGo('learn')}/>
    </div>

    <section className="surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3"><div><div className="text-sm font-black">Dein Weg</div><div className="mt-1 text-sm text-slate-500">{progress.completedLessons.length} von {lessons.length} Lektionen abgeschlossen</div></div><GraduationCap size={22} className="text-lime-700"/></div>
      <div className="progress-track mt-4"><div className="progress-fill" style={{width:`${Math.round((progress.completedLessons.length/Math.max(1,lessons.length))*100)}%`}}/></div>
    </section>
  </div>
}

function Quick({icon:Icon,label,detail,onClick}:{icon:LucideIcon;label:string;detail:string;onClick:()=>void}){
  return <button onClick={onClick} className="surface-interactive min-h-28 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm"><div className="grid h-9 w-9 place-items-center rounded-xl bg-lime-100 text-lime-800"><Icon size={19}/></div><div className="mt-3 font-black">{label}</div><div className="mt-0.5 text-xs text-slate-500">{detail}</div></button>
}

function LearnView({lessonId,setLessonId,activeLesson,progress,setProgress,finishLesson}:{lessonId:number;setLessonId:(id:number)=>void;activeLesson:number;progress:UserProgress;setProgress:ProgressSetter;finishLesson:(id:number)=>void}){
  const [showAll,setShowAll]=useState(false)
  const selected=lessons.find(item=>item.id===lessonId)??lessons[0]
  const active=lessons.find(item=>item.id===activeLesson)??selected
  return <div className="space-y-4">
    <div><div className="eyebrow">Lernen</div><h1 className="page-title mt-1">Deine Lektionen</h1></div>
    {!showAll&&lessonId===activeLesson?<section className="surface p-4 sm:p-5"><div className="text-xs font-bold text-lime-700">Aktuelle Lektion</div><h2 className="mt-1 text-2xl font-black">{active.title}</h2><p className="mt-1 text-sm text-slate-500">{active.subtitle}</p><button onClick={()=>setLessonId(active.id)} className="btn-primary mt-4 w-full">Weiterlernen <ChevronRight size={18}/></button></section>:null}
    <button onClick={()=>setShowAll(value=>!value)} className="btn-secondary w-full">{showAll?'Lektionen schließen':'Alle Lektionen anzeigen'}</button>
    {showAll&&<div className="grid gap-2 sm:grid-cols-2">{lessons.map(lesson=><button key={lesson.id} onClick={()=>{setLessonId(lesson.id);setShowAll(false)}} className={`surface-interactive flex min-h-16 items-center gap-3 rounded-2xl border p-3 text-left ${lesson.id===lessonId?'border-lime-400 bg-lime-50':'border-slate-200 bg-white'}`}><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black ${progress.completedLessons.includes(lesson.id)?'bg-lime-200 text-lime-900':'bg-slate-100 text-slate-600'}`}>{progress.completedLessons.includes(lesson.id)?'✓':lesson.id}</div><div className="min-w-0"><div className="truncate font-black">{lesson.title}</div><div className="truncate text-xs text-slate-500">{lesson.subtitle}</div></div></button>)}</div>}
    <LessonFlow key={selected.id} lessonId={selected.id} progress={progress} setProgress={setProgress} onExerciseResult={(exercise,correct,meta)=>handleExercise(exercise,correct,meta,setProgress)} onFinish={()=>finishLesson(selected.id)}/>
  </div>
}

function PracticeHub({progress,activeLesson,setProgress}:{progress:UserProgress;activeLesson:number;setProgress:ProgressSetter}){
  const [mode,setMode]=useState<'review'|'speak'>('review')
  return <div className="space-y-4">
    <div><div className="eyebrow">Üben</div><h1 className="page-title mt-1">Was möchtest du festigen?</h1></div>
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5"><button onClick={()=>setMode('review')} className={`min-h-11 rounded-xl px-3 text-sm font-black ${mode==='review'?'bg-white text-slate-950 shadow-sm':'text-slate-500'}`}><span className="inline-flex items-center gap-2"><RotateCcw size={17}/>Wiederholen</span></button><button onClick={()=>setMode('speak')} className={`min-h-11 rounded-xl px-3 text-sm font-black ${mode==='speak'?'bg-white text-slate-950 shadow-sm':'text-slate-500'}`}><span className="inline-flex items-center gap-2"><Mic2 size={17}/>Sprechen</span></button></div>
    {mode==='review'?<ReviewView progress={progress} activeLesson={activeLesson} setProgress={setProgress}/>:<SpeakView setProgress={setProgress}/>} 
  </div>
}

function ReviewView({progress,activeLesson,setProgress}:{progress:UserProgress;activeLesson:number;setProgress:ProgressSetter}){
  const [plan]=useState(()=>buildSessionPlan(progress,exercises,activeLesson))
  const [reviewSession]=useState(()=>createExerciseSession('review',exercisesForPlan(buildSessionPlan(progress,exercises,activeLesson),exercises),`review:${activeLesson}:${Date.now()}`))
  return <div className="space-y-3"><section className="surface p-4"><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-black">Heute wiederholen</div><div className="mt-1 text-sm text-slate-500">{plan.total?`${plan.total} Lernziel${plan.total===1?'':'e'} sind fällig.`:'Für heute ist alles erledigt.'}</div></div><RotateCcw size={22} className="text-lime-700"/></div></section>{reviewSession.exercises.length?<ExerciseDeck key={reviewSession.sessionId} session={reviewSession} onResult={(exercise,correct,meta)=>handleExercise(exercise,correct,meta,setProgress)}/>:<div className="surface p-5 text-center"><div className="text-2xl">✓</div><h2 className="mt-2 text-xl font-black">Alles geschafft</h2><p className="mt-1 text-sm text-slate-500">Neue Wiederholungen erscheinen automatisch, wenn sie fällig werden.</p></div>}</div>
}

function SpeakView({setProgress}:{setProgress:ProgressSetter}){
  const [index,setIndex]=useState(0)
  const prompts=[['Kje si zdaj?','Zdaj sem v Sloveniji.'],['Od kod si?','Sem iz Nemčije.'],['Kje živiš?','Živim v Nemčiji.'],['Kaj piješ?','Pijem vodo.'],['Kdaj greš spat?','Grem spat ob desetih.']]
  function result(correct:boolean,_actual:string,meta:SpeechResultMeta){setProgress(previous=>{const hints=meta.replays+(meta.usedSlowAudio?1:0),spoken=meta.inputMode==='speech';let mastery=updateSkillMastery(previous.mastery||{},spoken?'speaking:spoken-response':'production:typed-fallback',correct,meta.responseMs,hints);mastery=updateSkillMastery(mastery,spoken?'speaking':'production',correct,meta.responseMs,hints);return {...previous,speakingMinutes:spoken?+(previous.speakingMinutes+.2).toFixed(1):previous.speakingMinutes,mastery,updatedAt:Date.now()}});if(correct)setTimeout(()=>setIndex(value=>(value+1)%prompts.length),900)}
  return <div className="space-y-4"><SpeechPractice prompt={prompts[index][0]} expected={prompts[index][1]} onResult={result}/><details className="surface p-4"><summary className="cursor-pointer font-black">Freies Gespräch mit dem Tutor</summary><div className="mt-4"><TutorChat/></div></details></div>
}

function ProgressView({progress,cloud,syncState}:{progress:UserProgress;cloud:boolean;syncState:string}){
  const spoken=Math.round((progress.mastery?.['skill:speaking:spoken-response']?.score||0)*100)
  const listening=Math.round((progress.mastery?.['skill:listening']?.score||0)*100)
  const syncProblem=cloud&&(syncState.includes('offline')||syncState.includes('erforderlich'))
  return <div className="space-y-4"><div><div className="eyebrow">Fortschritt</div><h1 className="page-title mt-1">Dein Lernstand</h1>{syncProblem&&<p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">Cloud-Sync: {syncState}</p>}</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric icon={Flame} value={String(progress.streak)} label="Lernserie"/><Metric icon={Brain} value={String(progress.wordsLearned.length)} label="Wörter"/><Metric icon={BookOpen} value={String(progress.completedLessons.length)} label="Lektionen"/><Metric icon={Mic2} value={`${Math.round(progress.speakingMinutes)} min`} label="Gesprochen"/></div><ProgressProfile progress={progress} totalVocabulary={vocabulary.length} totalLessons={lessons.length}/><section className="surface p-4 sm:p-5"><h2 className="font-black">Deine Fähigkeiten</h2><div className="mt-4 space-y-4"><Skill label="Hören" value={listening}/><Skill label="Sprechen" value={spoken}/><Skill label="Wortschatz" value={Math.round((progress.wordsLearned.length/Math.max(1,vocabulary.length))*100)}/><Skill label="Lektionen" value={Math.round((progress.completedLessons.length/Math.max(1,lessons.length))*100)}/></div></section></div>
}

function Metric({icon:Icon,value,label}:{icon:LucideIcon;value:string;label:string}){
  return <div className="surface p-3.5"><Icon size={18} className="text-lime-700"/><div className="mt-3 text-2xl font-black">{value}</div><div className="text-xs text-slate-500">{label}</div></div>
}

function Skill({label,value}:{label:string;value:number}){return <div><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="font-bold">{label}</span><span className="font-black">{value?`${value}%`:'–'}</span></div><div className="progress-track"><div className="progress-fill" style={{width:`${Math.max(0,Math.min(100,value))}%`}}/></div></div>}

function handleExercise(exercise:Exercise,correct:boolean,meta:{responseMs:number;hintsUsed:number},setProgress:ProgressSetter){setProgress(previous=>{const attemptCount=(previous.recentAttempts?.length||0)+1,now=Date.now(),reviews=scheduleExerciseReviews(previous.reviews,exercise,correct,now),mastery=updateMastery(previous.mastery||{},exercise,correct,meta.responseMs,meta.hintsUsed),attempt={exerciseId:exercise.id,correct,responseMs:meta.responseMs,hintsUsed:meta.hintsUsed,occurredAt:now,vocabularyIds:exercise.vocabularyIds||[],grammarRuleIds:exercise.grammarRuleIds||[],skillTargets:exercise.skillTargets||[],activeProduction:isActiveProduction(exercise)},next:UserProgress={...previous,reviews,mistakes:correct?previous.mistakes:registerMistake(previous.mistakes,exercise.id),mastery,recentAttempts:recordAttempt(previous.recentAttempts||[],attempt),transferQueue:queueTransfers(previous.transferQueue||[],exercise,correct,attemptCount),updatedAt:now};return reconcileVocabularyProgress(next,exercise.vocabularyIds||[])})}
