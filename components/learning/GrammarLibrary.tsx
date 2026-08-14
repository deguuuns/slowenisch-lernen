'use client'

import { useMemo, useState } from 'react'
import { BookMarked, Search } from 'lucide-react'
import { grammarLibrary } from '@/data/grammar'
import type { CEFRLevel } from '@/types'

export default function GrammarLibrary() {
  const [level, setLevel] = useState<'Alle' | CEFRLevel>('Alle')
  const [query, setQuery] = useState('')

  const items = useMemo(() => grammarLibrary.filter(item => {
    const levelMatch = level === 'Alle' || item.level === level
    const text = `${item.title} ${item.body} ${(item.tags ?? []).join(' ')}`.toLowerCase()
    return levelMatch && text.includes(query.toLowerCase())
  }), [level, query])

  return <div className="space-y-4">
    <div className="card">
      <div className="flex items-center gap-2"><BookMarked size={20}/><h2 className="text-3xl font-black">Grammatik</h2></div>
      <p className="mt-2 text-slate-600">Kurze Regeln, typische Fehler und Beispiele zum Nachschlagen.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-3.5 text-slate-400" size={18}/><input value={query} onChange={event => setQuery(event.target.value)} className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-3" placeholder="z. B. Dual, Akkusativ, Uhrzeit …"/></div>
        <select value={level} onChange={event => setLevel(event.target.value as 'Alle' | CEFRLevel)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <option>Alle</option><option>A1</option><option>A2</option><option>B1</option>
        </select>
      </div>
    </div>

    {items.map(item => <article key={item.id ?? item.title} className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-black">{item.title}</h3>
        {item.level && <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-900">{item.level}</span>}
      </div>
      <p className="mt-3 text-slate-600">{item.body}</p>
      <div className="mt-4 grid gap-2">{item.examples.map(example => <div key={example} className="rounded-2xl bg-lime-50 p-3 font-semibold">{example}</div>)}</div>
      {!!item.commonMistakes?.length && <div className="mt-4 rounded-2xl bg-amber-50 p-4"><div className="text-sm font-black">Häufige Fehler</div><ul className="mt-2 space-y-1 text-sm">{item.commonMistakes.map(mistake => <li key={mistake}>• {mistake}</li>)}</ul></div>}
      {!!item.tags?.length && <div className="mt-4 flex flex-wrap gap-2">{item.tags.map(tag => <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{tag}</span>)}</div>}
    </article>)}
  </div>
}
