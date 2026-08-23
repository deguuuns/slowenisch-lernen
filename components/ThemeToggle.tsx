'use client'

import { Laptop, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
const STORAGE_KEY = 'slovensko-theme'

function applyTheme(preference: ThemePreference) {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference
  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>('system')

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const initial: ThemePreference = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
    setTheme(initial)
    applyTheme(initial)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = () => { if ((window.localStorage.getItem(STORAGE_KEY) || 'system') === 'system') applyTheme('system') }
    media.addEventListener('change', onSystemChange)
    return () => media.removeEventListener('change', onSystemChange)
  }, [])

  function change(next: ThemePreference) {
    setTheme(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }

  const choices = [
    { value: 'light' as const, label: 'Hell', icon: Sun },
    { value: 'dark' as const, label: 'Dunkel', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Laptop },
  ]

  return <div className="grid grid-cols-3 gap-2" role="group" aria-label="Darstellung">
    {choices.map(choice => <button key={choice.value} type="button" onClick={() => change(choice.value)} aria-pressed={theme === choice.value} className={`flex min-h-11 items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-bold ${theme === choice.value ? 'border-lime-500 bg-lime-100 text-slate-950' : 'border-slate-200 bg-white text-slate-600'}`}><choice.icon size={15}/>{choice.label}</button>)}
  </div>
}
