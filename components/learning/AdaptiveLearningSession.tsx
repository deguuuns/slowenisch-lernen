'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronRight, Eye, Flag, Lightbulb, RotateCcw, Sparkles } from 'lucide-react'
import AudioButton from '@/components/AudioButton'
import SpeechPractice from '@/components/SpeechPractice'
import { exercises as diverseExercises } from '@/data/diverseContent'
import { compareAnswer } from '@/lib/answerMatching'
import { guidedHint } from '@/lib/guidedFeedback'
import {
  createSessionState,
  registerSessionOutcome,
  selectNextExercise,
  updateLearnerState,
  type SessionState,
} from '@/lib/learningEngine'
import { recordLearningTime, registerMistake, scheduleReview } from '@/lib/storage'
import type { Exercise, LearningSkill, MistakeCategory, UserProgress } from '@/types'

const SESSION_TARGET = 14

export default function AdaptiveLearningSession({
  progress,
  exercises: _legacyExercises,
  setProgress,
  onFinish,
}: {
  progress: UserProgress
  exercises: Exercise[]
  setProgress: (updater: (current: UserProgress) => UserProgress) => void
  onFinish: () => void
}) {
  const [session, setSession] = useState<SessionState>(() => createSessionState())
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState(false)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [showReason, setShowReason] = useState(false)

  const contentPool = useMemo(() => diverseExercises, [])
  const candidate = useMemo(() => selectNextExercise(progress, contentPool, session), [progress, contentPool, session])
  const exercise = candidate?.exercise
  const comparison = useMemo(() => exercise ? compareAnswer({
    input: value,
    expected: exercise.answer,
    acceptedAnswers: exercise.acceptedAnswers,
    inputMode: exercise.type === 'speak-answer' ? 'speech' : 'typed',
    allowNumericShorthand: exercise.type === 'speak-answer',
  }) : null, [exercise, value])

  if (!candidate || !exercise || !comparison) {
    return <div className="card"><h2 className="text-2xl font-black">Keine passende Aufgabe gefunden.</h2><button onClick={onFinish} className="btn-primary mt-4">Zurück</button></div>
  }

  const activeCandidate = candidate
  const activeExercise = exercise
  const activeComparison = comparison
  const isFree = activeExercise.evaluationMode === 'free'
  const isChoice = activeExercise.modality === 'choice' || activeExercise.type === 'choice' || activeExercise.type === 'listen-choice'
  const isSpeaking = activeExercise.modality === 'speaking' || activeExercise.type === 'speak-answer'
  const isListening = activeExercise.modality === 'listening' || activeExercise.type.startsWith('listen-')
  const done = session.answered >= SESSION_TARGET
  const elapsedMinutes = Math.max(1, Math.round((Date.now() - session.startedAt) / 60_000))
  const canContinue = isFree || activeComparison.correct || showSolution

  if (done) {
    const accuracy = session.answered ? Math.round(session.correct / session.answered * 100) : 0
    const modalities = Array.from(new Set(session.history.map(item => item.modality).filter(Boolean)))
    return <div className="space-y-5">
      <div className="card bg-slate-950 text-white">
        <div className="text-sm font-bold text-lime-300">Session abgeschlossen</div>
        <h2 className="mt-2 text-3xl font-black">Dobro opravljeno.</h2>
        <p className="mt-3 text-slate-300">{session.answered} Aufgaben · {accuracy}% korrekt · ca. {elapsedMinutes} Min.</p>
        <p className="mt-2 text-sm text-slate-400">Heute gemischt: {modalities.join(' · ') || 'Text'}</p>
        <button onClick={onFinish} className="mt-6 min-h-12 rounded-2xl bg-lime-300 px-5 py-3 font-black text-slate-950">Fertig</button>
      </div>
    </div>
  }

  function insertSpecialChar(char: string) {
    setValue(current => current + char)
    setChecked(false)
  }

  function check() {
    if (!value.trim()) return
    if (isFree) {
      setChecked(true)
      return
    }
    if (activeComparison.correct) {
      setChecked(true)
      return
    }
    const nextAttempts = wrongAttempts + 1
    setWrongAttempts(nextAttempts)
    setChecked(true)
    if (nextAttempts >= 3) setShowSolution(true)
  }

  function retry() {
    setChecked(false)
    setShowSolution(false)
  }

  function continueSession() {
    if (!canContinue) return
    const correct = isFree ? false : activeComparison.correct
    const responseMs = Math.max(250, Date.now() - startedAt)
    const category = activeComparison.category as MistakeCategory | undefined

    if (!isFree) {
      setProgress(current => {
        let next = updateLearnerState(current, activeExercise, { correct, responseMs, mistakeCategory: category })
        const modality = activeExercise.modality ?? (isListening ? 'listening' : isSpeaking ? 'speaking' : isChoice ? 'choice' : 'text')
        next = {
          ...next,
          reviews: scheduleReview(next.reviews, activeExercise.id, correct, responseMs),
          mistakes: correct ? next.mistakes : registerMistake(next.mistakes, activeExercise.id, category),
          skillXp: addSkillXp(next.skillXp ?? {}, activeExercise.skills ?? ['schreiben'], correct),
          listeningMinutes: isListening ? +(next.listeningMinutes + 0.2).toFixed(1) : next.listeningMinutes,
          speakingMinutes: isSpeaking ? +(next.speakingMinutes + 0.2).toFixed(1) : next.speakingMinutes,
          recentSessionHistory: [...(next.recentSessionHistory ?? []), {
            exerciseId: activeExercise.id,
            learningTargets: activeCandidate.learningTargets,
            skills: activeExercise.skills ?? ['schreiben'],
            correct,
            timestamp: Date.now(),
            mistakeCategory: category,
            reason: activeCandidate.reasons[0],
            exerciseType: activeExercise.type,
            modality,
            grammarTag: activeExercise.grammarTag,
            contentKey: activeExercise.contentKey ?? activeExercise.answer,
            contextTag: activeExercise.contextTag,
          }].slice(-80),
        }
        if (!correct && activeExercise.grammarTag) next.mistakes = registerMistake(next.mistakes, `grammar:${activeExercise.grammarTag}`, category)
        return recordLearningTime(next, Math.max(0.1, responseMs / 60_000), correct)
      })
    } else {
      setProgress(current => recordLearningTime(current, Math.max(0.1, responseMs / 60_000)))
    }

    setSession(current => registerSessionOutcome(current, activeCandidate, { correct, responseMs, mistakeCategory: category }))
    setValue('')
    setChecked(false)
    setWrongAttempts(0)
    setShowSolution(false)
    setStartedAt(Date.now())
    setShowReason(false)
  }

  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm font-bold text-slate-500">Persönliche Session · {session.answered + 1}/{SESSION_TARGET}</div>
      <button onClick={onFinish} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-white"><Flag size={16}/> Beenden</button>
    </div>

    <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-lime-400 transition-all" style={{ width: `${session.answered / SESSION_TARGET * 100}%` }}/></div>

    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(activeExercise.skills ?? ['schreiben']).map(skill => <span key={skill} className="rounded-full bg-lime-50 px-2.5 py-1 text-xs font-bold text-lime-800">{skill}</span>)}
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{isSpeaking ? 'Sprechen' : isListening ? 'Hören' : isChoice ? 'Auswahl' : 'Produktion'}</span>
        </div>
        <button onClick={() => setShowReason(current => !current)} className="text-xs font-semibold text-slate-400">Warum diese Aufgabe?</button>
      </div>

      {showReason && <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600"><div className="font-bold text-slate-800">Auswahl der Lern-Engine</div>{activeCandidate.reasons.slice(0, 5).map(reason => <div key={reason} className="mt-1 text-lime-800">+ {reason}</div>)}{activeCandidate.penalties.slice(0, 4).map(reason => <div key={reason} className="mt-1 text-amber-700">− {reason}</div>)}</div>}

      {isListening && <div className="mt-4 rounded-3xl bg-slate-950 p-5 text-white"><div className="text-xs font-bold uppercase tracking-[0.2em] text-lime-300">Nur hören – Text bleibt verborgen</div><div className="mt-3"><AudioButton text={activeExercise.audioPrompt ?? activeExercise.answer}/></div></div>}

      {!isSpeaking && <h2 className="mt-4 text-2xl font-black">{activeExercise.prompt}</h2>}
      {activeExercise.hint && !checked && !isListening && <p className="mt-2 text-sm text-slate-500">Hinweis: {activeExercise.hint}</p>}

      {isSpeaking ? <div className="mt-4"><SpeechPractice key={activeExercise.id} prompt={activeExercise.prompt} expected={activeExercise.answer} acceptedAnswers={activeExercise.acceptedAnswers} onResult={(_correct, actual) => { setValue(actual); setChecked(true) }}/></div> : isChoice ? <div className="mt-5 grid gap-2">
        {Array.from(new Set([...(activeExercise.alternatives ?? []), activeExercise.answer])).map(option => <button key={option} onClick={() => { setValue(option); setChecked(false) }} className={`min-h-12 rounded-2xl border px-4 py-3 text-left font-semibold ${value === option ? 'border-lime-500 bg-lime-50' : 'border-slate-200 bg-white'}`}>{option}</button>)}
        {!checked && <button onClick={check} disabled={!value} className="btn-primary mt-2 w-full justify-center">Prüfen</button>}
      </div> : <>
        <input value={value} onChange={event => { setValue(event.target.value); setChecked(false) }} onKeyDown={event => { if (event.key === 'Enter' && value.trim()) check() }} className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100" placeholder={isListening ? 'Was hast du gehört?' : 'Deine Antwort …'} autoComplete="off" spellCheck={false}/>
        <div className="mt-2 flex gap-2">{['č','š','ž'].map(char => <button key={char} type="button" onClick={() => insertSpecialChar(char)} className="touch-target rounded-xl border border-slate-200 bg-white px-4 py-2 font-black">{char.toUpperCase()}</button>)}</div>
        {!checked && <button onClick={check} disabled={!value.trim()} className="btn-primary mt-4 w-full justify-center">Prüfen</button>}
      </>}

      {checked && !isSpeaking && <GuidedFeedback correct={activeComparison.correct} isFree={isFree} value={value} exercise={activeExercise} category={activeComparison.category as MistakeCategory | undefined} wrongAttempts={wrongAttempts} showSolution={showSolution} onRetry={retry} onShowSolution={() => setShowSolution(true)}/>} 

      {checked && canContinue && <button onClick={continueSession} className="btn-primary mt-4 w-full justify-center">Nächste passende Aufgabe <ChevronRight size={18}/></button>}
    </div>

    <div className="flex items-center gap-2 rounded-2xl bg-white/70 p-3 text-xs text-slate-500"><Sparkles size={15}/><span>Nach jeder Antwort werden Lernwert und Abwechslung neu berechnet.</span></div>
  </div>
}

function GuidedFeedback({ correct, isFree, value, exercise, category, wrongAttempts, showSolution, onRetry, onShowSolution }: { correct: boolean; isFree: boolean; value: string; exercise: Exercise; category?: MistakeCategory; wrongAttempts: number; showSolution: boolean; onRetry: () => void; onShowSolution: () => void }) {
  if (correct) return <div className="mt-4 rounded-2xl bg-lime-50 p-4"><div className="flex items-center gap-2 font-black"><CheckCircle2 size={20}/> Richtig.</div></div>

  if (isFree) return <div className="mt-4 rounded-2xl bg-sky-50 p-4"><div className="flex items-center gap-2 font-black"><Lightbulb size={20}/> Freie Produktion</div><p className="mt-2 text-sm">Deine persönliche Antwort wird hier nicht gegen eine einzige erfundene Musterantwort als falsch bewertet.</p>{showSolution ? <><p className="mt-3 text-sm text-slate-500">Beispielantwort:</p><div className="font-bold">{exercise.answer}</div></> : <button onClick={onShowSolution} className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold underline"><Eye size={17}/> Beispielantwort anzeigen</button>}</div>

  const stage = Math.min(2, Math.max(1, wrongAttempts)) as 1 | 2
  return <div className="mt-4 rounded-2xl bg-amber-50 p-4">
    <div className="flex items-center gap-2 font-black"><AlertCircle size={20}/> Noch nicht ganz.</div>
    {!showSolution ? <>
      <p className="mt-3 text-sm"><strong>Hinweis {stage}/2:</strong> {guidedHint(category, value, exercise.answer, stage)}</p>
      <p className="mt-2 text-xs text-amber-800">Die vollständige Lösung bleibt zunächst verborgen, damit du selbst korrigieren kannst.</p>
      <div className="mt-4 flex flex-wrap gap-2"><button onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 font-bold"><RotateCcw size={17}/> Noch einmal versuchen</button><button onClick={onShowSolution} className="inline-flex min-h-11 items-center gap-2 px-3 py-2 text-sm font-bold text-slate-500"><Eye size={17}/> Lösung zeigen</button></div>
    </> : <>
      <div className="mt-3 text-sm text-slate-500">Lösung</div><div className="text-lg font-black">{exercise.answer}</div>{exercise.explanation && <div className="mt-3 text-sm"><strong>Warum?</strong> {exercise.explanation}</div>}
    </>}
  </div>
}

function addSkillXp(current: Partial<Record<LearningSkill, number>>, skills: LearningSkill[], correct: boolean) {
  const next = { ...current }
  for (const skill of skills) next[skill] = (next[skill] ?? 0) + (correct ? 3 : 1)
  return next
}
