'use client'

import { useState } from 'react'
import { LearnerPreferences } from '@/types'

export default function Onboarding({preferences,onSave}:{preferences:LearnerPreferences;onSave:(preferences:LearnerPreferences)=>void}){
  const [step,setStep]=useState(0)
  const [draft,setDraft]=useState<LearnerPreferences>(preferences)
  if(preferences.onboardingCompleted)return null

  const steps=[
    <div key="goal"><div className="eyebrow">1 von 3</div><h2 className="mt-2 text-3xl font-black tracking-tight">Wie lange möchtest du täglich lernen?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Du kannst das Ziel später jederzeit ändern.</p><div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">{([5,10,15,20,30] as const).map(value=><button key={value} onClick={()=>setDraft({...draft,dailyGoalMinutes:value})} className={`min-h-14 rounded-2xl border px-2 font-black ${draft.dailyGoalMinutes===value?'border-lime-500 bg-lime-100':'border-slate-200 bg-white'}`}>{value}<span className="ml-1 text-xs font-semibold text-slate-500">min</span></button>)}</div></div>,
    <div key="pace"><div className="eyebrow">2 von 3</div><h2 className="mt-2 text-3xl font-black tracking-tight">Welches Tempo passt zu dir?</h2><div className="mt-5 space-y-2">{([['ruhig','Ruhig','Mehr Wiederholung, weniger neuer Stoff'],['normal','Normal','Ausgewogene Mischung'],['intensiv','Intensiv','Mehr neuer Stoff pro Runde']] as const).map(([id,title,body])=><button key={id} onClick={()=>setDraft({...draft,pace:id})} className={`w-full rounded-2xl border p-4 text-left ${draft.pace===id?'border-lime-500 bg-lime-50':'border-slate-200 bg-white'}`}><div className="font-black">{title}</div><div className="mt-0.5 text-sm text-slate-500">{body}</div></button>)}</div></div>,
    <div key="level"><div className="eyebrow">3 von 3</div><h2 className="mt-2 text-3xl font-black tracking-tight">Wo möchtest du starten?</h2><p className="mt-2 text-sm leading-6 text-slate-500">A1 ist aktuell vollständig verfügbar. Höhere Ziele werden für den weiteren Ausbau gespeichert.</p><div className="mt-5 grid grid-cols-2 gap-2">{(['A1','A2','B1','B2'] as const).map(value=><button key={value} onClick={()=>setDraft({...draft,targetLevel:value})} className={`min-h-20 rounded-2xl border p-4 text-left ${draft.targetLevel===value?'border-lime-500 bg-lime-50':'border-slate-200 bg-white'}`}><div className="text-2xl font-black">{value}</div><div className="text-sm text-slate-500">{value==='A1'?'Anfänger':value==='A2'?'Grundkenntnisse':value==='B1'?'Mittelstufe':'Gute Mittelstufe'}</div></button>)}</div></div>,
  ]

  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/55 backdrop-blur-sm"><div className="flex min-h-full items-center justify-center p-3 py-[max(1rem,env(safe-area-inset-top))]"><div className="w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl sm:p-7">{steps[step]}<div className="mt-7 flex items-center justify-between gap-3"><button disabled={step===0} onClick={()=>setStep(Math.max(0,step-1))} className="btn-quiet disabled:invisible">Zurück</button>{step<2?<button onClick={()=>setStep(step+1)} className="btn-primary min-w-32">Weiter</button>:<button onClick={()=>onSave({...draft,onboardingCompleted:true})} className="btn-primary min-w-40">Lernen starten</button>}</div></div></div></div>
}
