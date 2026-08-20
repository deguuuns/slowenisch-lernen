'use client'

import { useEffect, useRef, useState } from 'react'
import { evaluateAnswer, EvaluationResult } from '@/lib/answer-evaluation'
import {
  ExerciseSession,
  ExerciseSessionResult,
  SessionExercise,
  sessionSummary,
  validateCompletedSession,
} from '@/lib/exercise-session'
import { Exercise } from '@/types'

export type ExerciseResultMeta = { responseMs: number; hintsUsed: number }

export default function ExerciseDeck({ session, onResult, onComplete }: {
  session: ExerciseSession
  onResult: (exercise: Exercise, correct: boolean, meta: ExerciseResultMeta) => void
  onComplete?: () => void
}) {
  const [index, setIndex] = useState(0)
  const [retryIndex, setRetryIndex] = useState(0)
  const [retryQueue, setRetryQueue] = useState<SessionExercise[]>([])
  const [inRetry, setInRetry] = useState(false)
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState(false)
  const [finished, setFinished] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [results, setResults] = useState<ExerciseSessionResult[]>([])
  const resultsRef = useRef<ExerciseSessionResult[]>([])
  const startedAt = useRef(Date.now())

  const item = inRetry ? retryQueue[retryIndex] : session.exercises[index]
  const exercise = item?.exercise

  useEffect(() => {
    setIndex(0)
    setRetryIndex(0)
    setRetryQueue([])
    setInRetry(false)
    setValue('')
    setChecked(false)
    setFinished(false)
    setShowHint(false)
    setEvaluation(null)
    setResults([])
    resultsRef.current = []
    startedAt.current = Date.now()
  }, [session.sessionId])

  useEffect(() => {
    startedAt.current = Date.now()
    setValue('')
    setChecked(false)
    setShowHint(false)
    setEvaluation(null)
  }, [item?.id, inRetry])

  if (!session.exercises.length) return <div className="card">Für diese Sitzung sind noch keine Übungen vorhanden.</div>

  if (finished) {
    const issues = validateCompletedSession(session, results)
    if (issues.length) {
      return <div className="card min-w-0 border border-red-200 bg-red-50"><h3 className="break-words text-xl font-black [overflow-wrap:anywhere]">Diese Sitzung konnte nicht korrekt abgeschlossen werden.</h3><p className="mt-2 break-words text-sm text-slate-700 [overflow-wrap:anywhere]">Die Ergebniszählung war inkonsistent. Dein Lernfortschritt wurde pro beantworteter Aufgabe gespeichert, aber es wird bewusst keine falsche Abschlussstatistik angezeigt.</p></div>
    }

    const summary = sessionSummary(session, results)
    const average = Math.round(results.reduce((sum, result) => sum + result.responseMs, 0) / results.length / 1000)
    const words = new Set(results.filter(result => result.correct).flatMap(result => result.vocabularyIds)).size
    const grammarErrors = new Set(results.filter(result => !result.correct).flatMap(result => result.grammarRuleIds)).size
    return <div className="card min-w-0 overflow-hidden"><div className="text-sm font-bold text-lime-700">Heute geschafft</div><h3 className="mt-2 break-words text-2xl font-black">Sitzung abgeschlossen</h3><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric value={summary.total} label="Aufgaben" className="bg-lime-50" /><Metric value={summary.correct} label="richtig" className="bg-lime-50" /><Metric value={summary.wrong} label="Fehler" className="bg-amber-50" /><Metric value={`${average} s`} label="Ø Antwort" className="bg-slate-50" /></div><p className="mt-4 break-words text-sm text-slate-600">{words} Wörter aktiv geübt{grammarErrors ? ` · ${grammarErrors} Grammatikbereich${grammarErrors === 1 ? '' : 'e'} bleiben im Fokus.` : '.'}</p>{onComplete && <button onClick={onComplete} className="btn-primary mt-5 w-full justify-center whitespace-normal">Weiter</button>}</div>
  }

  function evaluate(answer: string): EvaluationResult {
    if (exercise.type === 'choice') {
      const selected = item.options.find(option => option.text === answer)
      const correct = Boolean(selected?.correct)
      return { classification: correct ? 'CORRECT' : 'WRONG_MEANING', isCorrect: correct, normalizedInput: answer, normalizedExpected: exercise.answer, issues: [], explanation: correct ? undefined : `Richtig ist: ${exercise.answer}` }
    }
    return evaluateAnswer({ input: answer, expected: exercise.answer, alternatives: exercise.acceptedAnswers })
  }

  function submit(answer = value) {
    if (!exercise || !answer.trim() || checked) return
    const result = evaluate(answer)
    const responseMs = Math.max(250, Date.now() - startedAt.current)
    const hintsUsed = showHint ? 1 : 0

    if (!inRetry) {
      const nextResult: ExerciseSessionResult = { sessionExerciseId:item.id, sourceExerciseId:item.sourceExerciseId, correct:result.isCorrect, responseMs, vocabularyIds:exercise.vocabularyIds || [], grammarRuleIds:exercise.grammarRuleIds || [] }
      const previous = resultsRef.current
      if (previous.some(row => row.sessionExerciseId === item.id)) return
      const nextResults = [...previous, nextResult]
      if (nextResults.length > session.exercises.length) throw new Error(`Session ${session.sessionId} received too many results`)
      resultsRef.current = nextResults
      setResults(nextResults)
    }

    setValue(answer)
    setEvaluation(result)
    setChecked(true)
    onResult(exercise, result.isCorrect, { responseMs, hintsUsed })
  }

  function beginRetryOrFinish() {
    const failedIds = new Set(resultsRef.current.filter(result => !result.correct).map(result => result.sessionExerciseId))
    const failed = session.exercises.filter(candidate => failedIds.has(candidate.id))
    if (failed.length && session.kind !== 'error-review') {
      setRetryQueue([...failed])
      setRetryIndex(0)
      setInRetry(true)
      setChecked(false)
      setValue('')
      setEvaluation(null)
      setShowHint(false)
      startedAt.current = Date.now()
      return
    }
    setFinished(true)
  }

  function next() {
    if (!checked) return
    if (inRetry) {
      if (retryIndex >= retryQueue.length - 1) {
        setInRetry(false)
        setFinished(true)
        return
      }
      setRetryIndex(current => current + 1)
      return
    }
    if (index >= session.exercises.length - 1) {
      const issues = validateCompletedSession(session, resultsRef.current)
      if (issues.length) setResults([...resultsRef.current])
      beginRetryOrFinish()
      return
    }
    setIndex(current => current + 1)
  }

  const correct = evaluation?.isCorrect ?? false
  const classificationLabel = evaluation?.classification === 'ACCEPTABLE_VARIANT' ? 'Auch richtig' : evaluation?.classification === 'MINOR_TYPO' ? 'Fast richtig' : evaluation?.classification === 'GRAMMAR_ERROR' ? 'Grammatik' : evaluation?.classification === 'INCOMPLETE' ? 'Noch unvollständig' : null
  const progressValue = inRetry ? Math.round(((retryIndex + (checked ? 1 : 0)) / Math.max(1, retryQueue.length)) * 100) : Math.round(((index + (checked ? 1 : 0)) / session.exercises.length) * 100)

  return <div className="card min-w-0 max-w-full overflow-hidden">
    <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-lime-400 transition-all" style={{ width:`${progressValue}%` }} /></div>
    <div className={`text-sm font-bold ${inRetry ? 'text-amber-700' : 'text-lime-700'}`}>{inRetry ? `Fehler wiederholen · ${retryIndex + 1} von ${retryQueue.length}` : `Aufgabe ${index + 1} von ${session.exercises.length}`}</div>
    <h3 className="mt-2 min-w-0 break-words text-xl font-black [overflow-wrap:anywhere]">{exercise.prompt}</h3>

    {exercise.hint && !checked && <button type="button" onClick={() => setShowHint(true)} className="mt-2 break-words text-left text-sm font-semibold text-slate-500 underline">{showHint ? `Hinweis: ${exercise.hint}` : 'Hinweis anzeigen'}</button>}

    {exercise.type === 'choice' ? <div className="mt-5 grid min-w-0 gap-2">{item.options.map((option, optionIndex) => <button key={option.id} disabled={checked} onClick={() => submit(option.text)} className={`min-h-12 min-w-0 whitespace-normal break-words rounded-2xl border px-4 py-3 text-left font-semibold transition [overflow-wrap:anywhere] ${checked && option.correct ? 'border-lime-500 bg-lime-50' : checked && value === option.text ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-lime-400'}`}><span className="mr-3 text-slate-400">{String.fromCharCode(65 + optionIndex)}</span>{option.text}</button>)}</div> : <><input value={value} disabled={checked} onChange={event => setValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') submit() }} className="mt-5 w-full min-w-0 rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-lime-500" placeholder="Deine Antwort …" aria-label="Deine Antwort" /><div className="mt-2 flex flex-wrap gap-2">{['č','š','ž'].map(character => <button key={character} type="button" disabled={checked} onClick={() => setValue(current => current + character)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 font-black">{character.toUpperCase()}</button>)}</div><button onClick={() => submit()} disabled={!value.trim() || checked} className="btn-primary mt-3 w-full justify-center whitespace-normal">Prüfen</button></>}

    {checked && <div className={`mt-4 min-w-0 rounded-2xl p-4 ${correct ? 'bg-lime-50' : 'bg-amber-50'}`}>{correct ? <><b>{evaluation?.classification === 'ACCEPTABLE_VARIANT' ? 'Auch richtig!' : 'Pravilno!'}</b>{' '}{evaluation?.classification === 'ACCEPTABLE_VARIANT' ? 'Diese Formulierung ist ebenfalls korrekt.' : 'Genau richtig.'}</> : <><b>{classificationLabel ?? 'Noch nicht.'}</b><div className="mt-1 break-words [overflow-wrap:anywhere]">{evaluation?.explanation ?? `Richtig: ${exercise.answer}`}</div>{exercise.explanation && evaluation?.classification !== 'GRAMMAR_ERROR' && <div className="mt-2 break-words text-sm">Warum? {exercise.explanation}</div>}</>}<button onClick={next} className="mt-3 min-h-11 font-bold underline">{inRetry ? (retryIndex === retryQueue.length - 1 ? 'Sitzung abschließen' : 'Nächster Fehler') : index === session.exercises.length - 1 ? (resultsRef.current.some(result => !result.correct) ? 'Fehler wiederholen' : 'Sitzung abschließen') : 'Nächste Aufgabe'}</button></div>}
  </div>
}

function Metric({ value, label, className }: { value:string|number; label:string; className:string }) {
  return <div className={`min-w-0 rounded-2xl p-3 ${className}`}><b className="break-words text-xl">{value}</b><div className="break-words text-xs text-slate-500">{label}</div></div>
}
