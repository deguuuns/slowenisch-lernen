import type { CEFRLevel, Exercise, LearnerProfile, LearningItemState, UserProgress } from '@/types'

const LEVEL_RANK: Record<CEFRLevel, number> = { A1: 1, A2: 2, B1: 3 }
const normalizeKey = (value: string) => value.toLocaleLowerCase('sl-SI').trim().replace(/[.!?]+$/g, '')
const chunkKey = (value: string) => `chunk:${normalizeKey(value).replace(/\s+/g, '-')}`

export function isExerciseUnlocked(exercise: Exercise, progress: UserProgress, profile: LearnerProfile | null) {
  const vocabulary = new Set((progress.introducedVocabulary ?? []).map(normalizeKey))
  const grammar = new Set(progress.introducedGrammar ?? [])

  if (profile && exercise.level && LEVEL_RANK[exercise.level] > LEVEL_RANK[profile.approximateLevel]) return false
  if (exercise.requiredVocabulary?.some(item => !vocabulary.has(normalizeKey(item)))) return false
  if (exercise.requiredInputVocabulary?.some(item => !vocabulary.has(normalizeKey(item)))) return false
  if (exercise.requiredOutputVocabulary?.some(item => !vocabulary.has(normalizeKey(item)))) return false
  if (exercise.requiredGrammar?.some(item => !grammar.has(item))) return false
  if (exercise.requiredLearningItems?.some(key => (progress.learningItems?.[key]?.mastery ?? 0) < 0.5)) return false
  if (exercise.requiredSkills) {
    for (const [skill, threshold] of Object.entries(exercise.requiredSkills)) {
      if ((progress.skillXp?.[skill as keyof typeof progress.skillXp] ?? 0) < (threshold ?? 0)) return false
    }
  }

  if (profile?.startMode === 'zero') {
    // Explicit curriculum metadata is now the stronger beginner gate. Keep the old
    // context restriction only for legacy content that is not part of that curriculum.
    if (exercise.curriculumPhase === undefined && vocabulary.size < 6 && exercise.contextTag !== 'beginner-foundation') return false
    if (exercise.curriculumPhase === undefined && vocabulary.size < 12 && exercise.lesson > 1) return false
  }

  return true
}

function introducedState(key: string, kind: LearningItemState['kind'], previous?: LearningItemState): LearningItemState {
  if (previous) return { ...previous, introduced: true, stage: previous.stage === 'unseen' ? 'introduced' : previous.stage }
  return {
    key,
    kind,
    stage: 'introduced',
    attempts: 0,
    correctCount: 0,
    incorrectCount: 0,
    correctStreak: 0,
    incorrectStreak: 0,
    mastery: 0.08,
    difficulty: 1,
    introduced: true,
    receptiveMastery: 0.08,
    recallMastery: 0,
    productiveMastery: 0,
  }
}

export function registerIntroductions(progress: UserProgress, exercise: Exercise): UserProgress {
  const learningItems = { ...(progress.learningItems ?? {}) }

  for (const rawItem of exercise.introducesVocabulary ?? []) {
    const item = normalizeKey(rawItem)
    const vocabKey = `vocab:${item}`
    const isChunk = item.includes(' ')
    learningItems[vocabKey] = introducedState(vocabKey, isChunk ? 'chunk' : 'vocabulary', learningItems[vocabKey])

    // Backwards-compatible alias for modern chunk:* targets. The existing beginner
    // curriculum still uses vocab:<chunk text>, while foundation/legacy-safe content
    // may reference chunk:<slug>. Both point at equivalent introduction evidence.
    if (isChunk) {
      const alias = chunkKey(item)
      learningItems[alias] = introducedState(alias, 'chunk', learningItems[alias] ?? learningItems[vocabKey])
    }
  }
  for (const item of exercise.introducesGrammar ?? []) {
    const key = `grammar:${item}`
    learningItems[key] = introducedState(key, 'grammar', learningItems[key])
  }

  return {
    ...progress,
    introducedVocabulary: Array.from(new Set([...(progress.introducedVocabulary ?? []), ...(exercise.introducesVocabulary ?? []).map(normalizeKey)])),
    introducedGrammar: Array.from(new Set([...(progress.introducedGrammar ?? []), ...(exercise.introducesGrammar ?? [])])),
    learningItems,
  }
}
