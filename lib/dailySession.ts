import type { Exercise, UserProgress } from '@/types'
import { selectReviewQueue } from './spacedRepetition'

export type DailySessionStep = {
  id: string
  kind: 'review' | 'lesson' | 'grammar' | 'listening' | 'speaking' | 'recap'
  title: string
  minutes: number
  exerciseIds?: string[]
}

export function buildDailySession(progress: UserProgress, exercises: Exercise[], activeLesson: number): DailySessionStep[] {
  const mistakeCounts = Object.fromEntries(progress.mistakes.map(mistake => [mistake.key, mistake.count]))
  const reviewIds = selectReviewQueue(progress.reviews, mistakeCounts, 5)
  const lessonExercises = exercises.filter(exercise => exercise.lesson === activeLesson)
  const grammarExercise = lessonExercises.find(exercise => exercise.grammarTag) ?? lessonExercises.find(exercise => exercise.type === 'ending' || exercise.type === 'fill')
  const practiceExercises = lessonExercises.filter(exercise => exercise.id !== grammarExercise?.id).slice(0, 3)

  return [
    {
      id: 'today-review', kind: 'review', title: reviewIds.length ? 'Fällige Wiederholung' : 'Kurzes Warm-up', minutes: 3,
      exerciseIds: reviewIds.length ? reviewIds : exercises.slice(0, 3).map(exercise => exercise.id),
    },
    {
      id: 'today-lesson', kind: 'lesson', title: `Neue Einheit · Lektion ${activeLesson}`, minutes: 5,
      exerciseIds: practiceExercises.map(exercise => exercise.id),
    },
    {
      id: 'today-grammar', kind: 'grammar', title: 'Grammatik aktiv', minutes: 3,
      exerciseIds: grammarExercise ? [grammarExercise.id] : practiceExercises.slice(0, 1).map(exercise => exercise.id),
    },
    { id: 'today-listening', kind: 'listening', title: 'Hörverstehen', minutes: 3 },
    { id: 'today-speaking', kind: 'speaking', title: 'Sprechen', minutes: 3 },
    { id: 'today-recap', kind: 'recap', title: 'Abschlussreview', minutes: 2, exerciseIds: reviewIds.slice(0, 2) },
  ]
}

export function dailySessionMinutes(steps: DailySessionStep[]) {
  return steps.reduce((sum, step) => sum + step.minutes, 0)
}
