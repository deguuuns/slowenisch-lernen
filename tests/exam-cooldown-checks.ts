import assert from 'node:assert/strict'
import { buildExamPlan } from '../lib/exam-planner'
import { historyItemFromExercises } from '../lib/exam-history'
import { defaultProgress, resetLearningProgress } from '../lib/storage'
import type { Exercise, UserProgress, Vocabulary } from '../types'

function fresh(overrides: Partial<UserProgress> = {}): UserProgress {
  return { ...structuredClone(defaultProgress), preferences: { ...defaultProgress.preferences }, ...overrides }
}

const vocabulary: Vocabulary[] = Array.from({ length: 8 }, (_, index) => ({
  id: `v${index}`,
  sl: `beseda${index}`,
  de: `Wort${index}`,
  partOfSpeech: 'Substantiv',
  category: index < 2 ? 'Begrüßung' : 'Test',
  example: `Beseda ${index}.`,
  exampleDe: `Wort ${index}.`,
  lesson: 77,
}))

const exercises: Exercise[] = Array.from({ length: 12 }, (_, index) => ({
  id: index === 0 ? 'e01' : index === 1 ? 'origin-question' : `exam-${index}`,
  lesson: 77,
  type: index % 3 === 0 ? 'choice' : 'translate-de-sl',
  prompt: index === 0 ? 'Hallo! Wie geht es dir?' : index === 1 ? 'Woher kommst du?' : `Prüfungsfrage ${index}`,
  answer: `odgovor ${index}`,
  alternatives: index % 3 === 0 ? ['x', 'y'] : undefined,
  vocabularyIds: [`v${index % vocabulary.length}`],
  grammarRuleIds: [],
  skillTargets: [index % 3 === 0 ? 'recognition' : 'production'],
}))

const base = fresh({
  introducedWords: vocabulary.map(word => word.id),
  preferences: { ...defaultProgress.preferences, onboardingCompleted: true },
})

const exam1 = buildExamPlan({ kind: 'checkpoint', lessonId: 77, exercises, vocabulary, progress: base, seed: 17, targetSize: 6 })
assert.equal(exam1.length, 6)
const history1 = historyItemFromExercises('exam-1', 'checkpoint', 77, exam1)
const withHistory1 = fresh({ ...base, examHistory: [history1] })
const exam2 = buildExamPlan({ kind: 'checkpoint', lessonId: 77, exercises, vocabulary, progress: withHistory1, seed: 17, targetSize: 6 })
assert.equal(exam2.length, 6)
for (const id of history1.firstExerciseIds) assert.ok(!exam2.slice(0, 2).some(exercise => exercise.id === id), `opening repeated immediately: ${id}`)

const history2 = historyItemFromExercises('exam-2', 'checkpoint', 77, exam2)
const withHistory2 = fresh({ ...base, examHistory: [history1, history2] })
const exam3 = buildExamPlan({ kind: 'checkpoint', lessonId: 77, exercises, vocabulary, progress: withHistory2, seed: 17, targetSize: 6 })
assert.equal(exam3.length, 6)
for (const id of [...history1.firstExerciseIds, ...history2.firstExerciseIds]) {
  if (exercises.filter(exercise => ![...history1.firstExerciseIds, ...history2.firstExerciseIds].includes(exercise.id)).length >= 2) {
    assert.ok(!exam3.slice(0, 2).some(exercise => exercise.id === id), `opening cooldown failed: ${id}`)
  }
}

const reset = resetLearningProgress(fresh({ examHistory: [history1, history2] }))
assert.equal(reset.examHistory?.length || 0, 0)

console.log('Exam cooldown checks passed')
