'use client'

import { useState } from 'react'
import { CloudSession, cloudConfigured, signIn, signOut, signUp } from '@/lib/cloud-sync'

export default function AccountMenu({session,syncState,onSession}:{session:CloudSession|null;syncState:string;onSession:(s:CloudSession|null)=>void}){
  const [open,setOpen]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
  async function login(create=false){ setBusy(true);setMessage('');try{const s=create?await signUp(email,password):await signIn(email,password);if(s){onSession(s);setMessage('Angemeldet – Fortschritt wird synchronisiert.')}else setMessage('Bitte bestätige deine E-Mail und melde dich danach an.')}catch(e:any){setMessage(e.message)}finally{setBusy(false)} }
  async function logout(){await signOut();onSession(null);setOpen(false)}
  const label=session?.user?.email?.split('@')[0]||'Konto'
  return <div className="relative">
    <button onClick={()=>setOpen(!open)} className="rounded-full bg-white px-3 py-2 text-sm font-bold shadow-soft">{label}</button>
    {open&&<div className="absolute right-0 top-12 z-[70] w-[min(22rem,calc(100vw-2rem))] rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-slate-100">
      {session?<><div className="font-black">{session.user.email||'Benutzerkonto'}</div><div className="mt-1 text-sm text-slate-500">Sync: {syncState}</div><div className="mt-4 rounded-2xl bg-lime-50 p-3 text-sm">Dein Lernstand wird zusätzlich lokal gespeichert. Ohne Internet kannst du weiterlernen; nach der nächsten Verbindung wird wieder synchronisiert.</div><button onClick={logout} className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold">Abmelden</button></>:<>
        <div className="font-black">Lernstand synchronisieren</div><p className="mt-1 text-sm text-slate-500">Mit einem Konto kannst du auf mehreren Geräten weitermachen.</p>
        {!cloudConfigured()&&<div className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm">Supabase-Umgebungsvariablen fehlen noch in der Bereitstellung.</div>}
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-Mail" className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3"/>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Passwort" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"/>
        {message&&<div className="mt-3 text-sm text-slate-600">{message}</div>}
        <button disabled={busy||!email||password.length<6} onClick={()=>login(false)} className="btn-primary mt-4 w-full justify-center disabled:opacity-40">Anmelden</button>
        <button disabled={busy||!email||password.length<6} onClick={()=>login(true)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-bold disabled:opacity-40">Konto erstellen</button>
      </>}
    </div>}
  </div>
}
