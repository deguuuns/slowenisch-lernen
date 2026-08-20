'use client'

import { useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import AudioButton from './AudioButton'
import { evaluateAnswer, EvaluationResult } from '@/lib/answer-evaluation'

type RecognitionResultEvent = {
  results: { [index: number]: { [index: number]: { transcript: string } } }
}
type RecognitionInstance = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: (event: RecognitionResultEvent) => void
  onend: () => void
  onerror: () => void
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => RecognitionInstance
  }
}

export type SpeechResultMeta = {
  responseMs: number
  replays: number
  usedSlowAudio: boolean
  inputMode: 'speech' | 'text'
}

export default function SpeechPractice({
  prompt,
  expected,
  onResult,
}: {
  prompt: string
  expected: string
  onResult?: (correct: boolean, actual: string, meta: SpeechResultMeta) => void
}) {
  const [listening, setListening] = useState(false)
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [replays, setReplays] = useState(0)
  const [usedSlow, setUsedSlow] = useState(false)
  const [inputMode, setInputMode] = useState<'speech' | 'text'>('text')
  const recognition = useRef<RecognitionInstance | null>(null)
  const startedAt = useRef(Date.now())
  const supported = typeof window !== 'undefined' && Boolean(window.webkitSpeechRecognition)

  function start() {
    if (!supported || !window.webkitSpeechRecognition) return
    const instance = new window.webkitSpeechRecognition()
    recognition.current = instance
    instance.lang = 'sl-SI'
    instance.interimResults = false
    instance.continuous = false
    instance.onresult = event => {
      const transcript = event.results[0][0].transcript
      setAnswer(transcript)
      setInputMode('speech')
      setChecked(false)
    }
    instance.onend = () => setListening(false)
    instance.onerror = () => setListening(false)
    setListening(true)
    startedAt.current = Date.now()
    instance.start()
  }

  function check() {
    if (!answer.trim()) return
    const result = evaluateAnswer({ input: answer, expected })
    setEvaluation(result)
    setChecked(true)
    onResult?.(result.isCorrect, answer, {
      responseMs: Math.max(250, Date.now() - startedAt.current),
      replays,
      usedSlowAudio: usedSlow,
      inputMode,
    })
  }

  const correct = checked && (evaluation?.isCorrect ?? false)

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0 overflow-hidden rounded-3xl bg-slate-950 p-4 text-white sm:p-5">
        <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Tutor</div>
        <div className="break-words text-xl font-semibold sm:text-2xl [overflow-wrap:anywhere]">{prompt}</div>
        <div className="mt-4 min-w-0">
          <AudioButton text={prompt} onPlay={slow => { setReplays(value => value + 1); if (slow) setUsedSlow(true) }} />
        </div>
      </div>
      <div className="min-w-0 overflow-hidden rounded-3xl bg-white p-4 shadow-soft sm:p-5">
        <label className="mb-2 block text-sm font-semibold text-slate-600">Deine Antwort</label>
        <div className="flex min-w-0 gap-2">
          <input
            value={answer}
            onChange={event => { setAnswer(event.target.value); setInputMode('text'); setChecked(false) }}
            placeholder="Sprich oder tippe auf Slowenisch …"
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-lime-500 sm:px-4"
          />
          <button
            disabled={!supported}
            onClick={() => listening ? recognition.current?.stop() : start()}
            className="min-h-12 min-w-12 shrink-0 rounded-2xl bg-lime-200 px-3 disabled:opacity-40"
            title={supported ? 'Aufnehmen' : 'Spracherkennung wird in diesem Browser nicht unterstützt'}
            aria-label={listening ? 'Aufnahme stoppen' : 'Aufnahme starten'}
          >
            {listening ? <MicOff /> : <Mic />}
          </button>
        </div>
        {!supported && <p className="mt-2 break-words text-xs text-slate-500">Mikrofon-Transkription ist in diesem Browser nicht verfügbar. Tippen funktioniert weiterhin.</p>}
        <button onClick={check} disabled={!answer.trim()} className="btn-primary mt-4 min-h-11 w-full justify-center whitespace-normal">Antwort prüfen</button>
        {checked && (
          <div className={`mt-4 min-w-0 rounded-2xl p-4 ${correct ? 'bg-lime-50 text-lime-900' : 'bg-amber-50 text-amber-950'}`}>
            {correct ? <><strong>Odlično!</strong> Deine Antwort ist richtig.</> : <><strong>{evaluation?.classification === 'GRAMMAR_ERROR' ? 'Grammatik noch unsicher.' : 'Noch nicht ganz.'}</strong><div className="mt-2 break-words [overflow-wrap:anywhere]">{evaluation?.explanation || <>Korrektur: <span className="font-semibold">{expected}</span></>}</div></>}
          </div>
        )}
      </div>
    </div>
  )
}
