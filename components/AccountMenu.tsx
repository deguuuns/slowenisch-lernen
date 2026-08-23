'use client'

import { useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import {
  CloudSession,
  cloudConfigured,
  ensureProfile,
  saveCloudProgress,
  signIn,
  signOut,
  signUp,
} from '@/lib/cloud-sync'
import { defaultPreferences, loadProgress, resetLearningProgress, saveProgress } from '@/lib/storage'
import { LearnerPreferences } from '@/types'

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : 'Die Aktion konnte nicht abgeschlossen werden.'
}

export default function AccountMenu({
  session,
  syncState,
  preferences = defaultPreferences,
  onSession,
  onPreferences,
}: {
  session: CloudSession | null
  syncState: string
  preferences?: LearnerPreferences
  onSession: (session: CloudSession | null) => void
  onPreferences?: (preferences: LearnerPreferences) => void
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  async function login(create = false) {
    setBusy(true)
    setMessage('')
    try {
      const nextSession = create ? await signUp(email, password) : await signIn(email, password)
      if (nextSession) {
        onSession(nextSession)
        setMessage('Angemeldet – Fortschritt wird synchronisiert.')
      } else {
        setMessage('Bitte bestätige deine E-Mail und melde dich danach an.')
      }
    } catch (error) {
      setMessage(messageFor(error))
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    await signOut()
    onSession(null)
    setOpen(false)
  }

  async function resetLearning() {
    setBusy(true)
    setMessage('')
    try {
      const owner = session?.user.id || null
      const current = loadProgress(owner)
      const fresh = resetLearningProgress(current)
      saveProgress(fresh, owner)
      if (session) {
        const profile = await ensureProfile(session)
        await saveCloudProgress(session, profile.id, fresh)
      }
      setMessage('Lernstand wurde zurückgesetzt.')
      setConfirmReset(false)
      setTimeout(() => window.location.reload(), 350)
    } catch (error) {
      setMessage(messageFor(error) || 'Lernstand konnte nicht vollständig zurückgesetzt werden.')
      setBusy(false)
    }
  }

  function change(next: LearnerPreferences) {
    onPreferences?.(next)
  }

  const label = session?.user?.email?.split('@')[0] || 'Konto'

  return (
    <div className="relative min-w-0">
      <button
        onClick={() => setOpen(!open)}
        className="max-w-[8rem] truncate rounded-full bg-white px-3 py-2 text-sm font-bold shadow-soft sm:max-w-[12rem]"
        aria-expanded={open}
        aria-label="Kontomenü"
      >
        {label}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-[70] max-h-[calc(100dvh-5rem)] w-[min(22rem,calc(100vw-1.25rem))] min-w-0 overflow-y-auto overscroll-contain rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-slate-100">
          {session ? (
            <>
              <div className="break-words font-black [overflow-wrap:anywhere]">{session.user.email || 'Benutzerkonto'}</div>
              <div className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">Sync: {syncState}</div>
              <div className="mt-4 break-words rounded-2xl bg-lime-50 p-3 text-sm">Dein Lernstand wird zusätzlich lokal gespeichert. Offline kannst du weiterlernen.</div>
            </>
          ) : (
            <>
              <div className="break-words font-black">Lernstand synchronisieren</div>
              <p className="mt-1 break-words text-sm text-slate-500">Mit einem Konto kannst du auf mehreren Geräten weitermachen.</p>
              {!cloudConfigured() && <div className="mt-3 break-words rounded-2xl bg-amber-50 p-3 text-sm">Cloud-Synchronisation ist derzeit nicht verfügbar.</div>}
              <input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="E-Mail" aria-label="E-Mail" className="mt-4 w-full min-w-0 rounded-2xl border border-slate-200 px-4 py-3 text-base" />
              <input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Passwort" aria-label="Passwort" className="mt-2 w-full min-w-0 rounded-2xl border border-slate-200 px-4 py-3 text-base" />
              {message && <div className="mt-3 break-words text-sm text-slate-600 [overflow-wrap:anywhere]">{message}</div>}
              <button disabled={busy || !email || password.length < 6} onClick={() => login(false)} className="btn-primary mt-4 w-full min-h-11 justify-center whitespace-normal disabled:opacity-40">Anmelden</button>
              <button disabled={busy || !email || password.length < 6} onClick={() => login(true)} className="mt-2 min-h-11 w-full whitespace-normal rounded-2xl border border-slate-200 px-4 py-3 font-bold disabled:opacity-40">Konto erstellen</button>
            </>
          )}

          <div className="my-4 border-t border-slate-100" />
          <div className="font-black">Lerneinstellungen</div>
          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-400">Tagesziel</label>
          <select disabled={!onPreferences} value={preferences.dailyGoalMinutes} onChange={event => change({...preferences,dailyGoalMinutes:Number(event.target.value) as LearnerPreferences['dailyGoalMinutes']})} className="mt-1 w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-3 text-base disabled:opacity-50"><option value={5}>5 Minuten</option><option value={10}>10 Minuten</option><option value={15}>15 Minuten</option><option value={20}>20 Minuten</option><option value={30}>30 Minuten</option></select>
          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-400">Tempo</label>
          <select disabled={!onPreferences} value={preferences.pace} onChange={event => change({...preferences,pace:event.target.value as LearnerPreferences['pace']})} className="mt-1 w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-3 text-base disabled:opacity-50"><option value="ruhig">Ruhig</option><option value="normal">Normal</option><option value="intensiv">Intensiv</option></select>
          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-slate-400">Audio</label>
          <select disabled={!onPreferences} value={preferences.audioSpeed} onChange={event => change({...preferences,audioSpeed:event.target.value as LearnerPreferences['audioSpeed']})} className="mt-1 w-full min-w-0 rounded-2xl border border-slate-200 px-3 py-3 text-base disabled:opacity-50"><option value="langsam">Langsam</option><option value="normal">Normal</option></select>

          <div className="my-4 border-t border-slate-100" />
          <div className="font-black">Darstellung</div>
          <p className="mt-1 mb-3 text-sm text-slate-500">Hell, dunkel oder automatisch passend zu deinem Gerät.</p>
          <ThemeToggle />

          <div className="my-4 border-t border-slate-100" />
          <div className="font-black">Lernstand</div>
          {confirmReset ? (
            <div className="mt-3 min-w-0 rounded-2xl bg-red-50 p-3">
              <div className="break-words font-bold">Lernstand wirklich zurücksetzen?</div>
              <p className="mt-1 break-words text-sm text-slate-600">Lektionen, Wiederholungen, Fehler, Mastery und eingeführte Inhalte werden gelöscht. Dein Konto und deine Lerneinstellungen bleiben bestehen.</p>
              <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
                <button disabled={busy} onClick={() => setConfirmReset(false)} className="min-h-11 whitespace-normal rounded-xl border border-slate-200 px-3 py-2 font-bold">Abbrechen</button>
                <button disabled={busy} onClick={resetLearning} className="min-h-11 whitespace-normal rounded-xl bg-red-600 px-3 py-2 font-bold text-white">Zurücksetzen</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="mt-3 min-h-11 w-full whitespace-normal rounded-2xl border border-red-200 px-4 py-3 font-bold text-red-700">Lernstand zurücksetzen</button>
          )}
          {message && session && <div className="mt-3 break-words text-sm text-slate-600 [overflow-wrap:anywhere]">{message}</div>}
          {session && <button onClick={logout} className="mt-4 min-h-11 w-full whitespace-normal rounded-2xl border border-slate-200 px-4 py-3 font-bold">Abmelden</button>}
        </div>
      )}
    </div>
  )
}
