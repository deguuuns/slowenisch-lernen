'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronRight, Flag, Lightbulb, Sparkles } from 'lucide-react'
import AudioButton from '@/components/AudioButton'
import { compareAnswer } from '@/lib/answerMatching'
import {
  createSessionState,
  registerSessionOutcome,
  selectNextExercise,
  updateLearnerState,
  type SessionState,
} from '@/lib/learningEngine'
import { recordLearningTime, registerMistake, scheduleReview } from '@/lib/storage'
import type { Exercise, LearningSkill, MistakeCategory, UserProgress } from '@/types'

const SESSION_TARGET = 12

export default function AdaptiveLearningSession({
  progress,
  exercises,
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
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [showReason, setShowReason] = useState(false)

  const candidate = useMemo(
    () => selectNextExercise(progress, exercises, session),
    [progress, exercises, session],
  )

  const exercise = candidate?.exercise
  const comparison = useMemo(() => exercise ? compareAnswer({
    input: value,
    expected: exercise.answer,
    acceptedAnswers: exercise.acceptedAnswers,
    inputMode: 'typed',
    allowNumericShorthand: true,
  }) : null, [exercise, value])

  if (!candidate || !exercise || !comparison) {
    return <div className="card"><h2 className="text-2xl font-black">Keine passende Aufgabe gefunden.</h2><button onClick={onFinish} className="btn-primary mt-4">Zurück</button></div>
  }

  const isFree = exercise.evaluationMode === 'free'
  const done = session.answered >= SESSION_TARGET
  const elapsedMinutes = Math.max(1, Math.round((Date.now() - session.startedAt) / 60_000))

  if (done) {
    const accuracy = session.answered ? Math.round(session.correct / session.answered * 100) : 0
    return <div className="space-y-5">
      <div className="card bg-slate-950 text-white">
        <div className="text-sm font-bold text-lime-300">Session abgeschlossen</div>
        <h2 className="mt-2 text-3xl font-black">Dobro opravljeno.</h2>
        <p className="mt-3 text-slate-300">{session.answered} Aufgaben · {accuracy}% korrekt · ca. {elapsedMinutes} Min.</p>
        <button onClick={onFinish} className="mt-6 min-h-12 rounded-2xl bg-lime-300 px-5 py-3 font-black text-slate-950">Fertig</button>
      </div>
      <div className="card"><h3 className="font-black">Was die Engine heute berücksichtigt hat</h3><div className="mt-3 flex flex-wrap gap-2">{Array.from(new Set(session.history.flatMap(item => item.learningTargets))).slice(0, 10).map(target => <span key={target} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{target.replace(/^\w+:/, '')}</span>)}</div></div>
    </div>
  }

  function insertSpecialChar(char: string) {
    setValue(current => current + char)
    setChecked(false)
  }

  function check() {
    if (!value.trim()) return
    setChecked(true)
  }

  function continueSession() {
    const correct = isFree ? false : comparison.correct
    const responseMs = Math.max(250, Date.now() - startedAt)
    const category = comparison.category as MistakeCategory | undefined

    if (!isFree) {
      setProgress(current => {
        let next = updateLearnerState(current, exercise, { correct, responseMs, mistakeCategory: category })
        next = {
          ...next,
          reviews: scheduleReview(next.reviews, exercise.id, correct, responseMs),
          mistakes: correct ? next.mistakes : [
            ...registerMistake(next.mistakes, exercise.id, category),
          ],
          skillXp: addSkillXp(next.skillXp ?? {}, exercise.skills ?? ['schreiben'], correct),
          recentSessionHistory: [...(next.recentSessionHistory ?? []), {
            exerciseId: exercise.id,
            learningTargets: candidate.learningTargets,
            skills: exercise.skills ?? ['schreiben'],
            correct,
            timestamp: Date.now(),
            mistakeCategory: category,
            reason: candidate.reasons[0],
          }].slice(-60),
        }
        if (!correct && exercise.grammarTag) {
          next.mistakes = registerMistake(next.mistakes, `grammar:${exercise.grammarTag}`, category)
        }
        return recordLearningTime(next, Math.max(0.1, responseMs / 60_000), correct)
      })
    } else {
      setProgress(current => recordLearningTime(current, Math.max(0.1, responseMs / 60_000)))
    }

    setSession(current => registerSessionOutcome(current, candidate, {
      correct,
      responseMs,
      mistakeCategory: category,
    }))
    setValue('')
    setChecked(false)
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
        <div className="flex flex-wrap gap-1.5">{(exercise.skills ?? ['schreiben']).map(skill => <span key={skill} className="rounded-full bg-lime-50 px-2.5 py-1 text-xs font-bold text-lime-800">{skill}</span>)}</div>
        <button onClick={() => setShowReason(value => !value)} className="text-xs font-semibold text-slate-400">Warum diese Aufgabe?</button>
      </div>

      {showReason && <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600"><div className="font-bold text-slate-800">Auswahl der Lern-Engine</div>{candidate.reasons.slice(0, 4).map(reason => <div key={reason} className="mt-1">• {reason}</div>)}</div>}

      <h2 className="mt-4 text-2xl font-black">{exercise.prompt}</h2>
      {exercise.audioPrompt && <div className="mt-4"><AudioButton text={exercise.audioPrompt}/></div>}
      {exercise.hint && !checked && <p className="mt-2 text-sm text-slate-500">Hinweis: {exercise.hint}</p>}

      <input
        value={value}
        onChange={event => { setValue(event.target.value); setChecked(false) }}
        onKeyDown={event => { if (event.key === 'Enter' && value.trim()) check() }}
        className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
        placeholder="Deine Antwort auf Slowenisch …"
        autoComplete="off"
        spellCheck={false}
      />

      <div className="mt-2 flex gap-2">{['č','š','ž'].map(char => <button key={char} type="button" onClick={() => insertSpecialChar(char)} className="touch-target rounded-xl border border-slate-200 bg-white px-4 py-2 font-black">{char.toUpperCase()}</button>)}</div>

      {!checked && <button onClick={check} disabled={!value.trim()} className="btn-primary mt-4 w-full justify-center">Prüfen</button>}

      {checked && <div className={`mt-4 rounded-2xl p-4 ${comparison.correct ? 'bg-lime-50' : isFree ? 'bg-sky-50' : 'bg-amber-50'}`}>
        {comparison.correct ? <>
          <div className="flex items-center gap-2 font-black"><CheckCircle2 size={20}/> Richtig.</div>
          <p className="mt-2 text-sm">Die Engine erhöht die Sicherheit dieses Lernziels und plant es später wieder ein.</p>
        </> : isFree ? <>
          <div className="flex items-center gap-2 font-black"><Lightbulb size={20}/> Freie Produktion</div>
          <p className="mt-2 text-sm">Eine mögliche Antwort ist:</p><div className="mt-1 font-bold">{exercise.answer}</div>
          <p className="mt-2 text-xs text-slate-500">Freie Antworten werden ohne eindeutige Regel nicht als Fehler gespeichert.</p>
        </> : <>
          <div className="flex items-center gap-2 font-black"><AlertCircle size={20}/> Noch nicht.</div>
          <div className="mt-3 text-sm text-slate-500">Deine Antwort</div><div className="font-semibold">{value}</div>
          <div className="mt-2 text-sm text-slate-500">Richtig</div><div className="font-black">{exercise.answer}</div>
          {(comparison.explanation || exercise.explanation) && <div className="mt-3 text-sm"><strong>Warum?</strong> {comparison.explanation ?? exercise.explanation}</div>}
          <div className="mt-3 rounded-xl bg-white/70 p-3 text-sm"><strong>Was jetzt passiert:</strong> Das Lernziel wird höher priorisiert, aber nicht sofort mit derselben Aufgabe wiederholt.</div>
        </>}
        <button onClick={continueSession} className="btn-primary mt-4 w-full justify-center">Weiter <ChevronRight size={18}/></button>
      </div>}
    </div>

    <div className="flex items-center gap-2 rounded-2xl bg-white/70 p-3 text-xs text-slate-500"><Sparkles size={15}/><span>Die nächste Aufgabe wird erst nach deiner Antwort neu ausgewählt.</span></div>
  </div>
}

function addSkillXp(current: Partial<Record<LearningSkill, number>>, skills: LearningSkill[], correct: boolean) {
  const next = { ...current }
  for (const skill of skills) next[skill] = (next[skill] ?? 0) + (correct ? 3 : 1)
  return next
}
