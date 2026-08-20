import { enrichExercises } from '@/lib/curriculum-metadata'
import { LEARNING_FLOW_CONFIG } from '@/lib/learning-config'
import { dedupeExercisesByTarget, withTargetMetadata } from '@/lib/learning-targets'
import { Exercise, TargetContentKey, Vocabulary } from '@/types'

export const NEW_WORDS_PER_BLOCK = LEARNING_FLOW_CONFIG.newWordsPerBlock
export const EXERCISES_PER_BLOCK = LEARNING_FLOW_CONFIG.exercisesPerBlock
export const MIN_RECALL_GAP_TASKS = LEARNING_FLOW_CONFIG.minRecallGapTasks

export type LearningBlock = {
  id: string
  words: Vocabulary[]
  exercises: Exercise[]
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

export function generatedExercisesForWord(word: Vocabulary, lessonWords: Vocabulary[]): Exercise[] {
  const target = [`vocab:${word.id}` as TargetContentKey]
  const generated: Exercise[] = [{
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
    targetContentKeys: target,
  }]

  const choices = distractors(word, lessonWords)
  if (choices.length >= 2) {
    generated.push({
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
      targetContentKeys: target,
    })
  }
  return generated
}

function generatedProduction(word: Vocabulary, lessonWords: Vocabulary[]) {
  return generatedExercisesForWord(word, lessonWords).find(exercise => exercise.type === 'translate-de-sl')
}

function usesOnly(exercise: Exercise, ids: Set<string>) {
  const vocabularyIds = exercise.vocabularyIds || []
  return vocabularyIds.length > 0 && vocabularyIds.every(id => ids.has(id))
}

function containsAny(exercise: Exercise, ids: Set<string>) {
  return (exercise.vocabularyIds || []).some(id => ids.has(id))
}

function orderBlockExercises(currentWords: Vocabulary[], priorAvailable: Set<string>, curated: Exercise[], lessonWords: Vocabulary[], limit: number) {
  const currentIds = new Set(currentWords.map(word => word.id))
  const allAvailable = new Set([...Array.from(priorAvailable), ...Array.from(currentIds)])

  const contextual = curated
    .filter(exercise => usesOnly(exercise, allAvailable) && containsAny(exercise, currentIds))
    .map(withTargetMetadata)

  const productive = currentWords
    .map(word => generatedProduction(word, lessonWords))
    .filter((exercise): exercise is Exercise => Boolean(exercise))

  const knownWarmup = curated
    .filter(exercise => usesOnly(exercise, priorAvailable) && !containsAny(exercise, currentIds))
    .slice(-1)
    .map(withTargetMetadata)

  // One primary targeted question per content key. Variation happens in later sessions,
  // not several times in the same block.
  return dedupeExercisesByTarget([...contextual, ...productive, ...knownWarmup], limit)
}

export function buildLearningBlocks(lessonId: number, vocabulary: Vocabulary[], rawExercises: Exercise[], introducedWordIds: string[], size: number = NEW_WORDS_PER_BLOCK): LearningBlock[] {
  const lessonWords = vocabulary.filter(word => word.lesson === lessonId)
  const unseen = lessonWords.filter(word => !introducedWordIds.includes(word.id))
  const curated = enrichExercises(rawExercises).filter(exercise => exercise.lesson === lessonId)
  const blocks: LearningBlock[] = []
  const available = new Set(introducedWordIds)

  for (let start = 0; start < unseen.length; start += size) {
    const words = unseen.slice(start, start + size)
    const priorAvailable = new Set(available)
    words.forEach(word => available.add(word.id))

    blocks.push({
      id: `lesson-${lessonId}-block-${blocks.length + 1}`,
      words,
      exercises: orderBlockExercises(words, priorAvailable, curated, lessonWords, Math.max(words.length, EXERCISES_PER_BLOCK)),
    })
  }

  return blocks
}

export function lessonProgress(blockIndex: number, totalBlocks: number, exerciseIndex = 0, exerciseCount = 1) {
  if (totalBlocks <= 0) return 100
  const within = Math.min(1, exerciseIndex / Math.max(1, exerciseCount))
  return Math.min(100, Math.round(((blockIndex + within) / totalBlocks) * 100))
}
