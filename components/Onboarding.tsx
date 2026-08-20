'use client'

import { useState } from 'react'
import { LearnerPreferences } from '@/types'

export default function Onboarding({
  preferences,
  onSave,
}: {
  preferences: LearnerPreferences
  onSave: (preferences: LearnerPreferences) => void
}) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<LearnerPreferences>(preferences)
  if (preferences.onboardingCompleted) return null

  const steps = [
    <div key="goal" className="min-w-0">
      <div className="text-sm font-bold text-lime-700">1 von 3</div>
      <h2 className="mt-2 break-words text-2xl font-black sm:text-3xl [overflow-wrap:anywhere]">Wie viel möchtest du täglich lernen?</h2>
      <p className="mt-2 break-words text-slate-600">Das ist nur ein Richtwert. Die App passt die Sitzung später an deinen Lernstand an.</p>
      <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 xs:grid-cols-3 sm:grid-cols-5">
        {([5,10,15,20,30] as const).map(value => <button key={value} onClick={() => setDraft({...draft,dailyGoalMinutes:value})} className={`min-h-12 min-w-0 rounded-2xl border px-2 py-3 font-black ${draft.dailyGoalMinutes===value?'border-lime-500 bg-lime-100':'border-slate-200'}`}>{value} min</button>)}
      </div>
    </div>,
    <div key="pace" className="min-w-0">
      <div className="text-sm font-bold text-lime-700">2 von 3</div>
      <h2 className="mt-2 break-words text-2xl font-black sm:text-3xl [overflow-wrap:anywhere]">Welches Lerntempo passt zu dir?</h2>
      <div className="mt-5 space-y-2">
        {([['ruhig','Ruhig','Wenig neuer Stoff, mehr Wiederholung'],['normal','Normal','Ausgewogene Mischung'],['intensiv','Intensiv','Mehr neuer Stoff pro Sitzung']] as const).map(([id,title,body]) => <button key={id} onClick={() => setDraft({...draft,pace:id})} className={`w-full min-w-0 rounded-2xl border p-4 text-left ${draft.pace===id?'border-lime-500 bg-lime-50':'border-slate-200'}`}><div className="break-words font-black">{title}</div><div className="break-words text-sm text-slate-500">{body}</div></button>)}
      </div>
    </div>,
    <div key="level" className="min-w-0">
      <div className="text-sm font-bold text-lime-700">3 von 3</div>
      <h2 className="mt-2 break-words text-2xl font-black sm:text-3xl [overflow-wrap:anywhere]">Wo möchtest du starten?</h2>
      <p className="mt-2 break-words text-slate-600">Für den aktuellen Prototyp ist A1 vollständig aktiv. Höhere Ziele speichern wir schon für den späteren Ausbau.</p>
      <div className="mt-5 grid min-w-0 grid-cols-2 gap-2">
        {(['A1','A2','B1','B2'] as const).map(value => <button key={value} onClick={() => setDraft({...draft,targetLevel:value})} className={`min-h-16 min-w-0 rounded-2xl border p-3 text-left sm:p-4 ${draft.targetLevel===value?'border-lime-500 bg-lime-50':'border-slate-200'}`}><div className="text-xl font-black">{value}</div><div className="break-words text-sm text-slate-500">{value==='A1'?'Anfänger':value==='A2'?'Grundkenntnisse':value==='B1'?'Mittelstufe':'Gute Mittelstufe'}</div></button>)}
      </div>
    </div>,
  ]

  return <div className="fixed inset-0 z-[100] flex min-w-0 items-end justify-center overflow-hidden bg-slate-950/50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center"><div className="max-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-xl overflow-y-auto overscroll-contain rounded-[2rem] bg-white p-5 shadow-2xl sm:p-8">{steps[step]}<div className="mt-7 flex min-w-0 flex-wrap items-center justify-between gap-2"><button disabled={step===0} onClick={() => setStep(Math.max(0,step-1))} className="min-h-11 rounded-2xl px-4 py-3 font-bold text-slate-500 disabled:opacity-0">Zurück</button>{step<2?<button onClick={() => setStep(step+1)} className="btn-primary min-h-11 whitespace-normal">Weiter</button>:<button onClick={() => onSave({...draft,onboardingCompleted:true})} className="btn-primary min-h-11 whitespace-normal">Lernen starten</button>}</div></div></div>
}
