'use client'

import { buildCefrProgressProfile, cefrReadinessLabel } from '@/lib/progress-profile'
import { UserProgress } from '@/types'

export default function ProgressProfile({progress,totalVocabulary,totalLessons}:{progress:UserProgress;totalVocabulary:number;totalLessons:number}) {
  const profile=buildCefrProgressProfile(progress,totalVocabulary,totalLessons)
  return <div className="card min-w-0">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-bold text-lime-700">CEFR-Kompetenzprofil</div>
        <h3 className="mt-1 break-words text-2xl font-black">{cefrReadinessLabel(profile)}</h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Die Anzeige beschreibt deinen Lernstand innerhalb des A1-Curriculums. Sie ist keine offizielle Sprachprüfung und steigt nur durch tatsächlich gespeicherte Lernsignale.</p>
      </div>
      <div className="rounded-2xl bg-lime-100 px-4 py-3 text-center dark:bg-lime-950/40">
        <div className="text-xs font-bold uppercase tracking-wide text-lime-800 dark:text-lime-300">A1 Bereitschaft</div>
        <div className="text-3xl font-black">{profile.readiness} %</div>
      </div>
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {profile.dimensions.map(item=><div key={item.id} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/70">
        <div className="flex items-center justify-between gap-2"><b className="text-sm">{item.label}</b><span className="text-sm font-black">{item.score} %</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full rounded-full bg-lime-400" style={{width:`${item.score}%`}}/></div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</div>
      </div>)}
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-lime-200 p-3 dark:border-lime-900"><div className="text-xs font-bold uppercase tracking-wide text-slate-400">Stärkster Bereich</div><div className="mt-1 font-black">{profile.strongest?.label ?? 'Noch offen'} · {profile.strongest?.score ?? 0} %</div></div>
      <div className="rounded-2xl border border-amber-200 p-3 dark:border-amber-900"><div className="text-xs font-bold uppercase tracking-wide text-slate-400">Nächster Fokus</div><div className="mt-1 font-black">{profile.focus?.label ?? 'Noch offen'} · {profile.focus?.score ?? 0} %</div></div>
    </div>

    {!profile.evidenceSufficient&&<p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">Noch zu wenig belastbare Übungsdaten für eine stabile Einschätzung. Das Profil wird mit jeder beantworteten Aufgabe genauer.</p>}
  </div>
}
