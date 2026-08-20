import { isExerciseEligible } from '@/lib/curriculum-access'
import { enrichExercises } from '@/lib/curriculum-metadata'
import { promptSignature } from '@/lib/exam-history'
import { EXAM_CONFIG, EXAM_REPEAT_CONFIG, MAJOR_TEST_CONFIG } from '@/lib/learning-config'
import { generatedExercisesForWord } from '@/lib/learning-flow'
import { dedupeExercisesByTarget, inferTargetContentKeys, withTargetMetadata } from '@/lib/learning-targets'
import { Exercise, UserProgress, Vocabulary } from '@/types'

export { EXAM_CONFIG } from '@/lib/learning-config'
export type ExamKind = 'checkpoint' | 'final' | 'major'

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
  if (kind === 'major') return clamp(config.default, config.min, config.max)
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

function lessonRange(kind: ExamKind, lessonId: number) {
  if (kind !== 'major') return new Set([lessonId])
  const start = Math.max(1, lessonId - MAJOR_TEST_CONFIG.lessonsPerTest + 1)
  return new Set(Array.from({ length: lessonId - start + 1 }, (_, index) => start + index))
}

function candidatePool(options: PlanOptions) {
  const lessons = lessonRange(options.kind, options.lessonId)
  const curated = enrichExercises(options.exercises).filter(exercise => lessons.has(exercise.lesson)).map(withTargetMetadata)
  const lessonWords = options.vocabulary.filter(word => lessons.has(word.lesson) && options.progress.introducedWords.includes(word.id))
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
    recentTargets: new Set(exerciseHistory.flatMap(item => item.targetContentKeys || [])),
  }
}

function wasRecentlyWrong(exercise: Exercise, progress: UserProgress) {
  const targets = new Set(inferTargetContentKeys(exercise))
  const vocabulary = new Set(exercise.vocabularyIds || [])
  const grammar = new Set(exercise.grammarRuleIds || [])
  return (progress.recentAttempts || []).slice(-20).reverse().some(attempt => {
    if (attempt.correct) return false
    if (attempt.exerciseId === exercise.id) return true
    return (attempt.vocabularyIds || []).some(id => vocabulary.has(id) || targets.has(`vocab:${id}`)) ||
      (attempt.grammarRuleIds || []).some(id => grammar.has(id) || targets.has(`grammar:${id}`))
  })
}

function arrangeOpenings(chosen: Exercise[], blocked: Set<string>, seed: number) {
  if (chosen.length < 2) return chosen
  const fresh = rotate(chosen.filter(exercise => !blocked.has(exercise.id)), seed % Math.max(1, chosen.length))
  const opening = fresh.slice(0, 2)
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

  const recentAttemptIds = new Set((options.progress.recentAttempts || []).slice(-10).map(attempt => attempt.exerciseId))
  const cooldown = recentExamSets(options.progress)
  const seed = options.seed ?? Date.now()

  const scored = pool.map(exercise => {
    let score = 0
    const signature = promptSignature(exercise.prompt)
    const wrong = wasRecentlyWrong(exercise, options.progress)
    const targets = inferTargetContentKeys(exercise)
    if (!recentAttemptIds.has(exercise.id)) score += 18
    if (cooldown.recentExerciseIds.has(exercise.id)) score -= wrong ? 8 : 42
    if (cooldown.recentPromptSignatures.has(signature)) score -= wrong ? 6 : 30
    if (targets.some(target => cooldown.recentTargets.has(target))) score -= wrong ? 4 : 18
    if ((exercise.vocabularyIds || []).some(id => cooldown.recentVocabularyIds.has(id))) score -= 5
    if ((exercise.grammarRuleIds || []).some(id => cooldown.recentGrammarIds.has(id))) score -= 5
    if (exercise.skillTargets?.includes('production')) score += 4
    if (exercise.type === 'choice') score += 2
    if (wrong) score += 16
    score += (hash(`${exercise.id}:${seed}:${(options.progress.examHistory || []).length}`) % 1000) / 1000
    return { exercise, score }
  }).sort((a, b) => b.score - a.score)

  const chosen: Exercise[] = []
  const usedIds = new Set<string>()
  const usedPrompts = new Set<string>()
  const usedTargets = new Set<string>()
  const maxPerKey = Math.max(2, Math.ceil(requested * EXAM_REPEAT_CONFIG.maxTopicShare))
  const vocabularyCounts = new Map<string, number>()
  const grammarCounts = new Map<string, number>()

  function canAdd(exercise: Exercise, relaxed = false) {
    const signature = promptSignature(exercise.prompt)
    const targets = inferTargetContentKeys(exercise)
    if (usedIds.has(exercise.id) || usedPrompts.has(signature)) return false
    if (targets.length && targets.some(target => usedTargets.has(target))) return false
    if (!relaxed) {
      if ((exercise.vocabularyIds || []).some(id => (vocabularyCounts.get(id) || 0) >= maxPerKey)) return false
      if ((exercise.grammarRuleIds || []).some(id => (grammarCounts.get(id) || 0) >= maxPerKey)) return false
    }
    return true
  }

  function add(exercise: Exercise) {
    const enriched = withTargetMetadata(exercise)
    chosen.push(enriched)
    usedIds.add(enriched.id)
    usedPrompts.add(promptSignature(enriched.prompt))
    inferTargetContentKeys(enriched).forEach(target => usedTargets.add(target))
    for (const id of enriched.vocabularyIds || []) vocabularyCounts.set(id, (vocabularyCounts.get(id) || 0) + 1)
    for (const id of enriched.grammarRuleIds || []) grammarCounts.set(id, (grammarCounts.get(id) || 0) + 1)
  }

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

  const varied = rotate(dedupeExercisesByTarget(chosen, requested), hash(`exam:${seed}:${options.lessonId}:${options.kind}`) % Math.max(1, chosen.length))
  return arrangeOpenings(varied, cooldown.recentOpeningIds, seed).slice(0, requested)
}

export function majorTestDue(progress: UserProgress) {
  const completed = new Set(progress.completedLessons)
  if (!completed.size || completed.size % MAJOR_TEST_CONFIG.lessonsPerTest !== 0) return false
  const endpoint = Math.max(...Array.from(completed))
  return endpoint === completed.size && !(progress.examHistory || []).some(item => item.kind === 'major' && item.lessonId === endpoint)
}
