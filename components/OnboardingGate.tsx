'use client'

import { useEffect, useState } from 'react'
import { Brain, ChevronRight, Gauge, Plus, Sparkles, UserRound } from 'lucide-react'
import type { LearnerProfile, SelfAssessmentLevel, StartMode } from '@/types'
import { createProfile, getActiveProfile, listProfiles, setActiveProfile } from '@/lib/profileStorage'
import { resetProgressForProfile } from '@/lib/storage'

type Step = 'profiles' | 'name' | 'start' | 'self-assessment' | 'ready'

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [profiles, setProfiles] = useState<LearnerProfile[]>([])
  const [active, setActive] = useState<LearnerProfile | null>(null)
  const [step, setStep] = useState<Step>('profiles')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<StartMode>('zero')
  const [selfAssessment, setSelfAssessment] = useState<SelfAssessmentLevel>('few-words')

  useEffect(() => {
    const found = listProfiles()
    const current = getActiveProfile()
    setProfiles(found)
    setActive(current)
    setStep(current ? 'ready' : found.length ? 'profiles' : 'name')
    setHydrated(true)
  }, [])

  if (!hydrated) return <div className="min-h-screen bg-[#f7f8f4]"/>
  if (active && step === 'ready') return <>{children}</>

  function chooseExisting(profile: LearnerProfile) {
    setActiveProfile(profile.id)
    setActive(profile)
    setStep('ready')
    window.location.reload()
  }

  function finishProfile() {
    const profile = createProfile({
      name,
      startMode: mode,
      selfAssessment: mode === 'self-assessment' ? selfAssessment : undefined,
      placementCompleted: mode !== 'placement',
    })
    if (mode === 'zero') resetProgressForProfile(profile.id)
    setProfiles(listProfiles())
    setActive(profile)
    setStep('ready')
    window.location.reload()
  }

  return <main className="min-h-screen bg-[#f7f8f4] px-4 py-8">
    <div className="mx-auto max-w-2xl">
      <div className="mb-7"><div className="text-xs font-black uppercase tracking-[0.28em] text-lime-700">Slovensko</div><h1 className="mt-2 text-3xl font-black">Willkommen. Wir bauen deinen Lernweg.</h1><p className="mt-3 text-slate-600">Du musst später nicht entscheiden, was du üben sollst. Sag uns nur, wo du ungefähr startest.</p></div>

      {step === 'profiles' && <div className="space-y-4">
        <div className="card"><h2 className="text-xl font-black">Wer lernt heute?</h2><div className="mt-4 grid gap-2">{profiles.map(profile => <button key={profile.id} onClick={() => chooseExisting(profile)} className="flex min-h-14 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left"><span><strong>{profile.name}</strong><span className="ml-2 text-sm text-slate-500">{profile.approximateLevel}</span></span><ChevronRight/></button>)}</div><button onClick={() => { setName(''); setStep('name') }} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white"><Plus size={18}/> Neues Lernprofil</button></div>
      </div>}

      {step === 'name' && <div className="card"><div className="flex items-center gap-2"><UserRound/><h2 className="text-xl font-black">Dein Lernprofil</h2></div><p className="mt-2 text-sm text-slate-500">Auf einem Gerät können mehrere Personen getrennt lernen.</p><label className="mt-5 block text-sm font-bold">Name oder Profilname</label><input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="z. B. Dejan" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500"/><button disabled={!name.trim()} onClick={() => setStep('start')} className="btn-primary mt-5 w-full justify-center disabled:opacity-40">Weiter <ChevronRight size={18}/></button>{profiles.length > 0 && <button onClick={() => setStep('profiles')} className="mt-3 w-full text-sm font-bold text-slate-500">Zurück zu den Profilen</button>}</div>}

      {step === 'start' && <div className="space-y-3">
        <h2 className="text-2xl font-black">Wie möchtest du starten?</h2>
        <Choice icon={Sparkles} title="Ich fange bei null an" text="Keine Vorkenntnisse. Wir beginnen mit wenigen Wörtern und bauen alles Schritt für Schritt auf." onClick={() => { setMode('zero'); finishWith('zero') }}/>
        <Choice icon={Brain} title="Ich kann schon etwas Slowenisch" text="Deine Selbsteinschätzung ist nur ein Startpunkt. Die App korrigiert das Lernmodell später anhand deiner Antworten." onClick={() => { setMode('self-assessment'); setStep('self-assessment') }}/>
        <Choice icon={Gauge} title="Mach einen Einstufungstest mit mir" text="Wir starten leicht und sammeln mehrere Hinweise, bevor wir etwas als beherrscht oder unbekannt einstufen." onClick={() => { setMode('placement'); finishWith('placement') }}/>
      </div>}

      {step === 'self-assessment' && <div className="card"><h2 className="text-xl font-black">Was passt am ehesten?</h2><div className="mt-4 grid gap-2">{([
        ['few-words','Ich kenne ein paar Wörter'],['simple-sentences','Ich kann einfache Sätze'],['A1','Ungefähr A1'],['A2','Ungefähr A2'],['advanced','Mehr als A2'],
      ] as [SelfAssessmentLevel,string][]).map(([value,label]) => <button key={value} onClick={() => setSelfAssessment(value)} className={`min-h-12 rounded-2xl border px-4 py-3 text-left font-semibold ${selfAssessment === value ? 'border-lime-500 bg-lime-50' : 'border-slate-200 bg-white'}`}>{label}</button>)}</div><button onClick={() => finishWith('self-assessment')} className="btn-primary mt-5 w-full justify-center">Persönlichen Lernplan erstellen</button></div>}
    </div>
  </main>

  function finishWith(nextMode: StartMode) {
    setMode(nextMode)
    const profile = createProfile({
      name,
      startMode: nextMode,
      selfAssessment: nextMode === 'self-assessment' ? selfAssessment : undefined,
      placementCompleted: nextMode !== 'placement',
    })
    if (nextMode === 'zero') resetProgressForProfile(profile.id)
    setActive(profile)
    setStep('ready')
    window.location.reload()
  }
}

function Choice({ icon: Icon, title, text, onClick }: { icon: any; title: string; text: string; onClick: () => void }) {
  return <button onClick={onClick} className="card flex w-full items-start gap-4 text-left transition hover:-translate-y-0.5"><div className="rounded-2xl bg-lime-100 p-3"><Icon/></div><div className="min-w-0 flex-1"><div className="font-black">{title}</div><div className="mt-1 text-sm text-slate-500">{text}</div></div><ChevronRight className="mt-2 shrink-0"/></button>
}
