import { beginnerCurriculum, getCurrentBeginnerPhase, isBeginnerFoundationComplete } from '@/data/beginnerCurriculum'
import type { UserProgress } from '@/types'

export type LearningContinuation =
  | { type: 'continue-current-phase'; phase: number; title: string; message: string }
  | { type: 'advance-curriculum'; fromPhase: number; toPhase: number; title: string; message: string }
  | { type: 'review-due'; phase: number | null; title: string; message: string }
  | { type: 'next-course-stage'; phase: null; title: string; message: string }

export function resolveLearningContinuation(progress: UserProgress, completedPhase: number | null, now = Date.now()): LearningContinuation {
  if (isBeginnerFoundationComplete(progress)) {
    return {
      type: 'next-course-stage',
      phase: null,
      title: 'A1-Aufbau',
      message: 'Die Beginner-Grundlage ist abgeschlossen. Als Nächstes baust du Wortschatz, Verben und Alltagssprache weiter aus.',
    }
  }

  const current = getCurrentBeginnerPhase(progress)
  if (!current) {
    return { type: 'next-course-stage', phase: null, title: 'A1-Aufbau', message: 'Weiter mit dem A1-Aufbau.' }
  }

  const due = Object.values(progress.learningItems ?? {}).some(item => item.nextDueAt !== undefined && item.nextDueAt <= now)
  if (due && completedPhase === null) {
    return { type: 'review-due', phase: current.id, title: current.title, message: 'Kurze fällige Wiederholung, danach geht es im Curriculum weiter.' }
  }

  if (completedPhase !== null && current.id > completedPhase) {
    return {
      type: 'advance-curriculum',
      fromPhase: completedPhase,
      toPhase: current.id,
      title: current.title,
      message: `Sehr gut. Als Nächstes: ${current.title}.`,
    }
  }

  return {
    type: 'continue-current-phase',
    phase: current.id,
    title: current.title,
    message: `Wir bleiben kurz bei „${current.title}“, aber mit einer anderen Übungsform statt derselben Aufgabe.`,
  }
}

export function phaseTitle(phase: number | null) {
  if (phase === null) return 'A1-Aufbau'
  return beginnerCurriculum.find(item => item.id === phase)?.title ?? 'Nächstes Lernziel'
}
