import type { Exercise, KnowledgeStage, LearningItemState, UserProgress } from '@/types'

const PRODUCTIVE_TYPES = new Set<Exercise['type']>(['translate-de-sl', 'free', 'ending', 'listen-answer', 'speak-answer', 'transform'])
const MEANINGFUL_PREFIXES = ['vocab:', 'chunk:', 'grammar:', 'verb:', 'conjugation:', 'pattern:']

const STAGE_RANK: Record<KnowledgeStage, number> = {
  unseen: 0,
  introduced: 1,
  recognition: 2,
  recall: 3,
  production: 4,
  familiar: 4,
  mastered: 5,
  review_due: 5,
}

const normalize = (value: string) => value.toLocaleLowerCase('sl-SI').trim().replace(/[.!?]+$/g, '')
const chunkKey = (value: string) => `chunk:${normalize(value).replace(/\s+/g, '-')}`

export type AnswerabilityResult = {
  eligible: boolean
  reasons: string[]
}

function stateStage(state: LearningItemState | undefined): KnowledgeStage {
  return state?.stage ?? (state?.introduced ? 'introduced' : 'unseen')
}

function stateMeets(state: LearningItemState | undefined, required: KnowledgeStage) {
  if (!state) return false
  if (required === 'recognition' && (state.receptiveMastery ?? 0) >= 0.18) return true
  if (required === 'recall' && (state.recallMastery ?? 0) >= 0.18) return true
  if (required === 'production' && (state.productiveMastery ?? 0) >= 0.18) return true
  return STAGE_RANK[stateStage(state)] >= STAGE_RANK[required]
}

function isProductive(exercise: Exercise) {
  return exercise.learningPhase === 'production' || exercise.learningPhase === 'transfer' || PRODUCTIVE_TYPES.has(exercise.type)
}

function impliedTargetStage(exercise: Exercise): KnowledgeStage | undefined {
  if (exercise.requiredTargetStage) return exercise.requiredTargetStage
  if (exercise.learningPhase === 'recognition') return 'introduced'
  if (exercise.learningPhase === 'recall') return 'recognition'
  if (exercise.learningPhase === 'application') return 'recognition'
  if (isProductive(exercise)) return 'recall'
  return undefined
}

function vocabularyIntroduced(progress: UserProgress, value: string) {
  const normalized = normalize(value)
  return (progress.introducedVocabulary ?? []).some(item => normalize(item) === normalized)
}

function grammarIntroduced(progress: UserProgress, value: string) {
  return (progress.introducedGrammar ?? []).includes(value)
}

function learningItemForChunk(progress: UserProgress, value: string) {
  return progress.learningItems?.[value.startsWith('chunk:') ? value : chunkKey(value)]
    ?? progress.learningItems?.[`vocab:${normalize(value)}`]
}

function meaningfulTargets(exercise: Exercise) {
  return (exercise.learningTargets ?? []).filter(target => MEANINGFUL_PREFIXES.some(prefix => target.startsWith(prefix)))
}

/**
 * Authoritative didactic safety gate. It is intentionally fail-closed: when a task
 * cannot prove that its required language has been introduced at the needed stage,
 * it is blocked before scoring, randomization, or fallback selection.
 */
export function evaluateExerciseAnswerability(exercise: Exercise, progress: UserProgress): AnswerabilityResult {
  const reasons: string[] = []

  if (exercise.type === 'introduce') {
    const introducesSomething = !!(exercise.introducesVocabulary?.length || exercise.introducesGrammar?.length)
    if (!introducesSomething) reasons.push('introduction:no-explicit-learning-item')
    if (!exercise.introSl?.trim()) reasons.push('introduction:missing-slovenian')
    if (!exercise.introDe?.trim()) reasons.push('introduction:missing-german-meaning')
    if (!exercise.learningTargets?.length) reasons.push('introduction:missing-learning-target')
    return { eligible: reasons.length === 0, reasons }
  }

  const inputVocabulary = Array.from(new Set([...(exercise.requiredVocabulary ?? []), ...(exercise.requiredInputVocabulary ?? [])]))
  const outputVocabulary = exercise.requiredOutputVocabulary ?? []

  for (const item of inputVocabulary) {
    if (!vocabularyIntroduced(progress, item)) reasons.push(`input-vocabulary:${normalize(item)}:not-introduced`)
  }
  for (const item of outputVocabulary) {
    if (!vocabularyIntroduced(progress, item)) reasons.push(`output-vocabulary:${normalize(item)}:not-introduced`)
  }
  for (const item of exercise.requiredChunks ?? []) {
    const state = learningItemForChunk(progress, item)
    if (!state || STAGE_RANK[stateStage(state)] < STAGE_RANK.recognition) reasons.push(`chunk:${item}:recognition-insufficient`)
  }
  for (const item of exercise.requiredGrammar ?? []) {
    if (!grammarIntroduced(progress, item)) reasons.push(`grammar:${item}:not-introduced`)
  }
  for (const key of exercise.requiredVerbForms ?? []) {
    if (!stateMeets(progress.learningItems?.[key], 'recognition')) reasons.push(`${key}:recognition-insufficient`)
  }
  for (const key of exercise.requiredSentencePatterns ?? []) {
    const needed = isProductive(exercise) ? 'recall' : 'recognition'
    if (!stateMeets(progress.learningItems?.[key], needed)) reasons.push(`${key}:${needed}-insufficient`)
  }
  for (const key of exercise.requiredLearningItems ?? []) {
    if (!stateMeets(progress.learningItems?.[key], 'recognition')) reasons.push(`${key}:learning-item-insufficient`)
  }

  const requiredStage = impliedTargetStage(exercise)
  if (requiredStage) {
    const targets = meaningfulTargets(exercise)
    if (!targets.length) reasons.push(`targets:${requiredStage}:missing`)
    for (const target of targets) {
      if (!stateMeets(progress.learningItems?.[target], requiredStage)) reasons.push(`${target}:${requiredStage}-insufficient`)
    }
  }

  if (isProductive(exercise)) {
    const explicitVocabulary = inputVocabulary.length > 0 || outputVocabulary.length > 0
    const explicitStructures = !!(
      exercise.requiredChunks?.length ||
      exercise.requiredGrammar?.length ||
      exercise.requiredVerbForms?.length ||
      exercise.requiredSentencePatterns?.length ||
      exercise.requiredLearningItems?.length
    )
    if (!explicitVocabulary) reasons.push('production:missing-explicit-vocabulary-requirements')
    if (!exercise.requirementsComplete && !explicitStructures) reasons.push('production:requirements-incomplete')
    if (!exercise.requiredTargetStage && !exercise.requiredLearningItems?.length && !exercise.requiredSentencePatterns?.length) {
      reasons.push('production:missing-stage-proof')
    }
  } else if (!exercise.learningPhase && !exercise.curriculumPhase && !exercise.requiredVocabulary?.length && !exercise.requiredGrammar?.length && !exercise.requiredLearningItems?.length) {
    reasons.push('legacy:requirements-unknown')
  }

  return { eligible: reasons.length === 0, reasons }
}

export function assertExerciseAnswerable(exercise: Exercise, progress: UserProgress) {
  const result = evaluateExerciseAnswerability(exercise, progress)
  if (!result.eligible) throw new Error(`${exercise.id} blocked: ${result.reasons.join(', ')}`)
  return true
}
