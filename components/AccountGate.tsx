'use client'

import { useEffect, useState } from 'react'
import { Cloud, LogIn, LogOut, ShieldCheck, UserPlus, X } from 'lucide-react'
import { isSupabaseConfigured, loadSupabaseSession, signInWithPassword, signOutLocal, signUpWithPassword, type SupabaseSession } from '@/lib/supabaseHttp'
import { syncAllProfiles } from '@/lib/cloudSync'

export default function AccountGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SupabaseSession | null>(null)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const configured = isSupabaseConfigured()

  useEffect(() => {
    const current = loadSupabaseSession()
    setSession(current)
    if (!current && configured && !localStorage.getItem('slovensko-cloud-intro-seen')) setOpen(true)
    if (current) void syncAllProfiles().then(() => window.dispatchEvent(new Event('slovensko-cloud-synced'))).catch(() => undefined)
  }, [configured])

  async function submit() {
    if (!email.trim() || password.length < 6) {
      setMessage('Bitte gib eine gültige E-Mail und ein Passwort mit mindestens 6 Zeichen ein.')
      return
    }
    setBusy(true); setMessage('')
    try {
      if (mode === 'signup') {
        const result = await signUpWithPassword(email.trim(), password)
        if (!result.session) {
          setMessage('Konto erstellt. Bitte bestätige zuerst die E-Mail und melde dich danach an.')
          setMode('signin')
          return
        }
        setSession(result.session)
      } else {
        const next = await signInWithPassword(email.trim(), password)
        setSession(next)
      }
      await syncAllProfiles()
      localStorage.setItem('slovensko-cloud-intro-seen', '1')
      setOpen(false)
      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Anmeldung fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  function continueLocal() {
    localStorage.setItem('slovensko-cloud-intro-seen', '1')
    setOpen(false)
  }

  function logout() {
    signOutLocal()
    setSession(null)
    setOpen(true)
    setMessage('Abgemeldet. Dein lokaler Lernstand bleibt auf diesem Gerät erhalten.')
  }

  return <>
    {children}

    {configured && <div className="fixed left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[75]">
      {session ? <button onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-lime-200 bg-white/95 px-3 py-2 text-xs font-bold text-lime-800 shadow-soft backdrop-blur"><ShieldCheck size={16}/> Cloud aktiv</button> : <button onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-xs font-bold text-slate-700 shadow-soft backdrop-blur"><Cloud size={16}/> Cloud-Sync</button>}
    </div>}

    {open && configured && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-[0.2em] text-lime-700">Geräteübergreifend</div><h2 className="mt-1 text-2xl font-black">{session ? 'Cloud-Sync ist aktiv' : mode === 'signin' ? 'Bei deinem Lernkonto anmelden' : 'Lernkonto erstellen'}</h2></div><button onClick={() => setOpen(false)} className="touch-target rounded-xl p-2 text-slate-400"><X/></button></div>

        {session ? <div className="mt-5 space-y-4"><div className="rounded-2xl bg-lime-50 p-4"><div className="font-bold">{session.user.email ?? 'Angemeldeter Nutzer'}</div><p className="mt-1 text-sm text-slate-600">Profile und Lernstand können auf anderen Geräten mit demselben Konto synchronisiert werden.</p></div><button onClick={() => void syncAllProfiles().then(() => { setMessage('Synchronisierung abgeschlossen.'); window.dispatchEvent(new Event('slovensko-cloud-synced')) })} className="btn-primary w-full justify-center"><Cloud size={18}/> Jetzt synchronisieren</button><button onClick={logout} className="flex min-h-11 w-full items-center justify-center gap-2 text-sm font-bold text-slate-500"><LogOut size={17}/> Abmelden</button>{message && <p className="text-sm text-slate-600">{message}</p>}</div> : <>
          <p className="mt-3 text-sm text-slate-600">Mit demselben Konto kannst du später auf iPhone, PC oder iPad dort weitermachen, wo du aufgehört hast.</p>
          <label className="mt-5 block text-sm font-bold">E-Mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500" autoComplete="email"/>
          <label className="mt-4 block text-sm font-bold">Passwort</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}/>
          {message && <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">{message}</div>}
          <button disabled={busy} onClick={submit} className="btn-primary mt-5 w-full justify-center disabled:opacity-50">{mode === 'signin' ? <LogIn size={18}/> : <UserPlus size={18}/>} {busy ? 'Bitte warten …' : mode === 'signin' ? 'Anmelden' : 'Konto erstellen'}</button>
          <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('') }} className="mt-3 w-full text-sm font-bold text-slate-600">{mode === 'signin' ? 'Noch kein Konto? Konto erstellen' : 'Schon ein Konto? Anmelden'}</button>
          <button onClick={continueLocal} className="mt-4 w-full text-sm font-semibold text-slate-400">Vorerst nur auf diesem Gerät lernen</button>
        </>}
      </div>
    </div>}
  </>
}
