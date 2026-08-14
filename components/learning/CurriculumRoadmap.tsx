import { CheckCircle2, Lock, Map } from 'lucide-react'
import { curriculum } from '@/data/curriculum'
import type { UserProgress } from '@/types'

export default function CurriculumRoadmap({ progress, onOpenLesson }: { progress: UserProgress; onOpenLesson: (lessonId: number) => void }) {
  return <div className="space-y-4">
    <div className="card">
      <div className="flex items-center gap-2"><Map size={20}/><h2 className="text-3xl font-black">Lernpfad</h2></div>
      <p className="mt-2 text-slate-600">A1 zuerst sicher beherrschen, dann A2 ausbauen. B1 ist als nächster Ausbaupfad vorbereitet.</p>
    </div>

    {(['A1','A2','B1'] as const).map(level => <section key={level} className="space-y-3">
      <div className="flex items-center gap-3"><span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">{level}</span><div className="h-px flex-1 bg-slate-200"/></div>
      {curriculum.filter(unit => unit.level === level).map(unit => {
        const lessonId = unit.lessonIds[0]
        const complete = unit.lessonIds.length > 0 && unit.lessonIds.every(id => progress.completedLessons.includes(id))
        return <article key={unit.id} className={`card ${unit.status === 'planned' ? 'opacity-70' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><h3 className="text-lg font-black">{unit.title}</h3>{complete && <CheckCircle2 size={18} className="text-lime-700"/>}</div>
              <p className="mt-1 text-sm text-slate-600">{unit.goal}</p>
            </div>
            {unit.status === 'planned' && <Lock size={18} className="shrink-0 text-slate-400"/>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">{unit.skills.map(skill => <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{skill}</span>)}</div>
          {unit.status === 'available' && lessonId && <button onClick={() => onOpenLesson(lessonId)} className="btn-secondary mt-4">Lektion öffnen</button>}
          {unit.status === 'planned' && <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Inhalt wird schrittweise ergänzt</p>}
        </article>
      })}
    </section>)}
  </div>
}
