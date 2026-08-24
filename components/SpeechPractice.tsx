'use client'

import { useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import AudioButton from './AudioButton'
import { evaluateAnswer, EvaluationResult } from '@/lib/answer-evaluation'
import { buildSpeechFeedback, SpeechFeedback } from '@/lib/speech-feedback'

type RecognitionAlternative = { transcript: string; confidence?: number }
type RecognitionResultEvent = { results: { [index: number]: { [index: number]: RecognitionAlternative } } }
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

declare global { interface Window { webkitSpeechRecognition?: new () => RecognitionInstance } }

export type SpeechResultMeta = {
  responseMs: number
  replays: number
  usedSlowAudio: boolean
  inputMode: 'speech' | 'text'
}

export default function SpeechPractice({ prompt, expected, onResult }: {
  prompt: string
  expected: string
  onResult?: (correct: boolean, actual: string, meta: SpeechResultMeta) => void
}) {
  const [listening, setListening] = useState(false)
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [speechFeedback, setSpeechFeedback] = useState<SpeechFeedback | null>(null)
  const [recognitionConfidence, setRecognitionConfidence] = useState<number | undefined>()
  const [replays, setReplays] = useState(0)
  const [usedSlow, setUsedSlow] = useState(false)
  const [inputMode, setInputMode] = useState<'speech' | 'text'>('text')
  const recognition = useRef<RecognitionInstance | null>(null)
  const startedAt = useRef(Date.now())
  const supported = typeof window !== 'undefined' && Boolean(window.webkitSpeechRecognition)

  function resetFeedback() {
    setChecked(false)
    setEvaluation(null)
    setSpeechFeedback(null)
  }

  function start() {
    if (!supported || !window.webkitSpeechRecognition) return
    const instance = new window.webkitSpeechRecognition()
    recognition.current = instance
    instance.lang = 'sl-SI'
    instance.interimResults = false
    instance.continuous = false
    instance.onresult = event => {
      const alternative = event.results[0][0]
      setAnswer(alternative.transcript)
      setRecognitionConfidence(alternative.confidence)
      setInputMode('speech')
      resetFeedback()
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
    setSpeechFeedback(inputMode === 'speech' ? buildSpeechFeedback({ actual: answer, expected, evaluation: result, recognitionConfidence }) : null)
    onResult?.(result.isCorrect, answer, { responseMs: Math.max(250, Date.now() - startedAt.current), replays, usedSlowAudio: usedSlow, inputMode })
  }

  const correct = checked && (evaluation?.isCorrect ?? false)

  return (
    <div className="min-w-0 space-y-3">
      <div className="min-w-0 overflow-hidden rounded-3xl bg-slate-950 p-4 text-white sm:p-5">
        <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Tutor</div>
        <div className="break-words text-xl font-semibold sm:text-2xl [overflow-wrap:anywhere]">{prompt}</div>
        <div className="mt-3"><AudioButton text={prompt} onPlay={slow => { setReplays(value => value + 1); if (slow) setUsedSlow(true) }} /></div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-3xl bg-white p-4 shadow-soft dark:bg-slate-900 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Deine Antwort</label>
          {inputMode === 'speech' && answer && <span className="rounded-full bg-lime-100 px-2.5 py-1 text-xs font-bold text-lime-800 dark:bg-lime-950 dark:text-lime-200">gesprochen</span>}
        </div>
        <div className="flex min-w-0 gap-2">
          <input value={answer} onChange={event => { setAnswer(event.target.value); setInputMode('text'); setRecognitionConfidence(undefined); resetFeedback() }} placeholder="Sprich oder tippe auf Slowenisch …" className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-base outline-none focus:border-lime-500 dark:border-slate-700 dark:bg-slate-950 sm:px-4" />
          <button disabled={!supported} onClick={() => listening ? recognition.current?.stop() : start()} className={`min-h-12 min-w-12 shrink-0 rounded-2xl px-3 transition disabled:opacity-40 ${listening ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200' : 'bg-lime-200 text-slate-950'}`} title={supported ? 'Aufnehmen' : 'Spracherkennung wird in diesem Browser nicht unterstützt'} aria-label={listening ? 'Aufnahme stoppen' : 'Aufnahme starten'}>{listening ? <MicOff /> : <Mic />}</button>
        </div>
        {listening && <div className="mt-2 text-sm font-semibold text-red-600 dark:text-red-300">Ich höre zu …</div>}
        {!supported && <p className="mt-2 text-xs text-slate-500">Mikrofon-Transkription ist in diesem Browser nicht verfügbar. Tippen funktioniert weiterhin.</p>}
        <button onClick={check} disabled={!answer.trim()} className="btn-primary mt-3 min-h-11 w-full justify-center">Antwort prüfen</button>

        {checked && (
          <div className={`mt-3 min-w-0 rounded-2xl p-3 sm:p-4 ${correct ? 'bg-lime-50 text-lime-900 dark:bg-lime-950 dark:text-lime-100' : 'bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-100'}`}>
            {inputMode === 'speech' && speechFeedback ? <>
              <strong>{speechFeedback.title}</strong>
              <div className="mt-1 text-sm">{speechFeedback.detail}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-semibold">
                <div className="rounded-xl bg-white/60 p-2 dark:bg-slate-900/50">Inhalt: {speechFeedback.contentCorrect ? 'richtig' : 'korrigieren'}</div>
                <div className="rounded-xl bg-white/60 p-2 dark:bg-slate-900/50">Erkennung: {speechFeedback.deliveryBand === 'strong' ? 'sehr klar' : speechFeedback.deliveryBand === 'developing' ? 'teilweise klar' : 'noch unsicher'}</div>
              </div>
              <div className="mt-2 text-[11px] opacity-70">Hinweis: Browser-Spracherkennung bewertet keine Phonetik. Die Rückmeldung zeigt, wie zuverlässig deine gesprochene Form als Zieltext erkannt wurde.</div>
            </> : correct ? <><strong>Odlično!</strong> Inhaltlich richtig. Für Aussprachefeedback nutze die Mikrofonaufnahme.</> : <><strong>{evaluation?.classification === 'GRAMMAR_ERROR' ? 'Grammatik noch unsicher.' : 'Noch nicht ganz.'}</strong><div className="mt-1 text-sm">{evaluation?.explanation || <>Korrektur: <span className="font-semibold">{expected}</span></>}</div></>}
          </div>
        )}
      </div>
    </div>
  )
}
