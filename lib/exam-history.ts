import { EXAM_REPEAT_CONFIG } from '@/lib/learning-config'
import { inferTargetContentKeys } from '@/lib/learning-targets'
import { ExamHistoryItem, Exercise } from '@/types'

type ExerciseLike = Exercise | { exercise: Exercise }

function unwrap(item: ExerciseLike): Exercise {
  return 'exercise' in item ? item.exercise : item
}

export function promptSignature(prompt: string) {
  return prompt
    .toLocaleLowerCase('sl')
    .replace(/^übersetze:\s*/i, '')
    .replace(/^wie sagt man:\s*/i, '')
    .replace(/[^a-z0-9čšžćđäöüß ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function appendExamHistory(history: ExamHistoryItem[] | undefined, item: ExamHistoryItem) {
  const deduped = [...(history || []).filter(entry => entry.sessionId !== item.sessionId), item].sort((a, b) => a.completedAt - b.completedAt)
  return deduped.slice(-EXAM_REPEAT_CONFIG.historyLimit)
}

export function mergeExamHistory(a: ExamHistoryItem[] | undefined, b: ExamHistoryItem[] | undefined) {
  const map = new Map<string, ExamHistoryItem>()
  for (const item of [...(a || []), ...(b || [])]) {
    const existing = map.get(item.sessionId)
    if (!existing || item.completedAt > existing.completedAt) map.set(item.sessionId, item)
  }
  return Array.from(map.values()).sort((x, y) => x.completedAt - y.completedAt).slice(-EXAM_REPEAT_CONFIG.historyLimit)
}

export function historyItemFromExercises(sessionId: string, kind: 'checkpoint' | 'final' | 'major', lessonId: number, items: readonly ExerciseLike[]): ExamHistoryItem {
  const exercises = items.map(unwrap)
  return {
    sessionId,
    kind,
    lessonId,
    exerciseIds: exercises.map(exercise => exercise.id),
    firstExerciseIds: exercises.slice(0, 2).map(exercise => exercise.id),
    promptSignatures: exercises.map(exercise => promptSignature(exercise.prompt)),
    vocabularyIds: Array.from(new Set(exercises.flatMap(exercise => exercise.vocabularyIds || []))),
    grammarRuleIds: Array.from(new Set(exercises.flatMap(exercise => exercise.grammarRuleIds || []))),
    targetContentKeys: Array.from(new Set(exercises.flatMap(exercise => inferTargetContentKeys(exercise)))),
    completedAt: Date.now(),
  }
}
