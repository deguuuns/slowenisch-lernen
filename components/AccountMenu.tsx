'use client'

import { useState } from 'react'
import { Cloud, LogOut, Settings, Trash2, UserRound } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { CloudSession, cloudConfigured, ensureProfile, saveCloudProgress, signIn, signOut, signUp } from '@/lib/cloud-sync'
import { defaultPreferences, loadProgress, resetLearningProgress, saveProgress } from '@/lib/storage'
import { LearnerPreferences } from '@/types'

function messageFor(error:unknown){return error instanceof Error?error.message:'Die Aktion konnte nicht abgeschlossen werden.'}

export default function AccountMenu({session,syncState,preferences=defaultPreferences,onSession,onPreferences}:{session:CloudSession|null;syncState:string;preferences?:LearnerPreferences;onSession:(session:CloudSession|null)=>void;onPreferences?:(preferences:LearnerPreferences)=>void}){
  const [open,setOpen]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[confirmReset,setConfirmReset]=useState(false)
  async function login(create=false){setBusy(true);setMessage('');try{const nextSession=create?await signUp(email,password):await signIn(email,password);if(nextSession){onSession(nextSession);setMessage('Angemeldet – Fortschritt wird synchronisiert.')}else setMessage('Bitte bestätige deine E-Mail und melde dich danach an.')}catch(error){setMessage(messageFor(error))}finally{setBusy(false)}}
  async function logout(){await signOut();onSession(null);setOpen(false)}
  async function resetLearning(){setBusy(true);setMessage('');try{const owner=session?.user.id||null,current=loadProgress(owner),fresh=resetLearningProgress(current);saveProgress(fresh,owner);if(session){const profile=await ensureProfile(session);await saveCloudProgress(session,profile.id,fresh)}setMessage('Lernstand wurde zurückgesetzt.');setConfirmReset(false);setTimeout(()=>window.location.reload(),350)}catch(error){setMessage(messageFor(error)||'Lernstand konnte nicht vollständig zurückgesetzt werden.');setBusy(false)}}
  function change(next:LearnerPreferences){onPreferences?.(next)}
  const syncProblem=session&&(syncState.includes('offline')||syncState.includes('erforderlich'))

  return <div className="relative">
    <button onClick={()=>setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200/70" aria-expanded={open} aria-label="Konto und Einstellungen"><UserRound size={18}/></button>
    {open&&<div className="absolute right-0 top-12 z-[70] max-h-[min(40rem,calc(100vh-4.5rem))] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
      <div className="flex items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-lime-100 text-lime-800"><Settings size={19}/></div><div className="min-w-0"><div className="font-black">Konto & Einstellungen</div><div className="truncate text-xs text-slate-500">{session?.user.email||'Lokal lernen'}</div></div></div>

      {syncProblem&&<div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-900"><Cloud size={16} className="mr-1 inline"/>Sync: {syncState}</div>}

      {!session&&<section className="mt-5"><div className="font-black">Geräte synchronisieren</div><p className="mt-1 text-sm text-slate-500">Mit einem Konto kannst du auf mehreren Geräten weitermachen.</p>{!cloudConfigured()&&<div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">Cloud-Synchronisation ist derzeit nicht verfügbar.</div>}<input type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="E-Mail" aria-label="E-Mail" className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3"/><input type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} placeholder="Passwort" aria-label="Passwort" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"/>{message&&<div className="mt-2 text-sm text-slate-600">{message}</div>}<button disabled={busy||!email||password.length<6} onClick={()=>login(false)} className="btn-primary mt-3 w-full">Anmelden</button><button disabled={busy||!email||password.length<6} onClick={()=>login(true)} className="btn-secondary mt-2 w-full">Konto erstellen</button></section>}

      <div className="my-5 border-t border-slate-100"/>
      <section><div className="font-black">Lernziel</div><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs font-bold text-slate-500">Tagesziel<select disabled={!onPreferences} value={preferences.dailyGoalMinutes} onChange={event=>change({...preferences,dailyGoalMinutes:Number(event.target.value) as LearnerPreferences['dailyGoalMinutes']})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base font-normal"><option value={5}>5 Min.</option><option value={10}>10 Min.</option><option value={15}>15 Min.</option><option value={20}>20 Min.</option><option value={30}>30 Min.</option></select></label><label className="text-xs font-bold text-slate-500">Tempo<select disabled={!onPreferences} value={preferences.pace} onChange={event=>change({...preferences,pace:event.target.value as LearnerPreferences['pace']})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base font-normal"><option value="ruhig">Ruhig</option><option value="normal">Normal</option><option value="intensiv">Intensiv</option></select></label></div><label className="mt-3 block text-xs font-bold text-slate-500">Audio<select disabled={!onPreferences} value={preferences.audioSpeed} onChange={event=>change({...preferences,audioSpeed:event.target.value as LearnerPreferences['audioSpeed']})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base font-normal"><option value="langsam">Langsam</option><option value="normal">Normal</option></select></label></section>

      <div className="my-5 border-t border-slate-100"/>
      <section><div className="font-black">Darstellung</div><div className="mt-3"><ThemeToggle/></div></section>

      <div className="my-5 border-t border-slate-100"/>
      <section><div className="font-black">Lernstand</div>{confirmReset?<div className="mt-3 rounded-2xl bg-red-50 p-3"><div className="font-bold">Wirklich zurücksetzen?</div><p className="mt-1 text-sm text-slate-600">Lektionen, Wiederholungen, Fehler und Mastery werden gelöscht. Konto und Einstellungen bleiben bestehen.</p><div className="mt-3 grid grid-cols-2 gap-2"><button disabled={busy} onClick={()=>setConfirmReset(false)} className="btn-secondary">Abbrechen</button><button disabled={busy} onClick={resetLearning} className="min-h-11 rounded-2xl bg-red-600 px-3 font-bold text-white">Zurücksetzen</button></div></div>:<button onClick={()=>setConfirmReset(true)} className="btn-secondary mt-3 w-full text-red-700"><Trash2 size={16}/>Lernstand zurücksetzen</button>}{message&&session&&<div className="mt-2 text-sm text-slate-600">{message}</div>}{session&&<button onClick={logout} className="btn-secondary mt-3 w-full"><LogOut size={16}/>Abmelden</button>}</section>
    </div>}
  </div>
}
