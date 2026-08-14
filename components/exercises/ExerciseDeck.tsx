'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronRight, Lightbulb } from 'lucide-react'
import { compareAnswer } from '@/lib/answerMatching'
import type { Exercise, MistakeCategory } from '@/types'

export type ExerciseResultMeta = {
  responseMs: number
  category?: MistakeCategory
}

export default function ExerciseDeck({
  exercises,
  onResult,
}: {
  exercises: Exercise[]
  onResult: (exercise: Exercise, correct: boolean, meta: ExerciseResultMeta) => void
}) {
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState(false)
  const [startedAt, setStartedAt] = useState(() => Date.now())

  const exercise = exercises[index % Math.max(1, exercises.length)]

  useEffect(() => {
    setStartedAt(Date.now())
  }, [index])

  const comparison = useMemo(() => compareAnswer({
    input: value,
    expected: exercise?.answer ?? '',
    acceptedAnswers: exercise?.acceptedAnswers,
    inputMode: 'typed',
    allowNumericShorthand: true,
  }), [exercise, value])

  if (!exercise) {
    return <div className="card">Für diese Lektion sind noch keine Übungen vorhanden.</div>
  }

  const isFree = exercise.evaluationMode === 'free' || (exercise.type === 'free' && !exercise.evaluationMode)
  const remember = !comparison.correct && comparison.category

  function insertSpecialChar(char: string) {
    setValue(current => current + char)
    setChecked(false)
  }

  function check() {
    if (!value.trim()) return
    setChecked(true)
    if (!isFree || comparison.correct) {
      onResult(exercise, comparison.correct, {
        responseMs: Math.max(250, Date.now() - startedAt),
        category: comparison.category,
      })
    }
  }

  function next() {
    setIndex(current => (current + 1) % exercises.length)
    setValue('')
    setChecked(false)
  }

  return <div className="card">
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm font-bold text-lime-700">Übung {index + 1} / {exercises.length}</div>
      <div className="flex gap-1.5">
        {(exercise.skills ?? ['schreiben']).map(skill => <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{skill}</span>)}
      </div>
    </div>

    <h3 className="mt-3 text-xl font-black">{exercise.prompt}</h3>
    {exercise.hint && <p className="mt-2 text-sm text-slate-500">Hinweis: {exercise.hint}</p>}

    <input
      value={value}
      onChange={event => { setValue(event.target.value); setChecked(false) }}
      onKeyDown={event => { if (event.key === 'Enter' && value.trim()) check() }}
      className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
      placeholder="Deine Antwort auf Slowenisch …"
      autoCapitalize="sentences"
      autoComplete="off"
      spellCheck={false}
    />

    <div className="mt-2 flex gap-2">
      {['č', 'š', 'ž'].map(char => <button
        key={char}
        type="button"
        onClick={() => insertSpecialChar(char)}
        className="touch-target rounded-xl border border-slate-200 bg-white px-4 py-2 font-black hover:bg-slate-50"
        aria-label={`${char.toUpperCase()} einfügen`}
      >{char.toUpperCase()}</button>)}
    </div>

    <button onClick={check} disabled={!value.trim()} className="btn-primary mt-4 w-full justify-center">Prüfen</button>

    {checked && <div className={`mt-4 rounded-2xl p-4 ${comparison.correct ? 'bg-lime-50 text-lime-950' : isFree ? 'bg-sky-50 text-sky-950' : 'bg-amber-50 text-amber-950'}`}>
      {comparison.correct ? <>
        <div className="flex items-center gap-2 font-black"><CheckCircle2 size={20}/> Pravilno! Genau richtig.</div>
        {comparison.reason === 'numeric-shorthand' && <p className="mt-2 text-sm">Die Ziffer wurde passend zur erwarteten slowenischen Zahlform erkannt.</p>}
      </> : isFree ? <>
        <div className="flex items-center gap-2 font-black"><Lightbulb size={20}/> Freie Antwort</div>
        <p className="mt-2 text-sm">Diese Aufgabe kann mehrere natürliche Antworten haben. Deine Eingabe wird deshalb nicht automatisch als Grammatikfehler gespeichert.</p>
        <div className="mt-3 text-sm text-slate-600">Eine mögliche Antwort:</div>
        <div className="font-bold">{exercise.answer}</div>
      </> : <>
        <div className="flex items-center gap-2 font-black"><AlertCircle size={20}/> Noch nicht.</div>
        <div className="mt-3 text-sm text-slate-600">Deine Antwort:</div>
        <div className="font-semibold">{value}</div>
        <div className="mt-2 text-sm text-slate-600">Richtig:</div>
        <div className="font-bold">{exercise.answer}</div>
        {(comparison.explanation || exercise.explanation) && <div className="mt-3 text-sm"><strong>Warum?</strong> {comparison.explanation ?? exercise.explanation}</div>}
        {remember && <div className="mt-3 rounded-xl bg-white/70 p-3 text-sm"><strong>Merken:</strong> Diesen Fehlertyp nehmen wir in deine Wiederholung auf.</div>}
      </>}

      <button onClick={next} className="mt-4 inline-flex min-h-11 items-center gap-2 font-bold underline">Nächste Aufgabe <ChevronRight size={17}/></button>
    </div>}
  </div>
}
