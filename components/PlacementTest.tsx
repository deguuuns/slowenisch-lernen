'use client'

import { useMemo, useState } from 'react'
import AudioButton from './AudioButton'
import { placementA1, placementA2, scorePlacement, shouldContinueToA2, type PlacementEvidence, type PlacementQuestion } from '@/lib/placement'

export default function PlacementTest({ onComplete }: { onComplete: (result: PlacementEvidence) => void }) {
  const [phase, setPhase] = useState<'A1' | 'A2'>('A1')
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState('')
  const [results, setResults] = useState<Array<{ question: PlacementQuestion; correct: boolean }>>([])
  const questions = phase === 'A1' ? placementA1 : placementA2
  const question = questions[index]
  const answered = !!selected
  const currentCorrect = selected === question.answer
  const progress = phase === 'A1' ? index + 1 : placementA1.length + index + 1
  const max = placementA1.length + placementA2.length

  const summary = useMemo(() => scorePlacement(results), [results])

  function next() {
    if (!selected) return
    const nextResults = [...results, { question, correct: currentCorrect }]
    setResults(nextResults)
    setSelected('')

    if (index < questions.length - 1) {
      setIndex(index + 1)
      return
    }

    if (phase === 'A1') {
      const a1Correct = nextResults.filter(item => item.question.level === 'A1' && item.correct).length
      if (shouldContinueToA2(a1Correct)) {
        setPhase('A2')
        setIndex(0)
        return
      }
      onComplete(scorePlacement(nextResults))
      return
    }

    onComplete(scorePlacement(nextResults))
  }

  return <div className="card">
    <div className="text-xs font-black uppercase tracking-[0.2em] text-lime-700">Kurzer Einstufungstest</div>
    <h2 className="mt-2 text-2xl font-black">Wir beginnen leicht.</h2>
    <p className="mt-2 text-sm text-slate-500">Ein einzelner Fehler entscheidet nichts. Wir sammeln mehrere Hinweise und gehen nur bei ausreichender Sicherheit weiter.</p>
    <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-lime-400" style={{ width: `${Math.min(100, progress / max * 100)}%` }}/></div>

    {question.audioPrompt && <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white"><div className="mb-2 text-xs font-bold uppercase tracking-wide text-lime-300">Hören</div><AudioButton text={question.audioPrompt} language="sl-SI"/></div>}

    <h3 className="mt-5 text-xl font-black">{question.prompt}</h3>
    <div className="mt-4 grid gap-2">{question.alternatives.map(option => <button key={option} onClick={() => setSelected(option)} className={`min-h-12 rounded-2xl border px-4 py-3 text-left font-semibold ${selected === option ? 'border-lime-500 bg-lime-50' : 'border-slate-200 bg-white'}`}>{option}</button>)}</div>
    {answered && <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Antwort gespeichert. Im Einstufungstest zeigen wir die Lösung nicht sofort – es geht nur um dein Startprofil.</div>}
    <button disabled={!answered} onClick={next} className="btn-primary mt-5 w-full justify-center disabled:opacity-40">{phase === 'A2' && index === questions.length - 1 ? 'Auswertung' : 'Weiter'}</button>
    {results.length > 0 && <div className="mt-3 text-xs text-slate-400">Bisherige Hinweise: {summary.correct}/{summary.total} Aufgaben passend gelöst.</div>}
  </div>
}
