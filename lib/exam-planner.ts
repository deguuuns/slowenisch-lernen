import { isExerciseEligible } from '@/lib/curriculum-access'
import { enrichExercises } from '@/lib/curriculum-metadata'
import { promptSignature } from '@/lib/exam-history'
import { EXAM_CONFIG, EXAM_REPEAT_CONFIG } from '@/lib/learning-config'
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

export function examSize(kind: ExamKind, progress: UserProgress, newContentCount = 0, errorCount = 0) {
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

function typeGroup(exercise: Exercise) {
  if (exercise.type === 'choice') return 'recognition'
  if (exercise.skillTargets?.includes('listening')) return 'listening'
  if (exercise.skillTargets?.includes('production')) return 'production'
  return exercise.type
}

function candidatePool(options: PlanOptions) {
  const curated = enrichExercises(options.exercises).filter(exercise => exercise.lesson === options.lessonId)
  const lessonWords = options.vocabulary.filter(
    word => word.lesson === options.lessonId && options.progress.introducedWords.includes(word.id),
  )
  const generated = lessonWords.flatMap(word => generatedExercisesForWord(word, lessonWords))
  return [...curated, ...generated].filter(exercise => isExerciseEligible(exercise, options.progress))
}

function recentExamSets(progress: UserProgress) {
  const history = progress.examHistory || []
  const exerciseHistory = history.slice(-EXAM_REPEAT_CONFIG.exerciseCooldownExams)
  const openingHistory = history.slice(-EXAM_REPEAT_CONFIG.openingCooldownExams)
  const promptHistory = history.slice(-EXAM_REPEAT_CONFIG.promptCooldownExams)
  return {
    recentExerciseIds: new Set(exerciseHistory.flatMap(item => item.exerciseIds)),
    recentOpeningIds: new Set(openingHistory.flatMap(item => item.firstExerciseIds)),
    recentPromptSignatures: new Set(promptHistory.flatMap(item => item.promptSignatures)),
    recentVocabularyIds: new Set(exerciseHistory.flatMap(item => item.vocabularyIds)),
    recentGrammarIds: new Set(exerciseHistory.flatMap(item => item.grammarRuleIds)),
  }
}

function wasRecentlyWrong(exercise: Exercise, progress: UserProgress) {
  const recent = (progress.recentAttempts || []).slice(-20).reverse()
  const exact = recent.find(attempt => attempt.exerciseId === exercise.id)
  if (exact) return !exact.correct
  const vocabulary = new Set(exercise.vocabularyIds || [])
  const grammar = new Set(exercise.grammarRuleIds || [])
  return recent.some(attempt => !attempt.correct && (
    (attempt.vocabularyIds || []).some(id => vocabulary.has(id)) ||
    (attempt.grammarRuleIds || []).some(id => grammar.has(id))
  ))
}

function arrangeOpenings(chosen: Exercise[], blocked: Set<string>, seed: number) {
  if (chosen.length < 2) return chosen
  const fresh = rotate(chosen.filter(exercise => !blocked.has(exercise.id)), seed % Math.max(1, chosen.length))
  const opening: Exercise[] = []
  for (const exercise of fresh) {
    if (opening.length >= 2) break
    opening.push(exercise)
  }
  if (opening.length < 2) {
    for (const exercise of chosen) {
      if (opening.length >= 2) break
      if (!opening.some(item => item.id === exercise.id)) opening.push(exercise)
    }
  }
  const openingIds = new Set(opening.map(exercise => exercise.id))
  return [...opening, ...chosen.filter(exercise => !openingIds.has(exercise.id))]
}

export function buildExamPlan(options: PlanOptions): Exercise[] {
  const config = EXAM_CONFIG[options.kind]
  const requested = clamp(options.targetSize ?? examSize(options.kind, options.progress), config.min, config.max)
  const pool = candidatePool(options)
  if (!pool.length) return []

  const recentAttempts = (options.progress.recentAttempts || []).slice(-10)
  const recentAttemptIds = new Set(recentAttempts.map(attempt => attempt.exerciseId))
  const cooldown = recentExamSets(options.progress)
  const seed = options.seed ?? Date.now()

  const scored = pool.map(exercise => {
    let score = 0
    const signature = promptSignature(exercise.prompt)
    const wrong = wasRecentlyWrong(exercise, options.progress)
    if (!recentAttemptIds.has(exercise.id)) score += 18
    if (cooldown.recentExerciseIds.has(exercise.id)) score -= wrong ? 8 : 42
    if (cooldown.recentPromptSignatures.has(signature)) score -= wrong ? 6 : 30
    if ((exercise.vocabularyIds || []).some(id => cooldown.recentVocabularyIds.has(id))) score -= 5
    if ((exercise.grammarRuleIds || []).some(id => cooldown.recentGrammarIds.has(id))) score -= 5
    if (exercise.skillTargets?.includes('production')) score += 4
    if (exercise.type === 'choice') score += 2
    const weakScores = [
      ...(exercise.vocabularyIds || []).map(id => options.progress.mastery?.[`vocab:${id}`]?.score),
      ...(exercise.grammarRuleIds || []).map(id => options.progress.mastery?.[`grammar:${id}`]?.score),
    ].filter((value): value is number => typeof value === 'number')
    if (weakScores.some(value => value < .65)) score += 10
    if (wrong) score += 16
    score += (hash(`${exercise.id}:${seed}:${(options.progress.examHistory || []).length}`) % 1000) / 1000
    return { exercise, score }
  }).sort((a, b) => b.score - a.score)

  const chosen: Exercise[] = []
  const usedIds = new Set<string>()
  const usedPrompts = new Set<string>()
  const vocabularyCounts = new Map<string, number>()
  const grammarCounts = new Map<string, number>()
  const maxPerKey = Math.max(2, Math.ceil(requested * EXAM_REPEAT_CONFIG.maxTopicShare))

  function canAdd(exercise: Exercise, relaxed = false) {
    const signature = promptSignature(exercise.prompt)
    if (usedIds.has(exercise.id) || usedPrompts.has(signature)) return false
    if (!relaxed) {
      if ((exercise.vocabularyIds || []).some(id => (vocabularyCounts.get(id) || 0) >= maxPerKey)) return false
      if ((exercise.grammarRuleIds || []).some(id => (grammarCounts.get(id) || 0) >= maxPerKey)) return false
    }
    return true
  }

  function add(exercise: Exercise) {
    chosen.push(exercise)
    usedIds.add(exercise.id)
    usedPrompts.add(promptSignature(exercise.prompt))
    for (const id of exercise.vocabularyIds || []) vocabularyCounts.set(id, (vocabularyCounts.get(id) || 0) + 1)
    for (const id of exercise.grammarRuleIds || []) grammarCounts.set(id, (grammarCounts.get(id) || 0) + 1)
  }

  // Diversity is a preference, never a fixed "first matching production" rule.
  const groups = rotate(['production', 'recognition', 'listening'], seed % 3)
  for (const group of groups) {
    const candidates = scored.filter(item => typeGroup(item.exercise) === group && canAdd(item.exercise))
    if (candidates.length) add(candidates[hash(`${group}:${seed}`) % Math.min(candidates.length, 3)].exercise)
  }
  for (const { exercise } of scored) {
    if (chosen.length >= requested) break
    if (canAdd(exercise)) add(exercise)
  }
  for (const { exercise } of scored) {
    if (chosen.length >= requested) break
    if (canAdd(exercise, true)) add(exercise)
  }

  const varied = rotate(chosen, hash(`exam:${seed}:${options.lessonId}:${options.kind}`) % Math.max(1, chosen.length))
  return arrangeOpenings(varied, cooldown.recentOpeningIds, seed).slice(0, requested)
}
