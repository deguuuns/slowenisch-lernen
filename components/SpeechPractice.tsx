'use client'

import { useRef, useState } from 'react'
import { AlertTriangle, Eye, Loader2, Mic, MicOff, RotateCcw } from 'lucide-react'
import AudioButton from './AudioButton'
import { compareAnswer, InputMode } from '@/lib/answerMatching'
import { guidedHint } from '@/lib/guidedFeedback'
import type { MistakeCategory } from '@/types'
import type { SupportedTtsLanguage } from '@/lib/slovenianTts'

type RecognitionInstance = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: (event: any) => void
  onend: () => void
  onerror: (event?: any) => void
}
type RecognitionConstructor = new () => RecognitionInstance

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor
    webkitSpeechRecognition?: RecognitionConstructor
  }
}

function derivePromptAudio(prompt: string): { text: string; language: SupportedTtsLanguage } {
  const colon = prompt.indexOf(':')
  if (colon >= 0) {
    const afterColon = prompt.slice(colon + 1).trim()
    if (/^(kje|kaj|kam|kdaj|kako|kdo|koliko|kateri|katere|ali)\b/i.test(afterColon)) return { text: afterColon, language: 'sl-SI' }
  }
  if (/^(kje|kaj|kam|kdaj|kako|kdo|koliko|kateri|katere|ali|dober|dobro|živim|grem|imam|pijem|jem|sem)\b/i.test(prompt.trim())) return { text: prompt, language: 'sl-SI' }
  return { text: prompt, language: 'de-DE' }
}

export default function SpeechPractice({
  prompt,
  expected,
  acceptedAnswers = [],
  onResult,
  audioPrompt,
  promptLanguage,
}: {
  prompt: string
  expected: string
  acceptedAnswers?: string[]
  onResult?: (correct:boolean, actual:string) => void
  audioPrompt?: string
  promptLanguage?: SupportedTtsLanguage
}) {
  const [listening, setListening] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(false)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [inputMode, setInputMode] = useState<InputMode>('typed')
  const [status, setStatus] = useState<string | null>(null)
  const recognition = useRef<RecognitionInstance | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])

  const comparison = compareAnswer({ input: answer, expected, acceptedAnswers, inputMode, allowNumericShorthand: inputMode === 'speech' })
  const derived = derivePromptAudio(prompt)
  const spokenPrompt = audioPrompt ?? derived.text
  const spokenLanguage = promptLanguage ?? (audioPrompt ? 'sl-SI' : derived.language)

  function recognitionConstructor() {
    if (typeof window === 'undefined') return undefined
    return window.SpeechRecognition ?? window.webkitSpeechRecognition
  }

  function isIOS() {
    if (typeof navigator === 'undefined') return false
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  }

  async function startMicrophone() {
    setStatus(null)
    setChecked(false)
    const native = recognitionConstructor()
    // On iOS prefer recorded audio: Web Speech support is inconsistent across Safari/PWA versions.
    if (!isIOS() && native) return startNativeRecognition(native)
    return startRecordedRecognition()
  }

  function startNativeRecognition(Constructor: RecognitionConstructor) {
    const instance = new Constructor()
    recognition.current = instance
    instance.lang = 'sl-SI'
    instance.interimResults = false
    instance.continuous = false
    instance.onresult = (event:any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? ''
      setAnswer(transcript)
      setInputMode('speech')
      setChecked(false)
      setStatus(transcript ? 'Slowenisch erkannt.' : 'Es wurde kein Text erkannt.')
    }
    instance.onend = () => setListening(false)
    instance.onerror = () => {
      setListening(false)
      setStatus('Browser-Spracherkennung ist fehlgeschlagen. Nutze das Mikrofon erneut; falls möglich wird die Audio-Transkription verwendet.')
    }
    setListening(true)
    instance.start()
  }

  async function startRecordedRecognition() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus('Dieses Gerät stellt keine nutzbare Mikrofonaufnahme bereit. Tippen funktioniert weiterhin.')
      return
    }
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.current = audioStream
      chunks.current = []
      const mediaRecorder = new MediaRecorder(audioStream)
      recorder.current = mediaRecorder
      mediaRecorder.ondataavailable = event => { if (event.data.size) chunks.current.push(event.data) }
      mediaRecorder.onstop = () => transcribeRecording(mediaRecorder.mimeType || 'audio/webm')
      mediaRecorder.start()
      setListening(true)
      setStatus('Aufnahme läuft. Tippe erneut auf das Mikrofon, wenn du fertig bist.')
    } catch (error: any) {
      setListening(false)
      const denied = error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError'
      setStatus(denied ? 'Mikrofonzugriff wurde nicht erlaubt. Erlaube Safari den Mikrofonzugriff in den Website-Einstellungen.' : 'Das Mikrofon konnte nicht gestartet werden.')
    }
  }

  function stopMicrophone() {
    if (recognition.current && listening && !isIOS()) {
      recognition.current.stop()
      return
    }
    if (recorder.current?.state === 'recording') recorder.current.stop()
    setListening(false)
  }

  async function transcribeRecording(mimeType: string) {
    setListening(false)
    setTranscribing(true)
    setStatus('Slowenisch wird transkribiert …')
    try {
      const blob = new Blob(chunks.current, { type: mimeType })
      const extension = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm'
      const body = new FormData()
      body.append('file', blob, `speech.${extension}`)
      const response = await fetch('/api/transcribe', { method: 'POST', body })
      const result = await response.json() as { text?: string; error?: string }
      if (!response.ok) {
        setStatus(result.error === 'speech-service-not-configured'
          ? 'Die sichere iPhone-Transkription ist auf diesem Deployment noch nicht konfiguriert. Tippen funktioniert weiterhin.'
          : 'Die Audio-Transkription ist fehlgeschlagen. Versuche es noch einmal oder tippe die Antwort.')
        return
      }
      setAnswer(result.text ?? '')
      setInputMode('speech')
      setChecked(false)
      setStatus(result.text ? 'Transkript erstellt. Prüfe kurz, ob es deinem Gesprochenen entspricht.' : 'Es wurde kein Text erkannt.')
    } catch {
      setStatus('Die Audio-Transkription konnte nicht erreicht werden. Tippen funktioniert weiterhin.')
    } finally {
      setTranscribing(false)
      stream.current?.getTracks().forEach(track => track.stop())
      stream.current = null
      recorder.current = null
      chunks.current = []
    }
  }

  function check() {
    if (!answer.trim()) return
    if (comparison.correct) {
      setChecked(true)
      onResult?.(true, answer)
      return
    }
    const attempts = wrongAttempts + 1
    setWrongAttempts(attempts)
    setChecked(true)
    if (attempts >= 3) setShowSolution(true)
  }

  function retry() {
    setChecked(false)
    setShowSolution(false)
  }

  return <div className="space-y-4">
    <div className="rounded-3xl bg-slate-950 p-5 text-white">
      <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-lime-300">Hören und antworten</div>
      <div className="text-2xl font-semibold">{prompt}</div>
      <div className="mt-4"><AudioButton text={spokenPrompt} language={spokenLanguage}/></div>
    </div>

    <div className="rounded-3xl bg-white p-5 shadow-soft">
      <div className="mb-2 flex items-center justify-between gap-3"><label className="block text-sm font-semibold text-slate-600">Deine Antwort</label>{answer && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{inputMode === 'speech' ? 'Mikrofon-Transkript' : 'getippt'}</span>}</div>
      <div className="flex gap-2">
        <input value={answer} onChange={event => { setAnswer(event.target.value); setInputMode('typed'); setChecked(false) }} placeholder="Sprich oder tippe auf Slowenisch …" className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100" autoComplete="off" spellCheck={false}/>
        <button disabled={transcribing} onClick={() => listening ? stopMicrophone() : startMicrophone()} className="touch-target rounded-2xl bg-lime-200 px-4 disabled:opacity-40" title="Slowenisch aufnehmen">{transcribing ? <Loader2 className="animate-spin"/> : listening ? <MicOff/> : <Mic/>}</button>
      </div>
      {inputMode === 'speech' && answer && <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm"><span className="text-slate-500">Erkannt:</span> <strong>{answer}</strong></div>}
      {status && <div className="mt-3 flex gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><AlertTriangle className="mt-0.5 shrink-0" size={16}/><span>{status}</span></div>}
      <button onClick={check} disabled={!answer.trim() || transcribing} className="btn-primary mt-4 w-full justify-center">Antwort prüfen</button>

      {checked && <div className={`mt-4 rounded-2xl p-4 ${comparison.correct ? 'bg-lime-50 text-lime-950' : 'bg-amber-50 text-amber-950'}`}>
        {comparison.correct ? <><strong>Odlično!</strong> Deine Antwort ist grammatisch passend.{comparison.reason === 'speech-number-artifact' && <p className="mt-2 text-sm">Eine erkannte Ziffer wurde nur anhand der erwarteten grammatischen Form aufgelöst.</p>}</> : !showSolution ? <><strong>Noch nicht ganz.</strong><p className="mt-3 text-sm"><strong>Hinweis:</strong> {guidedHint(comparison.category as MistakeCategory | undefined, answer, expected, Math.min(2, Math.max(1, wrongAttempts)) as 1 | 2)}</p><p className="mt-2 text-xs">Die Lösung bleibt zunächst verborgen.</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={retry} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 py-2 font-bold"><RotateCcw size={17}/> Noch einmal versuchen</button><button onClick={() => setShowSolution(true)} className="inline-flex min-h-11 items-center gap-2 px-3 py-2 text-sm font-bold"><Eye size={17}/> Lösung zeigen</button></div></> : <><div className="text-sm text-slate-600">Lösung</div><div className="font-black">{expected}</div>{comparison.explanation && <div className="mt-3 text-sm"><strong>Warum?</strong> {comparison.explanation}</div>}<div className="mt-4 rounded-2xl bg-white/70 p-3"><div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Aussprache</div><AudioButton text={expected} language="sl-SI"/></div><button onClick={retry} className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold underline"><RotateCcw size={17}/> Jetzt selbst noch einmal</button></>}
      </div>}
    </div>
  </div>
}
