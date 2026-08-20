import { ChoiceOption, stableChoiceOptions, validateExerciseSet } from '@/lib/exercise-integrity'
import { Exercise } from '@/types'

export type ExerciseSessionKind =
  | 'learning-block'
  | 'verb-practice'
  | 'checkpoint'
  | 'final-exam'
  | 'review'
  | 'transfer'

export type SessionExercise = {
  id: string
  sourceExerciseId: string
  exercise: Exercise
  options: ChoiceOption[]
}

export type ExerciseSession = {
  sessionId: string
  kind: ExerciseSessionKind
  exercises: readonly SessionExercise[]
  startedAt: number
}

export type ExerciseSessionResult = {
  sessionExerciseId: string
  sourceExerciseId: string
  correct: boolean
  responseMs: number
  vocabularyIds: string[]
  grammarRuleIds: string[]
}

function copyExercise(exercise: Exercise): Exercise {
  return {
    ...exercise,
    alternatives: exercise.alternatives ? [...exercise.alternatives] : undefined,
    acceptedAnswers: exercise.acceptedAnswers ? [...exercise.acceptedAnswers] : undefined,
    vocabularyIds: exercise.vocabularyIds ? [...exercise.vocabularyIds] : undefined,
    grammarRuleIds: exercise.grammarRuleIds ? [...exercise.grammarRuleIds] : undefined,
    skillTargets: exercise.skillTargets ? [...exercise.skillTargets] : undefined,
    requiredVerbForms: exercise.requiredVerbForms
      ? exercise.requiredVerbForms.map(requirement => ({ ...requirement }))
      : undefined,
  }
}

export function createExerciseSession(
  kind: ExerciseSessionKind,
  exercises: Exercise[],
  sessionId: string,
): ExerciseSession {
  const copies = exercises.map(copyExercise)
  const issues = validateExerciseSet(copies)
  if (issues.length) throw new Error(`Invalid exercise session ${sessionId}: ${JSON.stringify(issues)}`)

  const seen = new Set<string>()
  const items = copies.map((exercise, index) => {
    if (seen.has(exercise.id)) throw new Error(`Duplicate exercise id in session ${sessionId}: ${exercise.id}`)
    seen.add(exercise.id)
    return Object.freeze({
      id: `${sessionId}:${index}:${exercise.id}`,
      sourceExerciseId: exercise.id,
      exercise: Object.freeze(exercise),
      options: Object.freeze(exercise.type === 'choice' ? stableChoiceOptions(exercise, sessionId) : []) as unknown as ChoiceOption[],
    })
  })

  return Object.freeze({
    sessionId,
    kind,
    exercises: Object.freeze(items),
    startedAt: Date.now(),
  })
}

export function validateSessionResults(
  session: ExerciseSession,
  results: ExerciseSessionResult[],
): string[] {
  const validIds = new Set(session.exercises.map(item => item.id))
  const issues: string[] = []
  if (results.length > session.exercises.length) issues.push(`results ${results.length} exceed exercises ${session.exercises.length}`)

  const seen = new Set<string>()
  for (const result of results) {
    if (!validIds.has(result.sessionExerciseId)) issues.push(`foreign result ${result.sessionExerciseId}`)
    if (seen.has(result.sessionExerciseId)) issues.push(`duplicate result ${result.sessionExerciseId}`)
    seen.add(result.sessionExerciseId)
  }
  return issues
}

export function validateCompletedSession(
  session: ExerciseSession,
  results: ExerciseSessionResult[],
): string[] {
  const issues = validateSessionResults(session, results)
  if (results.length !== session.exercises.length) {
    issues.push(`completed session has ${results.length} results for ${session.exercises.length} exercises`)
  }
  return issues
}

export function sessionSummary(session: ExerciseSession, results: ExerciseSessionResult[]) {
  const issues = validateCompletedSession(session, results)
  if (issues.length) throw new Error(`Invalid completed session: ${issues.join(', ')}`)
  const correct = results.filter(result => result.correct).length
  const total = results.length
  return { total, correct, wrong: total - correct }
}
