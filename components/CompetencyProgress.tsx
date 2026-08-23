'use client'

import { buildCefrProgress, percent } from '@/lib/competency-progress'
import { UserProgress } from '@/types'

export default function CompetencyProgress({progress}:{progress:UserProgress}){
 const report=buildCefrProgress(progress)
 return <div className="card min-w-0">
  <div className="flex flex-wrap items-end justify-between gap-3">
   <div><div className="text-sm font-bold text-lime-700">GER / CEFR</div><h3 className="text-2xl font-black">A1-Kompetenzprofil</h3></div>
   <div className="text-right"><div className="text-3xl font-black">{percent(report.overall)} %</div><div className="text-xs text-slate-500">A1-Gesamtstand</div></div>
  </div>
  <div className="mt-5 grid gap-3 sm:grid-cols-2">
   {report.competencies.map(item=><div key={item.domain} className="rounded-2xl bg-slate-50 p-3">
    <div className="flex items-center justify-between gap-2"><b>{item.label}</b><span className="text-sm font-bold">{percent(item.score)} %</span></div>
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-lime-400" style={{width:`${percent(item.score)}%`}}/></div>
    <div className="mt-2 text-xs text-slate-500">{item.status==='zu-wenig-daten'?'noch zu wenig Daten':item.status==='aufbau'?'im Aufbau':item.status==='stabil'?'stabil':'sicher'} · {item.evidence} Signale</div>
   </div>)}
  </div>
  <div className="mt-4 rounded-2xl bg-lime-50 p-4"><b>Nächster Schwerpunkt</b><p className="mt-1 text-sm text-slate-700">{report.recommendation}</p></div>
  <div className="mt-3 text-xs text-slate-500">Curriculum-Abdeckung: {percent(report.skillCoverage)} %. Die Anzeige nutzt vorhandene Mastery-, Review- und Lernsignale und speichert keine parallelen Fortschrittsdaten.</div>
 </div>
}
