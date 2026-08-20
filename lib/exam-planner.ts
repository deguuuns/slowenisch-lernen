import { isExerciseEligible } from '@/lib/curriculum-access'
import { enrichExercises } from '@/lib/curriculum-metadata'
import { EXAM_CONFIG } from '@/lib/learning-config'
import { generatedExercisesForWord } from '@/lib/learning-flow'
import { Exercise, UserProgress, Vocabulary } from '@/types'

export { EXAM_CONFIG } from '@/lib/learning-config'
export type ExamKind = 'checkpoint' | 'final'

type PlanOptions = {
  kind: ExamKind
  lessonId: number
  exercises: Exercise[]
  vocabulary: Vocabulary[]
  progress: UserProgress
  seed?: number
  targetSize?: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function examSize(
  kind: ExamKind,
  progress: UserProgress,
  newContentCount = 0,
  errorCount = 0,
) {
  const config = EXAM_CONFIG[kind]
  if (kind === 'final') {
    const paceBonus = progress.preferences.pace === 'intensiv' ? 2 : progress.preferences.pace === 'ruhig' ? -1 : 0
    const goalBonus = progress.preferences.dailyGoalMinutes >= 20 ? 1 : 0
    return clamp(config.default + paceBonus + goalBonus, config.min, config.max)
  }
  const paceBonus = progress.preferences.pace === 'intensiv' ? 1 : progress.preferences.pace === 'ruhig' ? -1 : 0
  const contentBonus = newContentCount >= 3 ? 1 : 0
  const errorBonus = errorCount >= 2 ? 1 : 0
  return clamp(config.default + paceBonus + contentBonus + errorBonus, config.min, config.max)
}

function hash(text: string) {
  let value = 2166136261
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

function rotate<T>(items: T[], offset: number) {
  if (!items.length) return items
  const normalized = ((offset % items.length) + items.length) % items.length
  return [...items.slice(normalized), ...items.slice(0, normalized)]
}

function promptSignature(exercise: Exercise) {
  return exercise.prompt
    .toLocaleLowerCase('sl')
    .replace(/[^a-z0-9čšžćđäöüß ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function typeGroup(exercise: Exercise) {
  if (exercise.type === 'choice') return 'recognition'
  if (exercise.skillTargets?.includes('listening')) return 'listening'
  if (exercise.skillTargets?.includes('production')) return 'production'
  return exercise.type
}

function candidatePool(options: PlanOptions) {
  const curated = enrichExercises(options.exercises).filter(
    exercise => exercise.lesson === options.lessonId,
  )
  if (options.kind === 'checkpoint') {
    return curated.filter(exercise => isExerciseEligible(exercise, options.progress))
  }

  const lessonWords = options.vocabulary.filter(
    word => word.lesson === options.lessonId && options.progress.introducedWords.includes(word.id),
  )
  const generated = lessonWords.flatMap(word => generatedExercisesForWord(word, lessonWords))
  return [...curated, ...generated].filter(exercise =>
    isExerciseEligible(exercise, options.progress),
  )
}

export function buildExamPlan(options: PlanOptions): Exercise[] {
  const config = EXAM_CONFIG[options.kind]
  const requested = clamp(
    options.targetSize ?? examSize(options.kind, options.progress),
    config.min,
    config.max,
  )
  const pool = candidatePool(options)
  if (!pool.length) return []

  const recent = (options.progress.recentAttempts || []).slice(-10)
  const recentIds = new Set(recent.map(attempt => attempt.exerciseId))
  const recentExercises = pool.filter(exercise => recentIds.has(exercise.id))
  const recentVocab = new Set(recentExercises.flatMap(exercise => exercise.vocabularyIds || []))
  const recentGrammar = new Set(recentExercises.flatMap(exercise => exercise.grammarRuleIds || []))
  const seed = options.seed ?? Date.now()

  const scored = pool
    .map(exercise => {
      let score = 0
      if (!recentIds.has(exercise.id)) score += 30
      if (!(exercise.vocabularyIds || []).some(id => recentVocab.has(id))) score += 8
      if (!(exercise.grammarRuleIds || []).some(id => recentGrammar.has(id))) score += 8
      if (exercise.skillTargets?.includes('production')) score += 6
      if (exercise.type === 'choice') score += 2
      const weakScores = [
        ...(exercise.vocabularyIds || []).map(id => options.progress.mastery?.[`vocab:${id}`]?.score),
        ...(exercise.grammarRuleIds || []).map(id => options.progress.mastery?.[`grammar:${id}`]?.score),
      ].filter((value): value is number => typeof value === 'number')
      if (weakScores.some(value => value < .65)) score += 10
      score += (hash(`${exercise.id}:${seed}`) % 1000) / 1000
      return { exercise, score }
    })
    .sort((a, b) => b.score - a.score)

  const rotated = rotate(scored, seed % Math.max(1, Math.min(5, scored.length)))
  const chosen: Exercise[] = []
  const usedIds = new Set<string>()
  const usedPrompts = new Set<string>()
  const vocabularyCounts = new Map<string, number>()
  const grammarCounts = new Map<string, number>()
  const maxPerKey = Math.max(2, Math.ceil(requested * .25))

  function canAdd(exercise: Exercise, relaxed = false) {
    if (usedIds.has(exercise.id) || usedPrompts.has(promptSignature(exercise))) return false
    if (!relaxed) {
      if ((exercise.vocabularyIds || []).some(id => (vocabularyCounts.get(id) || 0) >= maxPerKey)) return false
      if ((exercise.grammarRuleIds || []).some(id => (grammarCounts.get(id) || 0) >= maxPerKey)) return false
    }
    return true
  }

  function add(exercise: Exercise) {
    chosen.push(exercise)
    usedIds.add(exercise.id)
    usedPrompts.add(promptSignature(exercise))
    for (const id of exercise.vocabularyIds || []) vocabularyCounts.set(id, (vocabularyCounts.get(id) || 0) + 1)
    for (const id of exercise.grammarRuleIds || []) grammarCounts.set(id, (grammarCounts.get(id) || 0) + 1)
  }

  for (const group of ['production', 'recognition', 'listening']) {
    const found = rotated.find(item => typeGroup(item.exercise) === group && canAdd(item.exercise))
    if (found) add(found.exercise)
  }
  for (const { exercise } of rotated) {
    if (chosen.length >= requested) break
    if (canAdd(exercise)) add(exercise)
  }
  for (const { exercise } of rotated) {
    if (chosen.length >= requested) break
    if (canAdd(exercise, true)) add(exercise)
  }

  return rotate(
    chosen,
    hash(`exam:${seed}:${options.lessonId}:${options.kind}`) % Math.max(1, chosen.length),
  ).slice(0, requested)
}
