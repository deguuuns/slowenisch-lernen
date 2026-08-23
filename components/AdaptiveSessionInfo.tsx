'use client'

import { Gauge } from 'lucide-react'
import type { SessionLoadLevel } from '@/lib/session-load'

const labels:Record<SessionLoadLevel,string>={fresh:'leicht',balanced:'ausgeglichen',elevated:'fordernd',high:'hoch'}

export default function AdaptiveSessionInfo({goalMinutes,recommendedMinutes,loadLevel,reason}:{goalMinutes:number;recommendedMinutes:number;loadLevel:SessionLoadLevel;reason:string}){
  const changed=goalMinutes!==recommendedMinutes
  return <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700"><div className="flex items-center gap-2 font-bold text-slate-900"><Gauge size={17}/>Heute geplant: ca. {recommendedMinutes} Min.</div><div className="mt-1">Belastung: {labels[loadLevel]}{changed?` · Tagesziel ${goalMinutes} Min.`:''}</div><div className="mt-1 text-slate-500">{reason}</div></div>
}
