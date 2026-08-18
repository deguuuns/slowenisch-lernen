'use client'

import { useEffect, useState } from 'react'
import { Brain, ChevronRight, Plus, Sparkles, UserRound, Users } from 'lucide-react'
import PlacementTest from '@/components/PlacementTest'
import type { LearnerProfile, SelfAssessmentLevel, StartMode } from '@/types'
import type { PlacementEvidence } from '@/lib/placement'
import { createProfile, getActiveProfile, listProfiles, setActiveProfile } from '@/lib/profileStorage'
import { defaultProgress, resetProgressForProfile, saveProgress } from '@/lib/storage'

type Step = 'profiles' | 'name' | 'start' | 'self-assessment' | 'placement' | 'ready'

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [profiles, setProfiles] = useState<LearnerProfile[]>([])
  const [active, setActive] = useState<LearnerProfile | null>(null)
  const [step, setStep] = useState<Step>('profiles')
  const [name, setName] = useState('')
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

  if (active && step === 'ready') return <>
    <button onClick={() => { setProfiles(listProfiles()); setStep('profiles') }} className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[70] inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-xs font-bold shadow-soft backdrop-blur" aria-label="Lernprofil wechseln"><Users size={16}/><span className="max-w-24 truncate">{active.name}</span></button>
    {children}
  </>

  function chooseExisting(profile: LearnerProfile) {
    setActiveProfile(profile.id)
    setActive(profile)
    setStep('ready')
    window.location.reload()
  }

  function createAndOpen(nextMode: StartMode, options?: { level?: 'A1' | 'A2' | 'B1'; placement?: PlacementEvidence }) {
    const profile = createProfile({
      name,
      startMode: nextMode,
      selfAssessment: nextMode === 'self-assessment' ? selfAssessment : undefined,
      approximateLevel: options?.level,
      placementCompleted: nextMode !== 'placement' || !!options?.placement,
    })

    if (nextMode === 'zero') {
      resetProgressForProfile(profile.id)
    } else if (options?.placement) {
      const evidence = options.placement
      const skillSeed = evidence.level === 'A2' ? 14 : 5
      const knownVocabulary = evidence.knownTargets.filter(key => key.startsWith('vocab:')).map(key => key.slice('vocab:'.length))
      const knownGrammar = evidence.knownTargets.filter(key => key.startsWith('grammar:')).map(key => key.slice('grammar:'.length))
      saveProgress({
        ...defaultProgress,
        introducedVocabulary: knownVocabulary,
        introducedGrammar: knownGrammar,
        skillXp: { lesen: skillSeed, hören: Math.max(1, skillSeed - 4), schreiben: 0, sprechen: 0, grammatik: Math.max(2, skillSeed - 2), wortschatz: skillSeed },
        learningItems: Object.fromEntries(evidence.knownTargets.map(key => [key, {
          key,
          kind: key.startsWith('grammar:') ? 'grammar' : key.startsWith('vocab:') ? (key.includes(' ') ? 'chunk' : 'vocabulary') : key.startsWith('conjugation:') ? 'conjugation' : 'pattern',
          level: evidence.level,
          stage: 'recognition',
          attempts: 1,
          correctCount: 1,
          incorrectCount: 0,
          correctStreak: 1,
          incorrectStreak: 0,
          mastery: 0.36,
          receptiveMastery: 0.55,
          recallMastery: 0,
          productiveMastery: 0,
          difficulty: 2,
          introduced: true,
        }])),
      }, profile.id)
    }

    setProfiles(listProfiles())
    setActive(profile)
    setStep('ready')
    window.location.reload()
  }

  return <main className="min-h-screen bg-[#f7f8f4] px-4 py-8">
    <div className="mx-auto max-w-2xl">
      <div className="mb-7"><div className="text-xs font-black uppercase tracking-[0.28em] text-lime-700">Slovensko</div><h1 className="mt-2 text-3xl font-black">Willkommen. Wir bauen deinen Lernweg.</h1><p className="mt-3 text-slate-600">Du musst später nicht entscheiden, was du üben sollst. Sag uns nur, ob du wirklich bei null startest.</p></div>

      {step === 'profiles' && <div className="space-y-4"><div className="card"><h2 className="text-xl font-black">Wer lernt heute?</h2><p className="mt-1 text-sm text-slate-500">Jedes Profil hat auf diesem Gerät einen getrennten Lernstand.</p><div className="mt-4 grid gap-2">{profiles.map(profile => <button key={profile.id} onClick={() => chooseExisting(profile)} className="flex min-h-14 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left"><span><strong>{profile.name}</strong><span className="ml-2 text-sm text-slate-500">{profile.approximateLevel}</span></span><ChevronRight/></button>)}</div><button onClick={() => { setName(''); setStep('name') }} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white"><Plus size={18}/> Neues Lernprofil</button>{active && <button onClick={() => setStep('ready')} className="mt-3 block text-sm font-bold text-slate-500">Zurück zu {active.name}</button>}</div></div>}

      {step === 'name' && <div className="card"><div className="flex items-center gap-2"><UserRound/><h2 className="text-xl font-black">Dein Lernprofil</h2></div><p className="mt-2 text-sm text-slate-500">Auf einem Gerät können mehrere Personen getrennt lernen.</p><label className="mt-5 block text-sm font-bold">Name oder Profilname</label><input autoFocus value={name} onChange={event => setName(event.target.value)} placeholder="z. B. Dejan" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500"/><button disabled={!name.trim()} onClick={() => setStep('start')} className="btn-primary mt-5 w-full justify-center disabled:opacity-40">Weiter <ChevronRight size={18}/></button>{profiles.length > 0 && <button onClick={() => setStep('profiles')} className="mt-3 w-full text-sm font-bold text-slate-500">Zurück zu den Profilen</button>}</div>}

      {step === 'start' && <div className="space-y-3"><h2 className="text-2xl font-black">Wie möchtest du starten?</h2><Choice icon={Sparkles} title="Ich fange ganz neu an" text="Keine Vorkenntnisse. Wir beginnen mit wenigen Wörtern und bauen alles Schritt für Schritt auf." onClick={() => createAndOpen('zero')}/><Choice icon={Brain} title="Ich kann schon etwas Slowenisch" text="Ein kurzer, leichter Check erkennt bekannte Grundlagen. Richtige Recognition-Antworten werden nicht automatisch als freie Sprachbeherrschung gewertet." onClick={() => setStep('placement')}/></div>}

      {step === 'self-assessment' && <div className="card"><h2 className="text-xl font-black">Was passt am ehesten?</h2><div className="mt-4 grid gap-2">{([['few-words','Ich kenne ein paar Wörter'],['simple-sentences','Ich kann einfache Sätze'],['A1','Ungefähr A1'],['A2','Ungefähr A2'],['advanced','Mehr als A2']] as [SelfAssessmentLevel,string][]).map(([value,label]) => <button key={value} onClick={() => setSelfAssessment(value)} className={`min-h-12 rounded-2xl border px-4 py-3 text-left font-semibold ${selfAssessment === value ? 'border-lime-500 bg-lime-50' : 'border-slate-200 bg-white'}`}>{label}</button>)}</div><button onClick={() => createAndOpen('self-assessment', { level: selfAssessment === 'A2' || selfAssessment === 'advanced' ? 'A2' : 'A1' })} className="btn-primary mt-5 w-full justify-center">Persönlichen Lernplan erstellen</button></div>}

      {step === 'placement' && <PlacementTest onComplete={result => createAndOpen('placement', { level: result.level, placement: result })}/>} 
    </div>
  </main>
}

function Choice({ icon: Icon, title, text, onClick }: { icon: any; title: string; text: string; onClick: () => void }) {
  return <button onClick={onClick} className="card flex w-full items-start gap-4 text-left transition hover:-translate-y-0.5"><div className="rounded-2xl bg-lime-100 p-3"><Icon/></div><div className="min-w-0 flex-1"><div className="font-black">{title}</div><div className="mt-1 text-sm text-slate-500">{text}</div></div><ChevronRight className="mt-2 shrink-0"/></button>
}
