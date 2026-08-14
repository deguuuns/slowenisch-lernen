'use client'

import { useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import AudioButton from './AudioButton'
import { compareAnswer, explainMismatch, InputMode } from '@/lib/answerMatching'

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => {
      lang: string; interimResults: boolean; continuous: boolean;
      start: () => void; stop: () => void;
      onresult: (event: any) => void; onend: () => void; onerror: () => void
    }
  }
}

export default function SpeechPractice({
  prompt,
  expected,
  acceptedAnswers = [],
  onResult
}: {
  prompt: string
  expected: string
  acceptedAnswers?: string[]
  onResult?: (correct:boolean, actual:string) => void
}) {
  const [listening, setListening] = useState(false)
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(false)
  const [inputMode, setInputMode] = useState<InputMode>('typed')
  const recognition = useRef<any>(null)
  const supported = typeof window !== 'undefined' && !!window.webkitSpeechRecognition

  function start() {
    if (!supported || !window.webkitSpeechRecognition) return
    const r = new window.webkitSpeechRecognition()
    recognition.current = r
    r.lang = 'sl-SI'; r.interimResults = false; r.continuous = false
    r.onresult = (e:any) => {
      const t = e.results[0][0].transcript
      setAnswer(t)
      setInputMode('speech')
      setChecked(false)
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    setListening(true); r.start()
  }

  const comparison = compareAnswer({ input: answer, expected, acceptedAnswers, inputMode })
  const why = comparison.correct ? undefined : explainMismatch(answer, expected)

  function check() {
    setChecked(true)
    onResult?.(comparison.correct, answer)
  }

  return <div className="space-y-4">
    <div className="rounded-3xl bg-slate-950 p-5 text-white">
      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Tutor</div>
      <div className="text-2xl font-semibold">{prompt}</div>
      <div className="mt-4"><AudioButton text={prompt} /></div>
    </div>
    <div className="rounded-3xl bg-white p-5 shadow-soft">
      <label className="mb-2 block text-sm font-semibold text-slate-600">Deine Antwort</label>
      <div className="flex gap-2">
        <input
          value={answer}
          onChange={e => { setAnswer(e.target.value); setInputMode('typed'); setChecked(false) }}
          placeholder="Sprich oder tippe auf Slowenisch …"
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500"
        />
        <button disabled={!supported} onClick={() => listening ? recognition.current?.stop() : start()} className="rounded-2xl bg-lime-200 px-4 disabled:opacity-40" title={supported ? 'Aufnehmen' : 'Spracherkennung wird in diesem Browser nicht unterstützt'}>
          {listening ? <MicOff/> : <Mic/>}
        </button>
      </div>
      {!supported && <p className="mt-2 text-xs text-slate-500">Mikrofon-Transkription ist in diesem Browser nicht verfügbar. Tippen funktioniert weiterhin.</p>}
      <button onClick={check} disabled={!answer.trim()} className="btn-primary mt-4 w-full justify-center">Antwort prüfen</button>
      {checked && <div className={`mt-4 rounded-2xl p-4 ${comparison.correct ? 'bg-lime-50 text-lime-900' : 'bg-amber-50 text-amber-950'}`}>
        {comparison.correct ? <><strong>Odlično!</strong> Deine Antwort ist richtig.</> : <>
          <strong>Noch nicht ganz.</strong>
          <div className="mt-2 text-sm text-slate-600">Deine Antwort:</div>
          <div className="font-semibold">{answer}</div>
          <div className="mt-2 text-sm text-slate-600">Richtig:</div>
          <div className="font-semibold">{expected}</div>
          {why && <div className="mt-3 text-sm"><strong>Warum?</strong> {why}</div>}
        </>}
      </div>}
    </div>
  </div>
}
