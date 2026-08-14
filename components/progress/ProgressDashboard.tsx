import { Brain, Clock3, Headphones, Mic2, RotateCcw, Trophy } from 'lucide-react'
import { exercises } from '@/data/learningContent'
import type { LearningSkill, UserProgress } from '@/types'

const skills: { id: LearningSkill; label: string }[] = [
  { id: 'lesen', label: 'Lesen' }, { id: 'hören', label: 'Hören' }, { id: 'schreiben', label: 'Schreiben' },
  { id: 'sprechen', label: 'Sprechen' }, { id: 'grammatik', label: 'Grammatik' }, { id: 'wortschatz', label: 'Wortschatz' },
]

function Metric({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return <div className="card"><Icon className="mb-3" size={20}/><div className="text-2xl font-black">{value}</div><div className="text-sm text-slate-500">{label}</div></div>
}

export default function ProgressDashboard({ progress }: { progress: UserProgress }) {
  const today = new Date().toISOString().slice(0, 10)
  const todayActivity = progress.dailyActivity?.find(item => item.date === today)
  const due = progress.reviews.filter(item => item.dueAt <= Date.now()).length
  const top = [...progress.mistakes].sort((a,b) => b.count - a.count).slice(0, 5)

  return <div className="space-y-5">
    <div className="card"><h2 className="text-3xl font-black">Fortschritt</h2><p className="mt-2 text-slate-600">Messwerte aus deinen tatsächlich bearbeiteten Inhalten – keine künstliche Gesamt-Prozentzahl.</p></div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Metric icon={Clock3} value={`${(todayActivity?.minutes ?? 0).toFixed(1)} min`} label="heute gelernt"/>
      <Metric icon={Brain} value={`${progress.wordsLearned.length}`} label="gelernte Wörter"/>
      <Metric icon={Trophy} value={`${progress.secureWords.length}`} label="sichere Wörter"/>
      <Metric icon={RotateCcw} value={`${due}`} label="fällige Wiederholungen"/>
      <Metric icon={Mic2} value={`${progress.speakingMinutes.toFixed(1)} min`} label="Sprechzeit"/>
      <Metric icon={Headphones} value={`${progress.listeningMinutes.toFixed(1)} min`} label="Hörzeit"/>
    </div>

    <div className="card">
      <h3 className="text-xl font-black">Kompetenzen</h3>
      <p className="mt-1 text-sm text-slate-500">XP zeigt Aktivität pro Bereich, nicht automatisch Sprachbeherrschung.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{skills.map(skill => {
        const xp = progress.skillXp?.[skill.id] ?? 0
        return <div key={skill.id} className="rounded-2xl bg-slate-50 p-3"><div className="flex justify-between gap-2"><span className="font-semibold">{skill.label}</span><span className="text-sm text-slate-500">{xp} XP</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-lime-400" style={{ width: `${Math.min(100, xp)}%` }}/></div></div>
      })}</div>
    </div>

    <div className="card">
      <h3 className="text-xl font-black">Häufigste Fehler</h3>
      {top.length ? <div className="mt-4 space-y-2">{top.map(mistake => {
        const exercise = exercises.find(item => item.id === mistake.key)
        return <div key={mistake.key} className="rounded-2xl bg-amber-50 p-3"><div className="flex justify-between gap-3"><span>{exercise?.prompt ?? mistake.key}</span><b>{mistake.count}×</b></div>{mistake.category && mistake.category !== 'unknown' && <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-700">{mistake.category}</div>}</div>
      })}</div> : <p className="mt-3 text-slate-500">Noch keine Fehler gespeichert.</p>}
    </div>
  </div>
}
