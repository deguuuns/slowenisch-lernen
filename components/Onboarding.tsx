'use client'

import { useState } from 'react'
import { LearnerPreferences } from '@/types'

export default function Onboarding({preferences,onSave}:{preferences:LearnerPreferences;onSave:(p:LearnerPreferences)=>void}){
  const [step,setStep]=useState(0)
  const [draft,setDraft]=useState<LearnerPreferences>(preferences)
  if(preferences.onboardingCompleted)return null
  const steps=[
    <div key="goal"><div className="text-sm font-bold text-lime-700">1 von 3</div><h2 className="mt-2 text-3xl font-black">Wie viel möchtest du täglich lernen?</h2><p className="mt-2 text-slate-600">Das ist nur ein Richtwert. Die App passt die Sitzung später an deinen Lernstand an.</p><div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">{([5,10,15,20,30] as const).map(v=><button key={v} onClick={()=>setDraft({...draft,dailyGoalMinutes:v})} className={`rounded-2xl border px-3 py-4 font-black ${draft.dailyGoalMinutes===v?'border-lime-500 bg-lime-100':'border-slate-200'}`}>{v} min</button>)}</div></div>,
    <div key="pace"><div className="text-sm font-bold text-lime-700">2 von 3</div><h2 className="mt-2 text-3xl font-black">Welches Lerntempo passt zu dir?</h2><div className="mt-5 space-y-2">{([['ruhig','Ruhig','Wenig neuer Stoff, mehr Wiederholung'],['normal','Normal','Ausgewogene Mischung'],['intensiv','Intensiv','Mehr neuer Stoff pro Sitzung']] as const).map(([id,title,body])=><button key={id} onClick={()=>setDraft({...draft,pace:id})} className={`w-full rounded-2xl border p-4 text-left ${draft.pace===id?'border-lime-500 bg-lime-50':'border-slate-200'}`}><div className="font-black">{title}</div><div className="text-sm text-slate-500">{body}</div></button>)}</div></div>,
    <div key="level"><div className="text-sm font-bold text-lime-700">3 von 3</div><h2 className="mt-2 text-3xl font-black">Wo möchtest du starten?</h2><p className="mt-2 text-slate-600">Für den aktuellen Prototyp ist A1 vollständig aktiv. Höhere Ziele speichern wir schon für den späteren Ausbau.</p><div className="mt-5 grid grid-cols-2 gap-2">{(['A1','A2','B1','B2'] as const).map(v=><button key={v} onClick={()=>setDraft({...draft,targetLevel:v})} className={`rounded-2xl border p-4 text-left ${draft.targetLevel===v?'border-lime-500 bg-lime-50':'border-slate-200'}`}><div className="text-xl font-black">{v}</div><div className="text-sm text-slate-500">{v==='A1'?'Anfänger':v==='A2'?'Grundkenntnisse':v==='B1'?'Mittelstufe':'Gute Mittelstufe'}</div></button>)}</div></div>
  ]
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center"><div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">{steps[step]}<div className="mt-7 flex items-center justify-between"><button disabled={step===0} onClick={()=>setStep(Math.max(0,step-1))} className="rounded-2xl px-4 py-3 font-bold text-slate-500 disabled:opacity-0">Zurück</button>{step<2?<button onClick={()=>setStep(step+1)} className="btn-primary">Weiter</button>:<button onClick={()=>onSave({...draft,onboardingCompleted:true})} className="btn-primary">Lernen starten</button>}</div></div></div>
}
