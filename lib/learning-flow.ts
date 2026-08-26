import { isVerbFormVocabularyId } from '@/lib/curriculum-access'
import { enrichExercises } from '@/lib/curriculum-metadata'
import { isStrictlyAssessableExercise } from '@/lib/exercise-integrity'
import { LEARNING_FLOW_CONFIG } from '@/lib/learning-config'
import { MICRO_LEARNING_CYCLE, phaseForExercise } from '@/lib/learning-cycle'
import { inferTargetContentKeys, withTargetMetadata } from '@/lib/learning-targets'
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

export function isConjugatedVerbVocabulary(word: Vocabulary) {
  return word.partOfSpeech === 'Verb' && isVerbFormVocabularyId(word.id)
}

export function generatedExercisesForWord(word: Vocabulary, lessonWords: Vocabulary[]): Exercise[] {
  if (isConjugatedVerbVocabulary(word)) return []

  const target = [`vocab:${word.id}` as TargetContentKey]
  const generated: Exercise[] = []
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
      responseScope: 'fixed',
      targetContentKeys: target,
      learningPhase: 'recognize',
    })
  }

  generated.push({
    id: `gen-produce-${word.id}`,
    lesson: word.lesson,
    type: 'translate-de-sl',
    prompt: `Auf Slowenisch: ${word.de}`,
    answer: word.sl,
    vocabularyIds: [word.id],
    grammarRuleIds: [],
    evaluationMode: 'acceptedVariants',
    skillTargets: ['production'],
    difficulty: 'easy',
    generated: true,
    responseScope: 'fixed',
    targetContentKeys: target,
    learningPhase: 'active-production',
  })

  return generated
}

function usesOnly(exercise: Exercise, ids: Set<string>) {
  const vocabularyIds = exercise.vocabularyIds || []
  return vocabularyIds.length > 0 && vocabularyIds.every(id => ids.has(id))
}

function containsAny(exercise: Exercise, ids: Set<string>) {
  return (exercise.vocabularyIds || []).some(id => ids.has(id))
}

function phaseIndex(exercise: Exercise) {
  const phase = phaseForExercise(exercise)
  const index = MICRO_LEARNING_CYCLE.indexOf(phase)
  return index < 0 ? MICRO_LEARNING_CYCLE.length : index
}

export function orderExercisesByLearningCycle(exercises: Exercise[]) {
  return [...exercises].sort((a, b) => {
    const phaseDifference = phaseIndex(a) - phaseIndex(b)
    if (phaseDifference) return phaseDifference
    const difficulty = { intro:0, easy:1, normal:2, challenge:3 }
    return (difficulty[a.difficulty || 'normal'] ?? 2) - (difficulty[b.difficulty || 'normal'] ?? 2)
  })
}

function dedupeByTargetAndPhase(exercises:Exercise[],limit:number){
  const used=new Set<string>()
  const selected:Exercise[]=[]
  for(const exercise of exercises){
    const targets=inferTargetContentKeys(exercise)
    const phase=phaseForExercise(exercise)
    const signature=targets.length?`${targets.slice().sort().join('|')}::${phase}`:`${exercise.id}::${phase}`
    if(used.has(signature))continue
    selected.push(withTargetMetadata(exercise));used.add(signature)
    if(selected.length>=limit)break
  }
  return selected
}

function orderBlockExercises(currentWords: Vocabulary[], priorAvailable: Set<string>, curated: Exercise[], lessonWords: Vocabulary[], limit: number) {
  const currentIds = new Set(currentWords.map(word => word.id))
  const allAvailable = new Set([...Array.from(priorAvailable), ...Array.from(currentIds)])

  const contextual = curated
    .filter(isStrictlyAssessableExercise)
    .filter(exercise => usesOnly(exercise, allAvailable) && containsAny(exercise, currentIds))
    .map(withTargetMetadata)

  const generated = currentWords.flatMap(word => generatedExercisesForWord(word, lessonWords))

  const knownWarmup = curated
    .filter(isStrictlyAssessableExercise)
    .filter(exercise => usesOnly(exercise, priorAvailable) && !containsAny(exercise, currentIds))
    .slice(-1)
    .map(withTargetMetadata)
    .map(exercise => ({ ...exercise, learningPhase:exercise.learningPhase || 'variation' as const }))

  // The introduction screen is the 'understand' phase. The same target may then occur
  // once per meaningful phase; only duplicate target+phase combinations are removed.
  const ordered = orderExercisesByLearningCycle([...generated, ...contextual, ...knownWarmup])
  return dedupeByTargetAndPhase(ordered, limit)
}

export function buildLearningBlocks(lessonId: number, vocabulary: Vocabulary[], rawExercises: Exercise[], introducedWordIds: string[], size: number = NEW_WORDS_PER_BLOCK): LearningBlock[] {
  const lessonWords = vocabulary
    .filter(word => word.lesson === lessonId)
    .sort((a,b)=>(a.priority || 5) - (b.priority || 5) || a.id.localeCompare(b.id))
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
      exercises: orderBlockExercises(words, priorAvailable, curated, lessonWords, Math.max(words.length * 2, EXERCISES_PER_BLOCK)),
    })
  }

  return blocks
}

export function lessonProgress(blockIndex: number, totalBlocks: number, exerciseIndex = 0, exerciseCount = 1) {
  if (totalBlocks <= 0) return 100
  const within = Math.min(1, exerciseIndex / Math.max(1, exerciseCount))
  return Math.min(100, Math.round(((blockIndex + within) / totalBlocks) * 100))
}
