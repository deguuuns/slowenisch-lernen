import { GRAMMAR_RULES } from '@/lib/curriculum-access'
import { Exercise, Vocabulary } from '@/types'

export type IntegrityIssue = { exerciseId: string; message: string }

export function isStrictlyAssessableExercise(exercise: Exercise) {
  return exercise.responseScope !== 'personal-open'
}

export function validateExerciseIntegrity(
  exercise: Exercise,
  vocabulary: Vocabulary[] = [],
): IntegrityIssue[] {
  const issues: IntegrityIssue[] = []
  const add = (message: string) => issues.push({ exerciseId: exercise.id, message })

  if (!exercise.id?.trim()) add('exercise id missing')
  if (!exercise.prompt?.trim()) add('prompt missing')
  if (!exercise.answer?.trim()) add('answer missing')

  if (exercise.responseScope === 'personal-open') {
    if (exercise.evaluationMode !== 'open' && exercise.evaluationMode !== 'semantic') {
      add('personal-open exercise must use open or semantic evaluation')
    }
    if (exercise.type !== 'free') add('personal-open exercise must use free response type')
  }

  if (exercise.type === 'choice') {
    const options = [exercise.answer, ...(exercise.alternatives || [])]
      .map(value => value.trim())
      .filter(Boolean)
    const normalized = options.map(value => value.toLocaleLowerCase('sl'))
    if (!exercise.alternatives?.length) add('choice alternatives missing')
    if (
      normalized.filter(value => value === exercise.answer.trim().toLocaleLowerCase('sl')).length !== 1
    ) add('correct choice must occur exactly once')
    if (new Set(normalized).size !== normalized.length) add('duplicate choice options')
  }

  if (exercise.acceptedAnswers?.some(value => !value.trim())) add('empty accepted answer')

  if (vocabulary.length) {
    const byId = new Map(vocabulary.map(word => [word.id, word]))
    for (const id of exercise.vocabularyIds || []) {
      const word = byId.get(id)
      if (!word) add(`unknown vocabulary id ${id}`)
      else if (!exercise.generated && word.lesson > exercise.lesson) {
        add(`uses future vocabulary ${id} from lesson ${word.lesson}`)
      }
    }
  }

  for (const id of exercise.grammarRuleIds || []) {
    if (!GRAMMAR_RULES[id]) add(`unknown grammar rule ${id}`)
  }

  for (const requirement of exercise.requiredVerbForms || []) {
    if (
      !requirement.verbId ||
      ![1, 2, 3].includes(requirement.person) ||
      !['singular', 'dual', 'plural'].includes(requirement.number)
    ) add('invalid required verb form')
  }

  return issues
}

export function validateExerciseSet(
  exercises: Exercise[],
  vocabulary: Vocabulary[] = [],
): IntegrityIssue[] {
  const issues = exercises.flatMap(exercise => validateExerciseIntegrity(exercise, vocabulary))
  const seen = new Set<string>()
  for (const exercise of exercises) {
    if (seen.has(exercise.id)) issues.push({ exerciseId: exercise.id, message: 'duplicate exercise id' })
    seen.add(exercise.id)
  }
  return issues
}

export type ChoiceOption = { id: string; text: string; correct: boolean }

function hash(value: string) {
  let output = 2166136261
  for (let index = 0; index < value.length; index++) {
    output ^= value.charCodeAt(index)
    output = Math.imul(output, 16777619)
  }
  return output >>> 0
}

export function stableChoiceOptions(
  exercise: Exercise,
  sessionSeed: string,
): ChoiceOption[] {
  const answer = exercise.answer.trim().toLocaleLowerCase('sl')
  const raw: ChoiceOption[] = [
    { id: `${exercise.id}:correct`, text: exercise.answer, correct: true },
    ...(exercise.alternatives || [])
      .filter(value => value.trim().toLocaleLowerCase('sl') !== answer)
      .map((text, index) => ({ id: `${exercise.id}:alt:${index}`, text, correct: false })),
  ]
  return [...raw].sort(
    (a, b) => hash(`${sessionSeed}:${a.id}`) - hash(`${sessionSeed}:${b.id}`),
  )
}
