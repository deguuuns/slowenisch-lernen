'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pause, Play, Rabbit, RotateCcw, Volume2 } from 'lucide-react'
import { loadProgress } from '@/lib/storage'

type Speed = 'verySlow' | 'slow' | 'normal' | 'native'
const rates: Record<Speed, number> = { verySlow: 0.55, slow: 0.72, normal: 0.9, native: 1.05 }

export function speakSlovenian(text: string, speed: Speed = 'slow') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'sl-SI'
  utterance.rate = rates[speed]
  const voices = window.speechSynthesis.getVoices()
  const native = voices.find(v => v.lang.toLowerCase().startsWith('sl'))
  if (native) utterance.voice = native
  window.speechSynthesis.speak(utterance)
}

export default function AudioButton({ text, compact = false }: { text: string; compact?: boolean }) {
  const [speed, setSpeed] = useState<Speed>('slow')
  const [wordMode, setWordMode] = useState(false)
  const [activeWord, setActiveWord] = useState<number | null>(null)
  const words = useMemo(() => text.split(/\s+/), [text])

  useEffect(() => {
    const preferred=loadProgress().preferences?.audioSpeed
    setSpeed(preferred==='normal'?'normal':'slow')
    return () => window.speechSynthesis?.cancel()
  }, [])

  function speakWords() {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    setWordMode(true)
    let i = 0
    const next = () => {
      if (i >= words.length) { setActiveWord(null); return }
      setActiveWord(i)
      const u = new SpeechSynthesisUtterance(words[i].replace(/[.!?;,]/g,''))
      u.lang = 'sl-SI'
      u.rate = rates.verySlow
      const voices = window.speechSynthesis.getVoices()
      const native = voices.find(v => v.lang.toLowerCase().startsWith('sl'))
      if (native) u.voice = native
      u.onend = () => { i += 1; setTimeout(next, 160) }
      window.speechSynthesis.speak(u)
    }
    next()
  }

  if (compact) return (
    <button aria-label="Slowenisch abspielen" onClick={() => speakSlovenian(text, speed)} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-lime-100 text-lime-900 hover:bg-lime-200">
      <Volume2 size={18}/>
    </button>
  )

  return <div className="rounded-2xl bg-white p-4 shadow-soft">
    <div className="mb-3 flex flex-wrap gap-2">
      <button onClick={() => speakSlovenian(text, speed)} className="btn-primary"><Play size={17}/> Play</button>
      <button onClick={() => window.speechSynthesis?.pause()} className="btn-secondary"><Pause size={17}/> Pause</button>
      <button onClick={() => speakSlovenian(text, speed)} className="btn-secondary"><RotateCcw size={17}/> Wiederholen</button>
      <button onClick={() => speakSlovenian(text, 'verySlow')} className="btn-secondary"><Rabbit size={17}/> Langsamer wiederholen</button>
    </div>
    <div className="mb-3 flex items-center gap-2">
      <span className="text-sm text-slate-500">Tempo</span>
      <select value={speed} onChange={e => setSpeed(e.target.value as Speed)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
        <option value="verySlow">sehr langsam</option><option value="slow">langsam</option><option value="normal">normal</option><option value="native">muttersprachlich</option>
      </select>
      <button onClick={speakWords} className="ml-auto text-sm font-semibold text-lime-800">Wort für Wort</button>
    </div>
    <div className="flex flex-wrap gap-2 text-lg font-semibold">
      {words.map((word, i) => <button key={i} onClick={() => speakSlovenian(word, 'verySlow')} className={`rounded-lg px-1.5 py-1 ${wordMode && activeWord === i ? 'bg-lime-200' : 'hover:bg-slate-100'}`}>{word}</button>)}
    </div>
  </div>
}
