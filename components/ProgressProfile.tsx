'use client'

import { buildCefrProgressProfile, cefrReadinessLabel } from '@/lib/progress-profile'
import { UserProgress } from '@/types'

export default function ProgressProfile({progress,totalVocabulary,totalLessons}:{progress:UserProgress;totalVocabulary:number;totalLessons:number}){
  const profile=buildCefrProgressProfile(progress,totalVocabulary,totalLessons)
  return <section className="surface p-4 sm:p-5">
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="eyebrow">A1 Profil</div><h2 className="mt-1 text-xl font-black sm:text-2xl">{cefrReadinessLabel(profile)}</h2></div><div className="shrink-0 text-right"><div className="text-3xl font-black">{profile.readiness}%</div><div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Bereitschaft</div></div></div>
    <div className="progress-track mt-4"><div className="progress-fill" style={{width:`${profile.readiness}%`}}/></div>
    <div className="mt-5 space-y-3">{profile.dimensions.map(item=><div key={item.id}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="font-bold">{item.label}</span><span className="font-black">{item.score}%</span></div><div className="progress-track"><div className="progress-fill" style={{width:`${item.score}%`}}/></div></div>)}</div>
    <details className="mt-5 rounded-2xl bg-slate-50 p-3 text-sm"><summary className="cursor-pointer font-black">Details anzeigen</summary><div className="mt-3 space-y-2 text-slate-600"><p>Dieses Profil beschreibt deinen Lernstand innerhalb des A1-Curriculums und ist keine offizielle Sprachprüfung.</p><p><b>Stärkster Bereich:</b> {profile.strongest?.label??'Noch offen'} · {profile.strongest?.score??0}%</p><p><b>Nächster Fokus:</b> {profile.focus?.label??'Noch offen'} · {profile.focus?.score??0}%</p>{!profile.evidenceSufficient&&<p>Noch zu wenig Übungsdaten für eine stabile Einschätzung. Das Profil wird mit jeder beantworteten Aufgabe genauer.</p>}</div></details>
  </section>
}
