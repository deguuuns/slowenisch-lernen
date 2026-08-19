'use client'

import { Apple, BookOpen, Car, Cat, Coffee, Dog, Droplets, House, Smartphone, Wheat } from 'lucide-react'

const VISUALS = {
  hisa: House,
  avto: Car,
  voda: Droplets,
  kava: Coffee,
  kruh: Wheat,
  pes: Dog,
  macka: Cat,
  knjiga: BookOpen,
  telefon: Smartphone,
  jabolko: Apple,
} as const

export type VocabularyVisualKey = keyof typeof VISUALS

export function hasVocabularyVisual(key?: string): key is VocabularyVisualKey {
  return !!key && key in VISUALS
}

export default function VocabularyVisual({
  visualKey,
  label,
  quiz = false,
  className = '',
}: {
  visualKey?: string
  label?: string
  quiz?: boolean
  className?: string
}) {
  if (!hasVocabularyVisual(visualKey)) {
    return <div className={`flex min-h-28 items-center justify-center rounded-3xl bg-slate-100 text-sm font-bold text-slate-400 ${className}`}>Bild nicht verfügbar</div>
  }
  const Icon = VISUALS[visualKey]
  return (
    <div
      role="img"
      aria-label={quiz ? 'Bildoption' : (label ?? 'Vokabelbild')}
      className={`flex min-h-32 items-center justify-center rounded-3xl bg-gradient-to-br from-lime-50 to-white ring-1 ring-lime-100 ${className}`}
    >
      <Icon size={72} strokeWidth={1.7} aria-hidden="true" />
    </div>
  )
}
