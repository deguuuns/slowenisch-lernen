'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Pause, Play, Rabbit, RotateCcw, Volume2 } from 'lucide-react'
import { chooseSlovenianVoice, speakWithSlovenianVoice, waitForSpeechVoices } from '@/lib/slovenianTts'

type Speed = 'verySlow' | 'slow' | 'normal' | 'native'
const rates: Record<Speed, number> = { verySlow: 0.55, slow: 0.72, normal: 0.9, native: 1.05 }

type VoiceStatus = {
  loading: boolean
  available: boolean
  voiceName?: string
  voiceLang?: string
  exactLocale?: boolean
  allSlovenianVoices: string[]
}

export async function speakSlovenian(text: string, speed: Speed = 'slow') {
  return speakWithSlovenianVoice(text, rates[speed])
}

export default function AudioButton({ text, compact = false }: { text: string; compact?: boolean }) {
  const [speed, setSpeed] = useState<Speed>('slow')
  const [wordMode, setWordMode] = useState(false)
  const [activeWord, setActiveWord] = useState<number | null>(null)
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>({ loading: true, available: false, allSlovenianVoices: [] })
  const [message, setMessage] = useState<string | null>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const words = useMemo(() => text.split(/\s+/), [text])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const voices = await waitForSpeechVoices()
      if (cancelled) return
      const selected = chooseSlovenianVoice(voices)
      setVoiceStatus({
        loading: false,
        available: !!selected.voice,
        voiceName: selected.voice?.name,
        voiceLang: selected.voice?.lang,
        exactLocale: selected.exactLocale,
        allSlovenianVoices: selected.availableSlovenianVoices.map(voice => `${voice.name} (${voice.lang})`),
      })
    }
    load()
    return () => {
      cancelled = true
      window.speechSynthesis?.cancel()
    }
  }, [])

  async function play(content = text, chosenSpeed: Speed = speed) {
    setMessage(null)
    const result = await speakSlovenian(content, chosenSpeed)
    if (!result.ok) {
      setMessage(result.error === 'no-slovenian-voice'
        ? 'Auf diesem Gerät stellt Safari aktuell keine slowenische Stimme bereit. Die App spielt bewusst keine falsche Ersatzstimme ab.'
        : 'Sprachausgabe ist in diesem Browser nicht verfügbar.')
    }
  }

  async function speakWords() {
    if (!voiceStatus.available) {
      setMessage('Keine echte slowenische Stimme gefunden. Wort-für-Wort-Audio wurde deshalb nicht gestartet.')
      return
    }
    window.speechSynthesis.cancel()
    setWordMode(true)
    let i = 0
    const next = async () => {
      if (i >= words.length) { setActiveWord(null); return }
      setActiveWord(i)
      const clean = words[i].replace(/[.!?;,]/g, '')
      const result = await speakWithSlovenianVoice(clean, rates.verySlow)
      if (!result.ok) { setActiveWord(null); return }
      window.setTimeout(() => { i += 1; next() }, 900)
    }
    next()
  }

  const disabled = !voiceStatus.loading && !voiceStatus.available

  if (compact) return (
    <button
      aria-label={disabled ? 'Keine slowenische Stimme verfügbar' : 'Slowenisch abspielen'}
      onClick={() => play()}
      disabled={disabled}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-lime-100 text-lime-900 hover:bg-lime-200 disabled:bg-slate-100 disabled:text-slate-400"
      title={disabled ? 'Keine slowenische Stimme auf diesem Gerät gefunden' : voiceStatus.voiceName}
    >
      {disabled ? <AlertTriangle size={18}/> : <Volume2 size={18}/>} 
    </button>
  )

  return <div className="rounded-2xl bg-white p-4 shadow-soft">
    <div className="mb-3 flex flex-wrap gap-2">
      <button onClick={() => play()} disabled={disabled || voiceStatus.loading} className="btn-primary disabled:opacity-50"><Play size={17}/> Play</button>
      <button onClick={() => window.speechSynthesis?.pause()} className="btn-secondary"><Pause size={17}/> Pause</button>
      <button onClick={() => play()} disabled={disabled} className="btn-secondary disabled:opacity-50"><RotateCcw size={17}/> Wiederholen</button>
      <button onClick={() => play(text, 'verySlow')} disabled={disabled} className="btn-secondary disabled:opacity-50"><Rabbit size={17}/> Langsamer</button>
    </div>

    {voiceStatus.loading ? <div className="mb-3 text-sm text-slate-500">Slowenische Stimme wird gesucht …</div> : voiceStatus.available ? (
      <div className="mb-3 rounded-xl bg-lime-50 p-3 text-sm text-lime-950">
        <strong>Slowenische Stimme:</strong> {voiceStatus.voiceName} · {voiceStatus.voiceLang}{!voiceStatus.exactLocale && ' · slowenischer Fallback'}
      </div>
    ) : (
      <div className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
        <strong>Keine slowenische Stimme gefunden.</strong> Die App verwendet absichtlich keine deutsche oder englische Ersatzstimme.
      </div>
    )}

    {message && <div className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">{message}</div>}

    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-500">Tempo</span>
      <select value={speed} onChange={e => setSpeed(e.target.value as Speed)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
        <option value="verySlow">sehr langsam</option><option value="slow">langsam</option><option value="normal">normal</option><option value="native">muttersprachlich</option>
      </select>
      <button onClick={speakWords} disabled={disabled} className="ml-auto text-sm font-semibold text-lime-800 disabled:text-slate-400">Wort für Wort</button>
    </div>

    <div className="flex flex-wrap gap-2 text-lg font-semibold">
      {words.map((word, i) => <button key={i} disabled={disabled} onClick={() => play(word, 'verySlow')} className={`rounded-lg px-1.5 py-1 disabled:text-slate-400 ${wordMode && activeWord === i ? 'bg-lime-200' : 'hover:bg-slate-100'}`}>{word}</button>)}
    </div>

    <button onClick={() => setShowDiagnostics(value => !value)} className="mt-4 text-xs font-semibold text-slate-500 underline">Audio-Diagnose {showDiagnostics ? 'ausblenden' : 'anzeigen'}</button>
    {showDiagnostics && <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
      <div><strong>Gesuchte Locale:</strong> sl-SI</div>
      <div><strong>Gewählte Stimme:</strong> {voiceStatus.voiceName ?? 'keine'}</div>
      <div><strong>Gemeldete Sprache:</strong> {voiceStatus.voiceLang ?? '—'}</div>
      <div className="mt-2"><strong>Alle slowenischen Stimmen:</strong></div>
      {voiceStatus.allSlovenianVoices.length ? voiceStatus.allSlovenianVoices.map(item => <div key={item}>• {item}</div>) : <div>Keine von Safari gemeldet.</div>}
    </div>}
  </div>
}
