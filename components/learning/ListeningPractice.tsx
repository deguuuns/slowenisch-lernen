'use client'

import { useMemo, useState } from 'react'
import AudioButton from '@/components/AudioButton'
import { compareAnswer } from '@/lib/answerMatching'

type ListeningItem = {
  id: string
  audio: string
  prompt: string
  answer: string
  acceptedAnswers?: string[]
}

const LISTENING_ITEMS: ListeningItem[] = [
  { id: 'l1', audio: 'Sem v Sloveniji.', prompt: 'Tippe den gehörten Satz.', answer: 'Sem v Sloveniji.' },
  { id: 'l2', audio: 'Grem v Slovenijo.', prompt: 'Tippe den gehörten Satz.', answer: 'Grem v Slovenijo.' },
  { id: 'l3', audio: 'Imam dva brata.', prompt: 'Tippe den gehörten Satz.', answer: 'Imam dva brata.', acceptedAnswers: ['Imam 2 brata.'] },
  { id: 'l4', audio: 'Grem spat ob desetih.', prompt: 'Tippe den gehörten Satz.', answer: 'Grem spat ob desetih.' },
  { id: 'l5', audio: 'Pijem vodo.', prompt: 'Tippe den gehörten Satz.', answer: 'Pijem vodo.' },
]

export default function ListeningPractice({ onComplete }: { onComplete?: (correct: boolean) => void }) {
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState(false)
  const item = LISTENING_ITEMS[index % LISTENING_ITEMS.length]
  const result = useMemo(() => compareAnswer({ input: value, expected: item.answer, acceptedAnswers: item.acceptedAnswers }), [value, item])

  function check() {
    if (!value.trim()) return
    setChecked(true)
    onComplete?.(result.correct)
  }

  function next() {
    setIndex(current => (current + 1) % LISTENING_ITEMS.length)
    setValue('')
    setChecked(false)
  }

  return <div className="card">
    <div className="text-sm font-bold text-lime-700">Hörverstehen · Satzdiktat</div>
    <h3 className="mt-2 text-xl font-black">{item.prompt}</h3>
    <p className="mt-2 text-sm text-slate-500">Höre zuerst langsam. Wenn es klappt, stelle das Tempo im Player auf normal.</p>
    <div className="mt-4"><AudioButton text={item.audio}/></div>
    <input
      value={value}
      onChange={event => { setValue(event.target.value); setChecked(false) }}
      onKeyDown={event => { if (event.key === 'Enter') check() }}
      placeholder="Was hast du gehört?"
      className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
      autoComplete="off"
      spellCheck={false}
    />
    <button onClick={check} disabled={!value.trim()} className="btn-primary mt-3 w-full justify-center">Hörantwort prüfen</button>
    {checked && <div className={`mt-4 rounded-2xl p-4 ${result.correct ? 'bg-lime-50' : 'bg-amber-50'}`}>
      {result.correct ? <strong>Richtig gehört.</strong> : <>
        <strong>Noch einmal anhören.</strong>
        <div className="mt-2 text-sm text-slate-500">Richtig:</div>
        <div className="font-bold">{item.answer}</div>
        {result.explanation && <div className="mt-2 text-sm"><strong>Warum?</strong> {result.explanation}</div>}
      </>}
      <button onClick={next} className="mt-3 min-h-11 font-bold underline">Nächste Hörübung</button>
    </div>}
  </div>
}
