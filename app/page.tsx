'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookMarked, BookOpen, Brain, ChevronRight, Flame, Headphones, Home, Map, MessageCircle, Mic2, RotateCcw, Search, Sparkles, Trophy } from 'lucide-react'
import AudioButton from '@/components/AudioButton'
import SpeechPractice from '@/components/SpeechPractice'
import TutorChat from '@/components/TutorChat'
import ExerciseDeck, { ExerciseResultMeta } from '@/components/exercises/ExerciseDeck'
import ListeningPractice from '@/components/learning/ListeningPractice'
import GrammarLibrary from '@/components/learning/GrammarLibrary'
import CurriculumRoadmap from '@/components/learning/CurriculumRoadmap'
import ProgressDashboard from '@/components/progress/ProgressDashboard'
import { conversations, exercises, lessons, vocabulary } from '@/data/seed'
import { buildDailySession, dailySessionMinutes } from '@/lib/dailySession'
import { selectReviewQueue } from '@/lib/spacedRepetition'
import { defaultProgress, loadProgress, recordLearningTime, registerMistake, saveProgress, scheduleReview } from '@/lib/storage'
import type { Exercise, LearningSkill, UserProgress } from '@/types'

type Tab = 'home' | 'path' | 'lesson' | 'review' | 'listen' | 'speak' | 'vocab' | 'grammar' | 'progress'

const desktopNav: { id: Tab; label: string; icon: any }[] = [
  { id: 'home', label: 'Heute', icon: Home },
  { id: 'path', label: 'Lernpfad', icon: Map },
  { id: 'lesson', label: 'Lektionen', icon: BookOpen },
  { id: 'review', label: 'Wiederholen', icon: RotateCcw },
  { id: 'listen', label: 'Hören', icon: Headphones },
  { id: 'speak', label: 'Sprechen', icon: Mic2 },
  { id: 'vocab', label: 'Vokabeln', icon: Brain },
  { id: 'grammar', label: 'Grammatik', icon: BookMarked },
  { id: 'progress', label: 'Fortschritt', icon: Trophy },
]

const mobileNav = desktopNav.filter(item => ['home', 'path', 'review', 'speak', 'progress'].includes(item.id))

export default function Page() {
  const [tab, setTab] = useState<Tab>('home')
  const [progress, setProgress] = useState<UserProgress>(defaultProgress)
  const [lessonId, setLessonId] = useState(1)

  useEffect(() => setProgress(loadProgress()), [])
  useEffect(() => saveProgress(progress), [progress])

  const highestCompleted = [...progress.completedLessons, 0].sort((a, b) => b - a)[0]
  const activeLesson = Math.min(lessons.length, Math.max(1, highestCompleted + 1))

  function openLesson(id: number) {
    setLessonId(id)
    setTab('lesson')
  }

  function finishLesson(id: number) {
    const ids = vocabulary.filter(item => item.lesson === id).map(item => item.id)
    setProgress(current => ({
      ...current,
      completedLessons: Array.from(new Set([...current.completedLessons, id])),
      wordsLearned: Array.from(new Set([...current.wordsLearned, ...ids])),
    }))
    setTab('progress')
  }

  return <main className="mobile-page-bottom min-h-screen md:pb-8">
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">
      <Header streak={progress.streak}/>
      <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block"><DesktopNav tab={tab} setTab={setTab}/></aside>
        <section>
          {tab === 'home' && <HomeView progress={progress} activeLesson={activeLesson} onOpenLesson={openLesson} onGo={setTab}/>} 
          {tab === 'path' && <CurriculumRoadmap progress={progress} onOpenLesson={openLesson}/>} 
          {tab === 'lesson' && <LessonsView selected={lessonId} setSelected={setLessonId} finish={finishLesson} progress={progress} onExerciseResult={(exercise, correct, meta) => handleExercise(exercise, correct, meta, setProgress)}/>} 
          {tab === 'review' && <ReviewView progress={progress} setProgress={setProgress}/>} 
          {tab === 'listen' && <ListenView setProgress={setProgress}/>} 
          {tab === 'speak' && <SpeakView setProgress={setProgress}/>} 
          {tab === 'vocab' && <VocabView progress={progress}/>} 
          {tab === 'grammar' && <GrammarLibrary/>} 
          {tab === 'progress' && <ProgressDashboard progress={progress}/>} 
        </section>
      </div>
    </div>
    <MobileNav tab={tab} setTab={setTab}/>
  </main>
}

function Header({ streak }: { streak: number }) {
  return <header className="flex items-center justify-between gap-4">
    <div><div className="text-xs font-bold uppercase tracking-[0.24em] text-lime-700">Slovensko</div><h1 className="text-xl font-black tracking-tight sm:text-2xl">Slowenisch, das du wirklich sprichst.</h1></div>
    <div className="flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-2 shadow-soft"><Flame size={18}/><span className="font-bold">{streak}</span><span className="hidden text-sm text-slate-500 sm:inline">Tage</span></div>
  </header>
}

function DesktopNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  return <nav className="sticky top-6 space-y-1 rounded-3xl bg-white p-3 shadow-soft">{desktopNav.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left font-semibold ${tab === item.id ? 'bg-lime-200 text-slate-950' : 'text-slate-600 hover:bg-slate-50'}`}><item.icon size={19}/>{item.label}</button>)}</nav>
}

function MobileNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  return <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pt-2 backdrop-blur md:hidden">{mobileNav.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`touch-target flex flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold ${tab === item.id ? 'text-lime-700' : 'text-slate-500'}`}><item.icon size={20}/>{item.label}</button>)}</nav>
}

function HomeView({ progress, activeLesson, onOpenLesson, onGo }: { progress: UserProgress; activeLesson: number; onOpenLesson: (id: number) => void; onGo: (tab: Tab) => void }) {
  const due = progress.reviews.filter(item => item.dueAt <= Date.now()).length
  const today = new Date().toISOString().slice(0, 10)
  const todayMinutes = progress.dailyActivity?.find(item => item.date === today)?.minutes ?? 0
  const session = buildDailySession(progress, exercises, activeLesson)

  return <div className="space-y-6">
    <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-soft md:p-8">
      <div className="max-w-2xl"><div className="mb-2 text-sm font-semibold text-lime-300">Dobrodošel!</div><h2 className="text-3xl font-black md:text-5xl">Heute lernen. <span className="text-lime-300">Heute sprechen.</span></h2><p className="mt-4 max-w-xl text-slate-300">Eine kurze Session aus Wiederholung, neuem Stoff, Grammatik, Hören und Sprechen.</p><button onClick={() => onOpenLesson(activeLesson)} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-lime-300 px-5 py-3 font-black text-slate-950">Heute starten <ChevronRight/></button></div>
    </div>

    <div className="grid gap-3 sm:grid-cols-3">
      <Metric value={`${todayMinutes.toFixed(1)} min`} label="Heute gelernt"/>
      <Metric value={String(due)} label="Fällige Wiederholungen"/>
      <Metric value={`${progress.completedLessons.length} / ${lessons.length}`} label="Verfügbare Lektionen geschafft"/>
    </div>

    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><div className="text-sm font-bold text-lime-700">Heute lernen</div><h3 className="text-xl font-black">Deine Session · ca. {dailySessionMinutes(session)} Min.</h3></div><Sparkles size={22}/></div>
      <div className="mt-4 grid gap-2">{session.map((step, index) => <div key={step.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">{index + 1}</div><div className="min-w-0 flex-1"><div className="font-semibold">{step.title}</div><div className="text-xs text-slate-500">{step.minutes} Min. · {step.kind}</div></div></div>)}</div>
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Quick icon={Headphones} label="Hören" onClick={() => onGo('listen')}/>
      <Quick icon={BookMarked} label="Grammatik" onClick={() => onGo('grammar')}/>
      <Quick icon={Brain} label="Vokabeln" onClick={() => onGo('vocab')}/>
      <Quick icon={Map} label="Lernpfad" onClick={() => onGo('path')}/>
    </div>
  </div>
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="card"><div className="text-2xl font-black">{value}</div><div className="text-sm text-slate-500">{label}</div></div>
}

function Quick({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="card flex min-h-28 flex-col items-start justify-between text-left transition hover:-translate-y-0.5"><Icon/><span className="font-bold">{label}</span></button>
}

function LessonsView({ selected, setSelected, finish, progress, onExerciseResult }: { selected: number; setSelected: (id: number) => void; finish: (id: number) => void; progress: UserProgress; onExerciseResult: (exercise: Exercise, correct: boolean, meta: ExerciseResultMeta) => void }) {
  const lesson = lessons.find(item => item.id === selected) ?? lessons[0]
  const [step, setStep] = useState<'intro' | 'words' | 'grammar' | 'practice' | 'dialog'>('intro')
  const lessonExercises = exercises.filter(item => item.lesson === selected)

  return <div className="space-y-5">
    <div className="flex gap-2 overflow-x-auto pb-1">{lessons.map(item => <button key={item.id} onClick={() => { setSelected(item.id); setStep('intro') }} className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-bold ${selected === item.id ? 'bg-slate-950 text-white' : 'bg-white text-slate-600'}`}>Lektion {item.id}{progress.completedLessons.includes(item.id) ? ' ✓' : ''}</button>)}</div>
    <div className="card"><div className="flex items-center gap-2 text-sm font-bold text-lime-700"><span>{lesson.level ?? 'A1'}</span><span>·</span><span>Lektion {lesson.id}</span><span>·</span><span>{lesson.minutes} Min.</span></div><h2 className="mt-1 text-3xl font-black">{lesson.title}</h2><p className="mt-2 text-slate-600">{lesson.subtitle}</p><div className="mt-4 flex flex-wrap gap-2">{(lesson.skills ?? ['wortschatz','grammatik','sprechen']).map(skill => <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{skill}</span>)}</div></div>
    <div className="flex flex-wrap gap-2">{(['intro','words','grammar','practice','dialog'] as const).map(item => <button key={item} onClick={() => setStep(item)} className={`min-h-11 rounded-xl px-3 py-2 text-sm font-bold ${step === item ? 'bg-lime-200' : 'bg-white'}`}>{({ intro:'Ziele', words:'Wörter', grammar:'Grammatik', practice:'Üben', dialog:'Dialog' } as const)[item]}</button>)}</div>

    {step === 'intro' && <div className="card"><h3 className="text-xl font-black">Nach dieser Lektion kannst du …</h3><div className="mt-4 grid gap-2">{(lesson.objectives ?? lesson.focus).map(goal => <div key={goal} className="rounded-2xl bg-lime-50 p-3 font-semibold">✓ {goal}</div>)}</div><button onClick={() => setStep('words')} className="btn-primary mt-6">Los geht’s <ChevronRight size={18}/></button></div>}
    {step === 'words' && <div className="grid gap-3">{vocabulary.filter(item => item.lesson === selected).slice(0, 20).map(item => <div key={item.id} className="card flex items-start gap-3"><AudioButton text={item.audioText ?? item.sl} compact/><div className="min-w-0 flex-1"><div className="flex items-baseline justify-between gap-2"><div className="text-lg font-black">{item.sl}</div><div className="text-xs text-slate-400">{item.partOfSpeech}{item.gender ? ` · ${item.gender}` : ''}</div></div><div className="text-slate-600">{item.de}</div><div className="mt-2 rounded-xl bg-slate-50 p-3"><b>{item.example}</b><div className="text-sm text-slate-500">{item.exampleDe}</div></div></div></div>)}</div>}
    {step === 'grammar' && <div className="card"><div className="text-sm font-bold text-lime-700">Grammatik, praktisch</div><h3 className="mt-1 text-2xl font-black">{lesson.grammar.title}</h3><p className="mt-3 text-slate-600">{lesson.grammar.body}</p><div className="mt-4 space-y-2">{lesson.grammar.examples.map(example => <div key={example} className="rounded-2xl bg-lime-50 p-3 font-semibold">{example}</div>)}</div>{!!lesson.grammar.commonMistakes?.length && <div className="mt-4 rounded-2xl bg-amber-50 p-4"><div className="font-black">Häufige Fehler</div>{lesson.grammar.commonMistakes.map(item => <div key={item} className="mt-1 text-sm">• {item}</div>)}</div>}</div>}
    {step === 'practice' && <ExerciseDeck exercises={lessonExercises} onResult={onExerciseResult}/>} 
    {step === 'dialog' && <div className="space-y-4"><ConversationCard lesson={selected}/><button onClick={() => finish(selected)} className="btn-primary w-full justify-center">Lektion abschließen</button></div>}
  </div>
}

function ConversationCard({ lesson }: { lesson: number }) {
  const conversation = conversations.find(item => item.lesson === lesson)
  if (!conversation) return null
  return <div className="card"><div className="mb-4 flex items-center gap-2"><MessageCircle size={20}/><h3 className="text-xl font-black">{conversation.title}</h3></div><div className="space-y-3">{conversation.turns.map((turn, index) => <div key={index} className={`max-w-[94%] rounded-2xl p-3 ${turn.speaker === 'Tutor' ? 'bg-slate-100' : 'ml-auto bg-lime-100'}`}><div className="mb-1 text-xs font-bold uppercase text-slate-400">{turn.speaker}</div><div className="flex items-start gap-2"><span className="flex-1 font-semibold">{turn.sl}</span><AudioButton text={turn.sl} compact/></div>{turn.de && <div className="mt-1 text-sm text-slate-500">{turn.de}</div>}</div>)}</div></div>
}

function ReviewView({ progress, setProgress }: { progress: UserProgress; setProgress: (value: any) => void }) {
  const mistakeCounts = Object.fromEntries(progress.mistakes.map(item => [item.key, item.count]))
  const reviewIds = selectReviewQueue(progress.reviews, mistakeCounts, 10)
  const mistakes = [...progress.mistakes].sort((a, b) => b.count - a.count).map(item => item.key)
  const pool = exercises.filter(item => reviewIds.includes(item.id) || mistakes.includes(item.id))
  const selected = pool.length ? pool.slice(0, 10) : exercises.slice(0, 8)
  return <div className="space-y-5"><div className="card"><h2 className="text-3xl font-black">Wiederholen</h2><p className="mt-2 text-slate-600">Überfällige Inhalte, häufige Fehler und unsichere Antworten werden priorisiert. Derselbe Inhalt soll nicht stumpf direkt wiederholt werden.</p></div><ExerciseDeck exercises={selected} onResult={(exercise, correct, meta) => handleExercise(exercise, correct, meta, setProgress)}/></div>
}

function ListenView({ setProgress }: { setProgress: (value: any) => void }) {
  return <div className="space-y-5"><div className="card"><h2 className="text-3xl font-black">Hörverstehen</h2><p className="mt-2 text-slate-600">Langsam starten, dann auf normales Tempo wechseln. Gehörtes aktiv eintippen statt nur wiedererkennen.</p></div><ListeningPractice onComplete={correct => setProgress((current: UserProgress) => recordLearningTime({ ...current, listeningMinutes: +(current.listeningMinutes + 0.2).toFixed(1), skillXp: addXp(current.skillXp, ['hören'], correct ? 2 : 1) }, 0.2, correct))}/></div>
}

function SpeakView({ setProgress }: { setProgress: (value: any) => void }) {
  const [index, setIndex] = useState(0)
  const prompts = [
    { prompt: 'Kje si zdaj?', answer: 'Zdaj sem v Sloveniji.', accepted: ['Sem v Sloveniji.'] },
    { prompt: 'Od kod si?', answer: 'Sem iz Nemčije.', accepted: [] },
    { prompt: 'Kje živiš?', answer: 'Živim v Nemčiji.', accepted: ['V Nemčiji živim.'] },
    { prompt: 'Kaj piješ?', answer: 'Pijem vodo.', accepted: [] },
    { prompt: 'Kdaj greš spat?', answer: 'Grem spat ob desetih.', accepted: [] },
  ]
  const item = prompts[index]
  return <div className="space-y-5"><div className="card"><h2 className="text-3xl font-black">Sprechen</h2><p className="mt-2 text-slate-600">Frage hören → selbst antworten → Transkript prüfen → richtige Aussprache anhören → wiederholen.</p></div><SpeechPractice prompt={item.prompt} expected={item.answer} acceptedAnswers={item.accepted} onResult={correct => { setProgress((current: UserProgress) => recordLearningTime({ ...current, speakingMinutes: +(current.speakingMinutes + 0.2).toFixed(1), skillXp: addXp(current.skillXp, ['sprechen'], correct ? 2 : 1) }, 0.2, correct)); if (correct) setTimeout(() => setIndex((index + 1) % prompts.length), 900) }}/><TutorChat/></div>
}

function VocabView({ progress }: { progress: UserProgress }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Alle')
  const categories = ['Alle', ...Array.from(new Set(vocabulary.map(item => item.category)))]
  const list = useMemo(() => vocabulary.filter(item => (category === 'Alle' || item.category === category) && (`${item.sl} ${item.de}`.toLowerCase().includes(query.toLowerCase()))), [query, category])
  return <div className="space-y-4"><div className="card"><h2 className="text-3xl font-black">Vokabeln</h2><p className="mt-2 text-slate-600">{vocabulary.length} kuratierte Wörter/Phrasen sind aktuell im Lernbestand. Qualität und Formen werden schrittweise ausgebaut.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3.5 text-slate-400" size={18}/><input value={query} onChange={event => setQuery(event.target.value)} className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-3" placeholder="Slowenisch oder Deutsch …"/></div><select value={category} onChange={event => setCategory(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3">{categories.map(item => <option key={item}>{item}</option>)}</select></div></div><div className="grid gap-3 lg:grid-cols-2">{list.map(item => <div key={item.id} className="card flex gap-3"><AudioButton text={item.audioText ?? item.sl} compact/><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><b className="text-lg">{item.sl}</b><span className={`rounded-full px-2 py-1 text-xs ${progress.secureWords.includes(item.id) ? 'bg-lime-100' : 'bg-slate-100'}`}>{progress.secureWords.includes(item.id) ? 'sicher' : progress.wordsLearned.includes(item.id) ? 'gelernt' : 'neu'}</span></div><div className="text-slate-600">{item.de}</div><div className="mt-2 text-sm"><b>{item.example}</b><div className="text-slate-500">{item.exampleDe}</div></div></div></div>)}</div></div>
}

function addXp(current: UserProgress['skillXp'], skills: LearningSkill[], amount: number) {
  const next = { ...(current ?? {}) }
  for (const skill of skills) next[skill] = (next[skill] ?? 0) + amount
  return next
}

function handleExercise(exercise: Exercise, correct: boolean, meta: ExerciseResultMeta, setProgress: (value: any) => void) {
  setProgress((current: UserProgress) => {
    const reviews = scheduleReview(current.reviews, exercise.id, correct, meta.responseMs)
    const mistakes = correct ? current.mistakes : registerMistake(current.mistakes, exercise.id, meta.category)
    const skills = exercise.skills ?? (exercise.type === 'free' ? ['schreiben'] : ['grammatik', 'schreiben'])
    const updated = {
      ...current,
      reviews,
      mistakes,
      skillXp: addXp(current.skillXp, skills, correct ? 2 : 1),
    }
    return recordLearningTime(updated, 0.2, correct)
  })
}
