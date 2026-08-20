'use client'

import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Brain,
  ChevronRight,
  Flame,
  GraduationCap,
  Headphones,
  Home,
  LucideIcon,
  Mic2,
  RotateCcw,
  Search,
  Sparkles,
  Trophy,
} from 'lucide-react'
import AccountMenu from '@/components/AccountMenu'
import AudioButton from '@/components/AudioButton'
import ExerciseDeck, { ExerciseResultMeta } from '@/components/ExerciseDeck'
import LessonFlow from '@/components/LessonFlow'
import Onboarding from '@/components/Onboarding'
import SpeechPractice, { SpeechResultMeta } from '@/components/SpeechPractice'
import TutorChat from '@/components/TutorChat'
import { exercises, lessons, vocabulary } from '@/data/seed'
import { buildAdaptiveRecommendation } from '@/lib/adaptive-curriculum'
import {
  CloudSession,
  ensureProfile,
  loadCloudProgress,
  loadSession,
  mergeProgress,
  saveCloudProgress,
} from '@/lib/cloud-sync'
import { createExerciseSession } from '@/lib/exercise-session'
import { getVocabularyStatus, reconcileVocabularyProgress } from '@/lib/learner-status'
import { buildSessionPlan, exercisesForPlan } from '@/lib/session-planner'
import {
  clearGuestProgress,
  defaultProgress,
  hasMeaningfulProgress,
  isActiveProduction,
  loadProgress,
  queueTransfers,
  recordAttempt,
  registerMistake,
  saveProgress,
  scheduleReview,
  updateMastery,
  updateSkillMastery,
} from '@/lib/storage'
import { Exercise, LearnerPreferences, UserProgress } from '@/types'

type Tab = 'home' | 'lesson' | 'review' | 'speak' | 'vocab' | 'progress'
type ProgressSetter = Dispatch<SetStateAction<UserProgress>>

type NavItem = { id: Tab; label: string; icon: LucideIcon }
const nav: NavItem[] = [
  { id: 'home', label: 'Start', icon: Home },
  { id: 'lesson', label: 'Lektionen', icon: BookOpen },
  { id: 'review', label: 'Wiederholen', icon: RotateCcw },
  { id: 'speak', label: 'Sprechen', icon: Mic2 },
  { id: 'vocab', label: 'Vokabeln', icon: Brain },
  { id: 'progress', label: 'Fortschritt', icon: Trophy },
]

function errorText(error: unknown) {
  return error instanceof Error ? error.message : ''
}

export default function Page() {
  const [tab, setTab] = useState<Tab>('home')
  const [progress, setProgress] = useState<UserProgress>(defaultProgress)
  const [lessonId, setLessonId] = useState(1)
  const [session, setSession] = useState<CloudSession | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [progressScope, setProgressScope] = useState<string | null>(null)
  const [syncState, setSyncState] = useState('nur lokal')
  const hydrated = useRef(false)
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const saved = loadSession()
    const scope = saved?.user.id || null
    setSession(saved)
    setProgressScope(scope)
    setProgress(loadProgress(scope))
    hydrated.current = true
  }, [])

  useEffect(() => {
    if (hydrated.current) saveProgress(progress, progressScope)
  }, [progress, progressScope])

  useEffect(() => {
    if (!session) {
      setProfileId(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        setSyncState('verbinde …')
        const profile = await ensureProfile(session)
        if (cancelled) return
        setProfileId(profile.id)
        const userLocal = loadProgress(session.user.id)
        const cloud = await loadCloudProgress(session, profile.id)
        if (cancelled) return

        let merged: UserProgress
        if (cloud) merged = mergeProgress(userLocal, cloud)
        else if (hasMeaningfulProgress(userLocal)) merged = userLocal
        else {
          const guest = loadProgress(null)
          merged = hasMeaningfulProgress(guest) ? mergeProgress(userLocal, guest) : userLocal
          if (hasMeaningfulProgress(guest)) clearGuestProgress()
        }

        setProgressScope(session.user.id)
        setProgress(merged)
        saveProgress(merged, session.user.id)
        setSyncState(
          `synchronisiert · ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`,
        )
      } catch (error) {
        console.error('Cloud sync connection failed')
        setSyncState(errorText(error).includes('abgelaufen') ? 'Anmeldung erforderlich' : 'offline – lokal gespeichert')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    if (!session || !profileId || progressScope !== session.user.id || !hydrated.current) return
    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(async () => {
      try {
        setSyncState('synchronisiere …')
        await saveCloudProgress(session, profileId, progress)
        setSyncState(
          `synchronisiert · ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`,
        )
      } catch {
        console.error('Cloud sync save failed')
        setSyncState('offline – lokal gespeichert')
      }
    }, 1200)
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current)
    }
  }, [progress, session, profileId, progressScope])

  const activeLesson = Math.min(
    5,
    Math.max(1, [...progress.completedLessons, 0].sort((a, b) => b - a)[0] + 1),
  )

  function handleSession(next: CloudSession | null) {
    if (!next) {
      if (progressScope) saveProgress(progress, progressScope)
      setProgressScope(null)
      setProgress(loadProgress(null))
      setProfileId(null)
      setSyncState('nur lokal')
    }
    setSession(next)
  }

  function finishLesson(id: number) {
    setProgress(previous => ({
      ...previous,
      completedLessons: Array.from(new Set([...previous.completedLessons, id])),
      updatedAt: Date.now(),
    }))
    setTab('progress')
  }

  function startAdaptive() {
    const recommendation = buildAdaptiveRecommendation(progress, exercises, vocabulary, activeLesson)
    if (recommendation.kind === 'review' || recommendation.kind === 'strengthen') setTab('review')
    else if (recommendation.kind === 'speaking') setTab('speak')
    else {
      setLessonId(recommendation.lessonId || activeLesson)
      setTab('lesson')
    }
  }

  function setPreferences(preferences: LearnerPreferences) {
    const now = Date.now()
    setProgress(previous => ({ ...previous, preferences, preferencesUpdatedAt: now, updatedAt: now }))
  }

  return (
    <main className="min-h-screen min-w-0 max-w-full overflow-x-hidden pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-8">
      <div className="mx-auto w-full min-w-0 max-w-6xl px-3 py-5 sm:px-4 md:px-8 md:py-8">
        <Header
          streak={progress.streak}
          session={session}
          syncState={syncState}
          preferences={progress.preferences}
          onSession={handleSession}
          onPreferences={setPreferences}
        />
        <div className="mt-6 grid min-w-0 gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden md:block"><DesktopNav tab={tab} setTab={setTab} /></aside>
          <section className="min-w-0 max-w-full">
            {tab === 'home' && <HomeView progress={progress} activeLesson={activeLesson} onContinue={startAdaptive} onGo={setTab} />}
            {tab === 'lesson' && <LessonArea lessonId={lessonId} setLessonId={setLessonId} progress={progress} setProgress={setProgress} finishLesson={finishLesson} />}
            {tab === 'review' && <ReviewView progress={progress} activeLesson={activeLesson} setProgress={setProgress} />}
            {tab === 'speak' && <SpeakView setProgress={setProgress} />}
            {tab === 'vocab' && <VocabView progress={progress} />}
            {tab === 'progress' && <ProgressView progress={progress} cloud={Boolean(session)} syncState={syncState} />}
          </section>
        </div>
      </div>
      <MobileNav tab={tab} setTab={setTab} />
      <Onboarding preferences={progress.preferences} onSave={setPreferences} />
    </main>
  )
}

function Header({ streak, session, syncState, preferences, onSession, onPreferences }: {
  streak: number
  session: CloudSession | null
  syncState: string
  preferences: LearnerPreferences
  onSession: (session: CloudSession | null) => void
  onPreferences: (preferences: LearnerPreferences) => void
}) {
  return (
    <header className="flex min-w-0 items-start justify-between gap-2 sm:items-center sm:gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold uppercase tracking-[0.24em] text-lime-700">Slovensko</div>
        <h1 className="min-w-0 break-words text-xl font-black tracking-tight sm:text-2xl [overflow-wrap:anywhere]">Slowenisch, das du wirklich sprichst.</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 shadow-soft sm:flex"><Flame size={18} /><span className="font-bold">{streak}</span><span className="text-sm text-slate-500">Tage</span></div>
        <AccountMenu session={session} syncState={syncState} preferences={preferences} onSession={onSession} onPreferences={onPreferences} />
      </div>
    </header>
  )
}

function DesktopNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  return <nav className="sticky top-6 space-y-1 rounded-3xl bg-white p-3 shadow-soft">{nav.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-semibold ${tab === item.id ? 'bg-lime-200 text-slate-950' : 'text-slate-600 hover:bg-slate-50'}`}><item.icon size={19} />{item.label}</button>)}</nav>
}

function MobileNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  return <nav className="fixed inset-x-0 bottom-0 z-50 grid min-w-0 grid-cols-6 border-t border-slate-200 bg-white/95 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">{nav.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[9px] font-semibold sm:text-[10px] ${tab === item.id ? 'text-lime-700' : 'text-slate-500'}`} aria-label={item.label}><item.icon size={19} /><span className="max-w-full truncate">{item.label}</span></button>)}</nav>
}

function HomeView({ progress, activeLesson, onContinue, onGo }: { progress: UserProgress; activeLesson: number; onContinue: () => void; onGo: (tab: Tab) => void }) {
  const due = progress.reviews.filter(review => review.dueAt <= Date.now()).length
  const weak = Object.values(progress.mastery || {}).filter(item => item.attempts >= 2 && item.score < .58).length
  const recommendation = buildAdaptiveRecommendation(progress, exercises, vocabulary, activeLesson)
  const plan = buildSessionPlan(progress, exercises, activeLesson)
  return <div className="min-w-0 space-y-6"><div className="min-w-0 overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-soft sm:p-6 md:p-8"><div className="min-w-0 max-w-2xl"><div className="mb-2 text-sm font-semibold text-lime-300">Dein adaptiver Lernplan</div><h2 className="break-words text-2xl font-black sm:text-3xl md:text-5xl [overflow-wrap:anywhere]">Heute genau das, <span className="text-lime-300">was dir am meisten bringt.</span></h2><p className="mt-4 max-w-xl break-words text-slate-300">Antworttempo, Hilfen, aktive Produktion und dein Tagesziel fließen in die Auswahl ein.</p><button onClick={onContinue} className="mt-6 inline-flex min-h-11 items-center gap-2 whitespace-normal rounded-2xl bg-lime-300 px-5 py-3 font-black text-slate-950">Empfehlung starten <ChevronRight /></button></div></div><div className="card min-w-0 border-2 border-lime-200"><div className="flex items-center gap-2 text-sm font-bold text-lime-700"><Sparkles size={18} />Heute empfohlen</div><h3 className="mt-2 break-words text-2xl font-black">{recommendation.title}</h3><p className="mt-2 break-words text-slate-600">{recommendation.reason}</p><div className="mt-4 break-words text-xs font-semibold uppercase tracking-wide text-slate-400">ca. {plan.total} Aufgaben · Tagesziel {progress.preferences.dailyGoalMinutes} min</div></div><div className="grid min-w-0 gap-3 sm:grid-cols-4"><Metric icon={Brain} value={`${progress.wordsLearned.length} / 120`} label="Gelernter Wortschatz" /><Metric icon={RotateCcw} value={String(due)} label="Heute fällig" /><Metric icon={Sparkles} value={String(weak)} label="Schwache Bereiche" /><Metric icon={GraduationCap} value={`${progress.completedLessons.length} / 5`} label="Lektionen" /></div><div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4"><Quick icon={RotateCcw} label="Wiederholen" onClick={() => onGo('review')} /><Quick icon={Mic2} label="Sprechen" onClick={() => onGo('speak')} /><Quick icon={Brain} label="Vokabeln" onClick={() => onGo('vocab')} /><Quick icon={Trophy} label="Fortschritt" onClick={() => onGo('progress')} /></div></div>
}

function Metric({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return <div className="card min-w-0"><Icon className="mb-3" size={20} /><div className="break-words text-2xl font-black">{value}</div><div className="break-words text-sm text-slate-500">{label}</div></div>
}

function Quick({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="card flex min-h-28 min-w-0 flex-col items-start justify-between text-left"><Icon /><span className="break-words font-bold">{label}</span></button>
}

function LessonArea({ lessonId, setLessonId, progress, setProgress, finishLesson }: { lessonId: number; setLessonId: (id: number) => void; progress: UserProgress; setProgress: ProgressSetter; finishLesson: (id: number) => void }) {
  return <div className="min-w-0 space-y-4"><div className="flex max-w-full gap-2 overflow-x-auto pb-1">{lessons.map(lesson => <button key={lesson.id} onClick={() => setLessonId(lesson.id)} className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-bold ${lessonId === lesson.id ? 'bg-slate-950 text-white' : 'bg-white text-slate-600'}`}>Lektion {lesson.id}{progress.completedLessons.includes(lesson.id) ? ' ✓' : ''}</button>)}</div><LessonFlow key={lessonId} lessonId={lessonId} progress={progress} setProgress={setProgress} onExerciseResult={(exercise, correct, meta) => handleExercise(exercise, correct, meta, setProgress)} onFinish={() => finishLesson(lessonId)} /></div>
}

function ReviewView({ progress, activeLesson, setProgress }: { progress: UserProgress; activeLesson: number; setProgress: ProgressSetter }) {
  const [plan] = useState(() => buildSessionPlan(progress, exercises, activeLesson))
  const [reviewSession] = useState(() => createExerciseSession('review', exercisesForPlan(buildSessionPlan(progress, exercises, activeLesson), exercises), `review:${activeLesson}:${Date.now()}`))
  const weak = Object.values(progress.mastery || {}).filter(item => item.attempts >= 2 && item.score < .58).sort((a, b) => a.score - b.score).slice(0, 3)
  return <div className="min-w-0 space-y-5"><div className="card min-w-0"><div className="text-sm font-bold text-lime-700">Adaptive Sitzung</div><h2 className="mt-1 break-words text-2xl font-black sm:text-3xl">Plan bleibt für diese Sitzung stabil</h2><p className="mt-2 break-words text-slate-600">{plan.review} Wiederholungen · {plan.transfer} Transfer · {plan.weakGrammar + plan.weakVocabulary} schwache Bereiche · {plan.newContent} neuer Inhalt.</p>{weak.length > 0 && <div className="mt-4 flex min-w-0 flex-wrap gap-2">{weak.map(item => <span key={item.key} className="max-w-full break-words rounded-full bg-amber-50 px-3 py-2 text-sm font-semibold [overflow-wrap:anywhere]">{item.key.replace(/^(vocab|grammar|skill|verb):/, '')} · {Math.round(item.score * 100)}%</span>)}</div>}</div><ExerciseDeck key={reviewSession.sessionId} session={reviewSession} onResult={(exercise, correct, meta) => handleExercise(exercise, correct, meta, setProgress)} /></div>
}

function SpeakView({ setProgress }: { setProgress: ProgressSetter }) {
  const [index, setIndex] = useState(0)
  const prompts = [['Kje si zdaj?', 'Zdaj sem v Sloveniji.'], ['Od kod si?', 'Sem iz Nemčije.'], ['Kje živiš?', 'Živim v Nemčiji.'], ['Kaj piješ?', 'Pijem vodo.'], ['Kdaj greš spat?', 'Grem spat ob desetih.']]
  function result(correct: boolean, _actual: string, meta: SpeechResultMeta) {
    setProgress(previous => ({ ...previous, speakingMinutes: +(previous.speakingMinutes + .2).toFixed(1), mastery: updateSkillMastery(previous.mastery || {}, 'speaking', correct, meta.responseMs, meta.replays + (meta.usedSlowAudio ? 1 : 0)), updatedAt: Date.now() }))
    if (correct) setTimeout(() => setIndex(value => (value + 1) % prompts.length), 900)
  }
  return <div className="min-w-0 space-y-5"><div className="card min-w-0"><h2 className="break-words text-2xl font-black sm:text-3xl">Sprechen</h2><p className="mt-2 break-words text-slate-600">Speech-to-Text liefert nur die Transkription; grammatisch bewertet weiterhin die Answer Evaluation Engine.</p></div><SpeechPractice prompt={prompts[index][0]} expected={prompts[index][1]} onResult={result} /><TutorChat /></div>
}

function VocabView({ progress }: { progress: UserProgress }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Alle')
  const categories = ['Alle', ...Array.from(new Set(vocabulary.map(item => item.category)))]
  const list = useMemo(() => vocabulary.filter(item => (category === 'Alle' || item.category === category) && (`${item.sl} ${item.de}`.toLowerCase().includes(query.toLowerCase()))), [query, category])
  return <div className="min-w-0 space-y-4"><div className="card min-w-0"><h2 className="break-words text-2xl font-black sm:text-3xl">Vokabeln</h2><p className="mt-2 break-words text-slate-600">Status wird aus Einführung, Mastery, aktiver Produktion und Wiederholungen abgeleitet.</p><div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"><div className="relative min-w-0"><Search className="absolute left-3 top-3.5 text-slate-400" size={18} /><input value={query} onChange={event => setQuery(event.target.value)} className="w-full min-w-0 rounded-2xl border border-slate-200 py-3 pl-10 pr-3 text-base" placeholder="Slowenisch oder Deutsch …" aria-label="Vokabeln durchsuchen" /></div><select value={category} onChange={event => setCategory(event.target.value)} className="w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-3 text-base sm:w-auto" aria-label="Kategorie">{categories.map(item => <option key={item}>{item}</option>)}</select></div></div><div className="grid min-w-0 gap-3 lg:grid-cols-2">{list.map(item => <div key={item.id} className="card flex min-w-0 flex-col gap-3 sm:flex-row"><AudioButton text={item.sl} compact /><div className="min-w-0 flex-1"><div className="flex min-w-0 flex-wrap justify-between gap-2"><b className="break-words text-lg [overflow-wrap:anywhere]">{item.sl}</b><span className="max-w-full break-words rounded-full bg-slate-100 px-2 py-1 text-xs">{getVocabularyStatus(item.id, progress)}</span></div><div className="break-words text-slate-600 [overflow-wrap:anywhere]">{item.de}</div><div className="mt-2 min-w-0 text-sm"><b className="break-words [overflow-wrap:anywhere]">{item.example}</b><div className="break-words text-slate-500 [overflow-wrap:anywhere]">{item.exampleDe}</div></div></div></div>)}</div></div>
}

function ProgressView({ progress, cloud, syncState }: { progress: UserProgress; cloud: boolean; syncState: string }) {
  const top = [...progress.mistakes].sort((a, b) => b.count - a.count).slice(0, 5)
  const weak = Object.values(progress.mastery || {}).filter(item => item.attempts >= 2).sort((a, b) => a.score - b.score).slice(0, 5)
  const recent = progress.recentAttempts || []
  const average = recent.length ? Math.round(recent.slice(-20).reduce((sum, item) => sum + item.responseMs, 0) / Math.min(20, recent.length) / 1000) : 0
  return <div className="min-w-0 space-y-5"><div className="card min-w-0"><h2 className="break-words text-2xl font-black sm:text-3xl">Fortschritt</h2><p className="mt-2 break-words text-slate-600">{cloud ? `Cloud-Sync: ${syncState}. Lokale Offline-Kopie bleibt erhalten.` : 'Dein Fortschritt ist lokal gespeichert. Über „Konto“ kannst du Geräte-Synchronisation aktivieren.'}</p></div><div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={Brain} value={`${progress.wordsLearned.length}`} label="gelernte Wörter" /><Metric icon={Trophy} value={`${progress.secureWords.length}`} label="sichere Wörter" /><Metric icon={Mic2} value={`${Math.round((progress.mastery?.['skill:speaking']?.score || 0) * 100)} %`} label="Sprech-Mastery" /><Metric icon={Headphones} value={average ? `${average} s` : '–'} label="Ø Antwortzeit" /></div><div className="grid min-w-0 gap-4 lg:grid-cols-2"><div className="card min-w-0"><h3 className="break-words text-xl font-black">Häufigste Fehler</h3>{top.length ? <div className="mt-4 space-y-2">{top.map(item => <div key={item.key} className="flex min-w-0 flex-wrap justify-between gap-2 rounded-2xl bg-amber-50 p-3"><span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{exercises.find(exercise => exercise.id === item.key)?.prompt ?? item.key}</span><b className="shrink-0">{item.count}×</b></div>)}</div> : <p className="mt-3 text-slate-500">Noch keine Fehler gespeichert.</p>}</div><div className="card min-w-0"><h3 className="break-words text-xl font-black">Adaptive Schwerpunkte</h3>{weak.length ? <div className="mt-4 space-y-2">{weak.map(item => <div key={item.key} className="flex min-w-0 flex-wrap justify-between gap-2 rounded-2xl bg-lime-50 p-3"><span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">{item.key.replace(/^(vocab|grammar|skill|verb):/, '')}</span><b className="shrink-0">{Math.round(item.score * 100)} %</b></div>)}</div> : <p className="mt-3 text-slate-500">Nach einigen Übungen erkennt die App hier deine schwächeren Bereiche.</p>}</div></div></div>
}

function handleExercise(exercise: Exercise, correct: boolean, meta: ExerciseResultMeta, setProgress: ProgressSetter) {
  setProgress(previous => {
    const attemptCount = (previous.recentAttempts?.length || 0) + 1
    const now = Date.now()
    let reviews = scheduleReview(previous.reviews, exercise.id, correct)
    for (const id of exercise.vocabularyIds || []) reviews = scheduleReview(reviews, `vocab:${id}`, correct)
    for (const id of exercise.grammarRuleIds || []) reviews = scheduleReview(reviews, `grammar:${id}`, correct)
    const mastery = updateMastery(previous.mastery || {}, exercise, correct, meta.responseMs, meta.hintsUsed)
    const attempt = { exerciseId: exercise.id, correct, responseMs: meta.responseMs, hintsUsed: meta.hintsUsed, occurredAt: now, vocabularyIds: exercise.vocabularyIds || [], grammarRuleIds: exercise.grammarRuleIds || [], skillTargets: exercise.skillTargets || [], activeProduction: isActiveProduction(exercise) }
    const next: UserProgress = { ...previous, reviews, mistakes: correct ? previous.mistakes : registerMistake(previous.mistakes, exercise.id), mastery, recentAttempts: recordAttempt(previous.recentAttempts || [], attempt), transferQueue: queueTransfers(previous.transferQueue || [], exercise, correct, attemptCount), updatedAt: now }
    return reconcileVocabularyProgress(next, exercise.vocabularyIds || [])
  })
}
