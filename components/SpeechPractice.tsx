'use client'

import { useRef, useState } from 'react'
import { Mic, MicOff, RotateCcw } from 'lucide-react'
import AudioButton from './AudioButton'
import { compareAnswer, InputMode } from '@/lib/answerMatching'

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => {
      lang: string
      interimResults: boolean
      continuous: boolean
      start: () => void
      stop: () => void
      onresult: (event: any) => void
      onend: () => void
      onerror: () => void
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
    const instance = new window.webkitSpeechRecognition()
    recognition.current = instance
    instance.lang = 'sl-SI'
    instance.interimResults = false
    instance.continuous = false
    instance.onresult = (event:any) => {
      const transcript = event.results[0][0].transcript
      setAnswer(transcript)
      setInputMode('speech')
      setChecked(false)
    }
    instance.onend = () => setListening(false)
    instance.onerror = () => setListening(false)
    setListening(true)
    instance.start()
  }

  const comparison = compareAnswer({ input: answer, expected, acceptedAnswers, inputMode, allowNumericShorthand: inputMode === 'speech' })

  function check() {
    setChecked(true)
    onResult?.(comparison.correct, answer)
  }

  function retry() {
    setAnswer('')
    setChecked(false)
    setInputMode('typed')
  }

  return <div className="space-y-4">
    <div className="rounded-3xl bg-slate-950 p-5 text-white">
      <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-lime-300">Hören und antworten</div>
      <div className="text-2xl font-semibold">{prompt}</div>
      <div className="mt-4"><AudioButton text={prompt}/></div>
    </div>

    <div className="rounded-3xl bg-white p-5 shadow-soft">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-semibold text-slate-600">Deine Antwort</label>
        {answer && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{inputMode === 'speech' ? 'Mikrofon-Transkript' : 'getippt'}</span>}
      </div>

      <div className="flex gap-2">
        <input
          value={answer}
          onChange={event => { setAnswer(event.target.value); setInputMode('typed'); setChecked(false) }}
          placeholder="Sprich oder tippe auf Slowenisch …"
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          disabled={!supported}
          onClick={() => listening ? recognition.current?.stop() : start()}
          className="touch-target rounded-2xl bg-lime-200 px-4 disabled:opacity-40"
          title={supported ? 'Aufnehmen' : 'Spracherkennung wird in diesem Browser nicht unterstützt'}
        >{listening ? <MicOff/> : <Mic/>}</button>
      </div>

      {inputMode === 'speech' && answer && <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm"><span className="text-slate-500">Erkannt:</span> <strong>{answer}</strong></div>}
      {!supported && <p className="mt-2 text-xs text-slate-500">Mikrofon-Transkription ist in diesem Browser nicht verfügbar. Tippen funktioniert weiterhin.</p>}

      <button onClick={check} disabled={!answer.trim()} className="btn-primary mt-4 w-full justify-center">Antwort prüfen</button>

      {checked && <div className={`mt-4 rounded-2xl p-4 ${comparison.correct ? 'bg-lime-50 text-lime-950' : 'bg-amber-50 text-amber-950'}`}>
        {comparison.correct ? <>
          <strong>Odlično!</strong> Deine Antwort ist grammatisch passend.
          {comparison.reason === 'speech-number-artifact' && <p className="mt-2 text-sm">Die Spracherkennung hat eine Zahl als Ziffer geliefert; sie wurde nur anhand der erwarteten grammatischen Form aufgelöst.</p>}
        </> : <>
          <strong>Noch nicht ganz.</strong>
          <div className="mt-2 text-sm text-slate-600">Erkannt / eingegeben:</div>
          <div className="font-semibold">{answer}</div>
          <div className="mt-2 text-sm text-slate-600">Richtig:</div>
          <div className="font-semibold">{expected}</div>
          {comparison.explanation && <div className="mt-3 text-sm"><strong>Warum?</strong> {comparison.explanation}</div>}
        </>}

        <div className="mt-4 rounded-2xl bg-white/70 p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Richtige Aussprache anhören</div>
          <AudioButton text={expected}/>
        </div>
        <button onClick={retry} className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold underline"><RotateCcw size={17}/> Noch einmal</button>
      </div>}
    </div>
  </div>
}
