'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Brain, ChevronRight, Flame, GraduationCap, Headphones, Home, MessageCircle, Mic2, RotateCcw, Search, Sparkles, Trophy, Volume2 } from 'lucide-react'
import AudioButton from '@/components/AudioButton'
import SpeechPractice from '@/components/SpeechPractice'
import TutorChat from '@/components/TutorChat'
import { conversations, exercises, lessons, sentences, vocabulary } from '@/data/seed'
import { defaultProgress, loadProgress, registerMistake, saveProgress, scheduleReview } from '@/lib/storage'
import { isEquivalent } from '@/lib/text'
import { Exercise, UserProgress } from '@/types'

type Tab = 'home' | 'lesson' | 'review' | 'speak' | 'vocab' | 'progress'

const nav: {id: Tab; label:string; icon:any}[] = [
  {id:'home',label:'Start',icon:Home}, {id:'lesson',label:'Lektionen',icon:BookOpen},
  {id:'review',label:'Wiederholen',icon:RotateCcw}, {id:'speak',label:'Sprechen',icon:Mic2},
  {id:'vocab',label:'Vokabeln',icon:Brain}, {id:'progress',label:'Fortschritt',icon:Trophy}
]

export default function Page() {
  const [tab,setTab] = useState<Tab>('home')
  const [progress,setProgress] = useState<UserProgress>(defaultProgress)
  const [lessonId,setLessonId] = useState(1)
  useEffect(() => setProgress(loadProgress()), [])
  useEffect(() => saveProgress(progress), [progress])
  const activeLesson = Math.min(5, Math.max(1, [...progress.completedLessons,0].sort((a,b)=>b-a)[0] + 1))

  function finishLesson(id:number) {
    const ids = vocabulary.filter(v=>v.lesson===id).map(v=>v.id)
    setProgress(p => ({...p, completedLessons:[...new Set([...p.completedLessons,id])], wordsLearned:[...new Set([...p.wordsLearned,...ids])] }))
    setTab('progress')
  }

  return <main className="min-h-screen pb-24 md:pb-8">
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">
      <Header streak={progress.streak}/>
      <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block"><DesktopNav tab={tab} setTab={setTab}/></aside>
        <section>
          {tab==='home' && <HomeView progress={progress} activeLesson={activeLesson} onContinue={()=>{setLessonId(activeLesson);setTab('lesson')}} onGo={setTab}/>} 
          {tab==='lesson' && <LessonsView selected={lessonId} setSelected={setLessonId} finish={finishLesson} progress={progress} onExerciseResult={(e,c)=>handleExercise(e,c,setProgress)}/>} 
          {tab==='review' && <ReviewView progress={progress} setProgress={setProgress}/>} 
          {tab==='speak' && <SpeakView setProgress={setProgress}/>} 
          {tab==='vocab' && <VocabView progress={progress}/>} 
          {tab==='progress' && <ProgressView progress={progress}/>} 
        </section>
      </div>
    </div>
    <MobileNav tab={tab} setTab={setTab}/>
  </main>
}

function Header({streak}:{streak:number}) {
  return <header className="flex items-center justify-between">
    <div><div className="text-xs font-bold uppercase tracking-[0.24em] text-lime-700">Slovensko</div><h1 className="text-2xl font-black tracking-tight">Slowenisch, das du wirklich sprichst.</h1></div>
    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-soft"><Flame size={18}/><span className="font-bold">{streak}</span><span className="hidden text-sm text-slate-500 sm:inline">Tage</span></div>
  </header>
}

function DesktopNav({tab,setTab}:{tab:Tab;setTab:(t:Tab)=>void}) {
  return <nav className="sticky top-6 space-y-1 rounded-3xl bg-white p-3 shadow-soft">{nav.map(n=><button key={n.id} onClick={()=>setTab(n.id)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold ${tab===n.id?'bg-lime-200 text-slate-950':'text-slate-600 hover:bg-slate-50'}`}><n.icon size={19}/>{n.label}</button>)}</nav>
}
function MobileNav({tab,setTab}:{tab:Tab;setTab:(t:Tab)=>void}) {
  return <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-6 border-t border-slate-200 bg-white/95 px-1 py-2 backdrop-blur md:hidden">{nav.map(n=><button key={n.id} onClick={()=>setTab(n.id)} className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${tab===n.id?'text-lime-700':'text-slate-500'}`}><n.icon size={20}/>{n.label}</button>)}</nav>
}

function HomeView({progress,activeLesson,onContinue,onGo}:{progress:UserProgress;activeLesson:number;onContinue:()=>void;onGo:(t:Tab)=>void}) {
  const due = progress.reviews.filter(r=>r.dueAt<=Date.now()).length
  return <div className="space-y-6">
    <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-soft md:p-8">
      <div className="max-w-2xl"><div className="mb-2 text-sm font-semibold text-lime-300">Dobrodošel!</div><h2 className="text-3xl font-black md:text-5xl">Heute nicht nur lernen. <span className="text-lime-300">Heute sprechen.</span></h2><p className="mt-4 max-w-xl text-slate-300">Kurze Lektionen, langsames slowenisches Audio und aktive Antworten. Fehler kommen später gezielt wieder.</p><button onClick={onContinue} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-lime-300 px-5 py-3 font-black text-slate-950">Heute weiterlernen <ChevronRight/></button></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric icon={Brain} value={`${progress.wordsLearned.length} / 1000`} label="Aktiver Wortschatz"/>
      <Metric icon={RotateCcw} value={String(due)} label="Heute wiederholen"/>
      <Metric icon={GraduationCap} value={`${progress.completedLessons.length} / 30`} label="Lektionen"/>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card"><div className="text-sm font-bold text-lime-700">Als Nächstes</div><h3 className="mt-1 text-xl font-black">Lektion {activeLesson}: {lessons[activeLesson-1]?.title}</h3><p className="mt-2 text-slate-600">{lessons[activeLesson-1]?.subtitle}</p><div className="mt-4 flex flex-wrap gap-2">{lessons[activeLesson-1]?.focus.map(f=><span key={f} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{f}</span>)}</div></div>
      <div className="card"><div className="flex items-center gap-2"><Sparkles size={18}/><h3 className="font-black">Dein Muster für heute</h3></div><div className="mt-4 rounded-2xl bg-lime-50 p-4"><div className="text-sm text-slate-500">KJE → WO?</div><div className="mt-1 text-xl font-bold">Sem v Sloveniji.</div><div className="mt-3 text-sm text-slate-500">KAM → WOHIN?</div><div className="mt-1 text-xl font-bold">Grem v Slovenijo.</div></div></div>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Quick icon={RotateCcw} label="Wiederholen" onClick={()=>onGo('review')}/><Quick icon={Mic2} label="Sprechen" onClick={()=>onGo('speak')}/><Quick icon={Brain} label="Vokabeln" onClick={()=>onGo('vocab')}/><Quick icon={Trophy} label="Fortschritt" onClick={()=>onGo('progress')}/>
    </div>
  </div>
}
function Metric({icon:Icon,value,label}:{icon:any;value:string;label:string}) { return <div className="card"><Icon className="mb-3" size={20}/><div className="text-2xl font-black">{value}</div><div className="text-sm text-slate-500">{label}</div></div> }
function Quick({icon:Icon,label,onClick}:{icon:any;label:string;onClick:()=>void}) { return <button onClick={onClick} className="card flex min-h-28 flex-col items-start justify-between text-left transition hover:-translate-y-0.5"><Icon/><span className="font-bold">{label}</span></button> }

function LessonsView({selected,setSelected,finish,progress,onExerciseResult}:{selected:number;setSelected:(n:number)=>void;finish:(n:number)=>void;progress:UserProgress;onExerciseResult:(e:Exercise,c:boolean)=>void}) {
  const lesson=lessons.find(l=>l.id===selected)!
  const [step,setStep]=useState<'intro'|'words'|'grammar'|'practice'|'dialog'>('intro')
  const exs=exercises.filter(e=>e.lesson===selected)
  return <div className="space-y-5">
    <div className="flex gap-2 overflow-x-auto pb-1">{lessons.map(l=><button key={l.id} onClick={()=>{setSelected(l.id);setStep('intro')}} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${selected===l.id?'bg-slate-950 text-white':'bg-white text-slate-600'}`}>Lektion {l.id}{progress.completedLessons.includes(l.id)?' ✓':''}</button>)}</div>
    <div className="card"><div className="text-sm font-bold text-lime-700">Lektion {lesson.id} · {lesson.minutes} Min.</div><h2 className="mt-1 text-3xl font-black">{lesson.title}</h2><p className="mt-2 text-slate-600">{lesson.subtitle}</p></div>
    <div className="flex flex-wrap gap-2">{(['intro','words','grammar','practice','dialog'] as const).map(s=><button key={s} onClick={()=>setStep(s)} className={`rounded-xl px-3 py-2 text-sm font-bold ${step===s?'bg-lime-200':'bg-white'}`}>{({intro:'Start',words:'Wörter',grammar:'Grammatik',practice:'Üben',dialog:'Dialog'} as any)[s]}</button>)}</div>
    {step==='intro' && <div className="card"><h3 className="text-xl font-black">Heute kannst du danach …</h3><div className="mt-4 flex flex-wrap gap-2">{lesson.focus.map(f=><span key={f} className="rounded-full bg-lime-50 px-3 py-2 font-semibold">{f}</span>)}</div><button onClick={()=>setStep('words')} className="btn-primary mt-6">Los geht’s <ChevronRight size={18}/></button></div>}
    {step==='words' && <div className="grid gap-3">{vocabulary.filter(v=>v.lesson===selected).slice(0,20).map(x=><div key={x.id} className="card flex items-start gap-3"><AudioButton text={x.sl} compact/><div className="min-w-0 flex-1"><div className="flex items-baseline justify-between gap-2"><div className="text-lg font-black">{x.sl}</div><div className="text-xs text-slate-400">{x.partOfSpeech}</div></div><div className="text-slate-600">{x.de}</div><div className="mt-2 rounded-xl bg-slate-50 p-3"><b>{x.example}</b><div className="text-sm text-slate-500">{x.exampleDe}</div></div></div></div>)}</div>}
    {step==='grammar' && <div className="card"><div className="text-sm font-bold text-lime-700">Grammatik, praktisch</div><h3 className="mt-1 text-2xl font-black">{lesson.grammar.title}</h3><p className="mt-3 text-slate-600">{lesson.grammar.body}</p><div className="mt-4 space-y-2">{lesson.grammar.examples.map(e=><div key={e} className="rounded-2xl bg-lime-50 p-3 font-semibold">{e}</div>)}</div></div>}
    {step==='practice' && <ExerciseDeck exercises={exs} onResult={onExerciseResult}/>} 
    {step==='dialog' && <div className="space-y-4"><ConversationCard lesson={selected}/><button onClick={()=>finish(selected)} className="btn-primary w-full justify-center">Lektion abschließen</button></div>}
  </div>
}

function ExerciseDeck({exercises:onDeck,onResult}:{exercises:Exercise[];onResult:(e:Exercise,c:boolean)=>void}) {
  const [i,setI]=useState(0), [value,setValue]=useState(''), [checked,setChecked]=useState(false)
  const ex=onDeck[i % onDeck.length]
  if (!ex) return <div className="card">Für diese Lektion sind noch keine Übungen vorhanden.</div>
  const correct=isEquivalent(value,ex.answer)
  return <div className="card"><div className="text-sm font-bold text-lime-700">Übung {i+1} / {onDeck.length}</div><h3 className="mt-2 text-xl font-black">{ex.prompt}</h3>{ex.hint&&<p className="mt-2 text-sm text-slate-500">Hinweis: {ex.hint}</p>}<input value={value} onChange={e=>{setValue(e.target.value);setChecked(false)}} onKeyDown={e=>{if(e.key==='Enter'&&value.trim()){setChecked(true);onResult(ex,isEquivalent(value,ex.answer))}}} className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500" placeholder="Deine Antwort auf Slowenisch …"/><button onClick={()=>{setChecked(true);onResult(ex,correct)}} disabled={!value.trim()} className="btn-primary mt-3 w-full justify-center">Prüfen</button>{checked&&<div className={`mt-4 rounded-2xl p-4 ${correct?'bg-lime-50':'bg-amber-50'}`}>{correct?<><b>Pravilno!</b> Genau richtig.</>:<><b>Noch nicht.</b><div className="mt-1">Richtig: <span className="font-bold">{ex.answer}</span></div>{ex.explanation&&<div className="mt-2 text-sm">Warum? {ex.explanation}</div>}</>}<button onClick={()=>{setI((i+1)%onDeck.length);setValue('');setChecked(false)}} className="mt-3 font-bold underline">Nächste Aufgabe</button></div>}</div>
}

function ConversationCard({lesson}:{lesson:number}) {
  const c=conversations.find(c=>c.lesson===lesson)!
  return <div className="card"><div className="mb-4 flex items-center gap-2"><MessageCircle size={20}/><h3 className="text-xl font-black">{c.title}</h3></div><div className="space-y-3">{c.turns.map((t,i)=><div key={i} className={`max-w-[90%] rounded-2xl p-3 ${t.speaker==='Tutor'?'bg-slate-100':'ml-auto bg-lime-100'}`}><div className="mb-1 text-xs font-bold uppercase text-slate-400">{t.speaker}</div><div className="flex items-center gap-2"><span className="font-semibold">{t.sl}</span><AudioButton text={t.sl} compact/></div>{t.de&&<div className="mt-1 text-sm text-slate-500">{t.de}</div>}</div>)}</div></div>
}

function ReviewView({progress,setProgress}:{progress:UserProgress;setProgress:(f:any)=>void}) {
  const dueKeys=progress.reviews.filter(r=>r.dueAt<=Date.now()).map(r=>r.key)
  const priority=[...progress.mistakes].sort((a,b)=>b.count-a.count).map(m=>m.key)
  const pool=exercises.filter(e=>dueKeys.includes(e.id)||priority.includes(e.id)).slice(0,10)
  const selected=pool.length?pool:exercises.slice(0,8)
  return <div className="space-y-5"><div className="card"><h2 className="text-3xl font-black">Wiederholen</h2><p className="mt-2 text-slate-600">Fehlerhafte Inhalte kommen früher wieder. Richtige Antworten wandern schrittweise von „unsicher“ zu „sicher“.</p></div><ExerciseDeck exercises={selected} onResult={(e,c)=>handleExercise(e,c,setProgress)}/></div>
}

function SpeakView({setProgress}:{setProgress:(f:any)=>void}) {
  const [idx,setIdx]=useState(0)
  const prompts=[
    ['Kje si zdaj?','Zdaj sem v Sloveniji.'],['Od kod si?','Sem iz Nemčije.'],['Kje živiš?','Živim v Nemčiji.'],['Kaj piješ?','Pijem vodo.'],['Kdaj greš spat?','Grem spat ob desetih.']
  ]
  return <div className="space-y-5"><div className="card"><h2 className="text-3xl font-black">Sprechen</h2><p className="mt-2 text-slate-600">Hören → selbst antworten → korrigieren. Slowenisch wird standardmäßig langsam gesprochen.</p></div><SpeechPractice prompt={prompts[idx][0]} expected={prompts[idx][1]} onResult={(correct)=>{setProgress((p:UserProgress)=>({...p,speakingMinutes:+(p.speakingMinutes+0.2).toFixed(1)})); if(correct)setTimeout(()=>setIdx((idx+1)%prompts.length),900)}}/><TutorChat/></div>
}

function VocabView({progress}:{progress:UserProgress}) {
  const [q,setQ]=useState(''), [category,setCategory]=useState('Alle')
  const cats=['Alle',...Array.from(new Set(vocabulary.map(v=>v.category)))]
  const list=useMemo(()=>vocabulary.filter(v=>(category==='Alle'||v.category===category)&&(`${v.sl} ${v.de}`.toLowerCase().includes(q.toLowerCase()))),[q,category])
  return <div className="space-y-4"><div className="card"><h2 className="text-3xl font-black">Vokabeln</h2><p className="mt-2 text-slate-600">{vocabulary.length} Seed-Wörter im MVP. Das Datenmodell ist auf 1.000+ ausgelegt.</p><div className="mt-4 flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-3.5 text-slate-400" size={18}/><input value={q} onChange={e=>setQ(e.target.value)} className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-3" placeholder="Slowenisch oder Deutsch …"/></div><select value={category} onChange={e=>setCategory(e.target.value)} className="max-w-36 rounded-2xl border border-slate-200 px-3">{cats.map(c=><option key={c}>{c}</option>)}</select></div></div><div className="grid gap-3 lg:grid-cols-2">{list.map(x=><div key={x.id} className="card flex gap-3"><AudioButton text={x.sl} compact/><div className="flex-1"><div className="flex justify-between gap-2"><b className="text-lg">{x.sl}</b><span className={`rounded-full px-2 py-1 text-xs ${progress.secureWords.includes(x.id)?'bg-lime-100':'bg-slate-100'}`}>{progress.secureWords.includes(x.id)?'sicher':progress.wordsLearned.includes(x.id)?'gelernt':'neu'}</span></div><div className="text-slate-600">{x.de}</div><div className="mt-2 text-sm"><b>{x.example}</b><div className="text-slate-500">{x.exampleDe}</div></div></div></div>)}</div></div>
}

function ProgressView({progress}:{progress:UserProgress}) {
  const top=[...progress.mistakes].sort((a,b)=>b.count-a.count).slice(0,5)
  return <div className="space-y-5"><div className="card"><h2 className="text-3xl font-black">Fortschritt</h2><p className="mt-2 text-slate-600">Dein lokales Lernprofil auf diesem Gerät.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={Brain} value={`${progress.wordsLearned.length}`} label="gelernte Wörter"/><Metric icon={Trophy} value={`${progress.secureWords.length}`} label="sichere Wörter"/><Metric icon={Mic2} value={`${progress.speakingMinutes.toFixed(1)} min`} label="Sprechzeit"/><Metric icon={Headphones} value={`${progress.listeningMinutes.toFixed(1)} min`} label="Hörzeit"/></div><div className="card"><h3 className="text-xl font-black">Häufigste Fehler</h3>{top.length?<div className="mt-4 space-y-2">{top.map(m=>{const ex=exercises.find(e=>e.id===m.key);return <div key={m.key} className="flex justify-between rounded-2xl bg-amber-50 p-3"><span>{ex?.prompt??m.key}</span><b>{m.count}×</b></div>})}</div>:<p className="mt-3 text-slate-500">Noch keine Fehler gespeichert. Das darf gern so bleiben.</p>}</div><div className="card"><h3 className="text-xl font-black">Spaced Repetition</h3><p className="mt-2 text-slate-600">Intervalle: 10 Minuten → 1 Tag → 3 Tage → 7 Tage → 14 Tage → 30 Tage. Falsche Antworten springen zurück auf 10 Minuten.</p></div></div>
}

function handleExercise(ex:Exercise, correct:boolean, setProgress:(f:any)=>void) {
  setProgress((p:UserProgress)=>{
    const reviews=scheduleReview(p.reviews,ex.id,correct)
    const mistakes=correct?p.mistakes:registerMistake(p.mistakes,ex.id)
    return {...p,reviews,mistakes}
  })
}
