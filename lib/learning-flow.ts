import { enrichExercises } from '@/lib/curriculum-metadata'
import { LEARNING_FLOW_CONFIG } from '@/lib/learning-config'
import { Exercise, Vocabulary } from '@/types'

export const NEW_WORDS_PER_BLOCK = LEARNING_FLOW_CONFIG.newWordsPerBlock
export const EXERCISES_PER_BLOCK = LEARNING_FLOW_CONFIG.exercisesPerBlock
export const MIN_RECALL_GAP_TASKS = LEARNING_FLOW_CONFIG.minRecallGapTasks

export type LearningBlock = {
  id: string
  words: Vocabulary[]
  exercises: Exercise[]
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items))
}

function distractors(word: Vocabulary, lessonWords: Vocabulary[]) {
  return lessonWords
    .filter(item => item.id !== word.id && item.partOfSpeech === word.partOfSpeech)
    .concat(lessonWords.filter(item => item.id !== word.id))
    .map(item => item.de)
    .filter(value => value !== word.de)
    .filter((value, index, all) => all.indexOf(value) === index)
    .slice(0, 3)
}

/** Deterministic, structured vocabulary recall generated only from verified vocabulary data. */
export function generatedExercisesForWord(
  word: Vocabulary,
  lessonWords: Vocabulary[],
): Exercise[] {
  const choices = distractors(word, lessonWords)
  return [
    {
      id: `gen-produce-${word.id}`,
      lesson: word.lesson,
      type: 'translate-de-sl',
      prompt: `Übersetze: ${word.de}`,
      answer: word.sl,
      vocabularyIds: [word.id],
      grammarRuleIds: [],
      evaluationMode: 'acceptedVariants',
      skillTargets: ['production'],
      difficulty: 'easy',
      generated: true,
    },
    {
      id: `gen-recognize-${word.id}`,
      lesson: word.lesson,
      type: 'choice',
      prompt: `Was bedeutet „${word.sl}“?`,
      answer: word.de,
      alternatives: choices,
      vocabularyIds: [word.id],
      grammarRuleIds: [],
      evaluationMode: 'exact',
      skillTargets: ['recognition'],
      difficulty: 'easy',
      generated: true,
    },
  ]
}

function usesOnly(exercise: Exercise, ids: Set<string>) {
  const vocabularyIds = exercise.vocabularyIds || []
  return vocabularyIds.length > 0 && vocabularyIds.every(id => ids.has(id))
}

function containsAny(exercise: Exercise, ids: Set<string>) {
  return (exercise.vocabularyIds || []).some(id => ids.has(id))
}

function orderBlockExercises(
  currentWords: Vocabulary[],
  priorAvailable: Set<string>,
  curated: Exercise[],
  lessonWords: Vocabulary[],
  limit: number,
) {
  const currentIds = new Set(currentWords.map(word => word.id))
  const allAvailable = new Set(
    Array.from(priorAvailable).concat(Array.from(currentIds)),
  )

  const knownWarmups = curated
    .filter(exercise => usesOnly(exercise, priorAvailable) && !containsAny(exercise, currentIds))
    .slice(0, 2)
  const contextual = curated.filter(
    exercise => usesOnly(exercise, allAvailable) && containsAny(exercise, currentIds),
  )
  const productive = currentWords.map(word => generatedExercisesForWord(word, lessonWords)[0])
  const recognition = currentWords.map(word => generatedExercisesForWord(word, lessonWords)[1])
  const earlierWords = lessonWords.filter(word => priorAvailable.has(word.id))
  const delayedRecognition = earlierWords
    .slice(-2)
    .map(word => generatedExercisesForWord(word, lessonWords)[1])

  const pool = [...knownWarmups, ...delayedRecognition, ...contextual, ...productive, ...recognition]
  const deduped = unique(pool.map(exercise => exercise.id)).map(
    id => pool.find(exercise => exercise.id === id)!,
  )

  const rank = (exercise: Exercise) => {
    if (knownWarmups.some(item => item.id === exercise.id)) return 0
    if (delayedRecognition.some(item => item.id === exercise.id)) return 1
    if (contextual.some(item => item.id === exercise.id)) return 2
    if (exercise.id.startsWith('gen-produce-')) return 3
    return 4
  }

  return deduped.sort((a, b) => rank(a) - rank(b)).slice(0, limit)
}

export function buildLearningBlocks(
  lessonId: number,
  vocabulary: Vocabulary[],
  rawExercises: Exercise[],
  introducedWordIds: string[],
  size: number = NEW_WORDS_PER_BLOCK,
): LearningBlock[] {
  const lessonWords = vocabulary.filter(word => word.lesson === lessonId)
  const unseen = lessonWords.filter(word => !introducedWordIds.includes(word.id))
  const curated = enrichExercises(rawExercises).filter(exercise => exercise.lesson === lessonId)
  const blocks: LearningBlock[] = []
  const available = new Set(introducedWordIds)

  for (let start = 0; start < unseen.length; start += size) {
    const words = unseen.slice(start, start + size)
    const priorAvailable = new Set(available)
    words.forEach(word => available.add(word.id))

    const selected = orderBlockExercises(
      words,
      priorAvailable,
      curated,
      lessonWords,
      Math.max(EXERCISES_PER_BLOCK, words.length * 2),
    )

    blocks.push({
      id: `lesson-${lessonId}-block-${blocks.length + 1}`,
      words,
      exercises: selected,
    })
  }

  return blocks
}

export function lessonProgress(
  blockIndex: number,
  totalBlocks: number,
  exerciseIndex = 0,
  exerciseCount = 1,
) {
  if (totalBlocks <= 0) return 100
  const within = Math.min(1, exerciseIndex / Math.max(1, exerciseCount))
  return Math.min(100, Math.round(((blockIndex + within) / totalBlocks) * 100))
}
