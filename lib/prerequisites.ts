import type { Exercise, LearnerProfile, UserProgress } from '@/types'

export function isExerciseUnlocked(exercise: Exercise, progress: UserProgress, profile: LearnerProfile | null) {
  const vocabulary = new Set(progress.introducedVocabulary ?? [])
  const grammar = new Set(progress.introducedGrammar ?? [])

  if (exercise.requiredVocabulary?.some(item => !vocabulary.has(item))) return false
  if (exercise.requiredGrammar?.some(item => !grammar.has(item))) return false
  if (exercise.requiredLearningItems?.some(key => (progress.learningItems?.[key]?.mastery ?? 0) < 0.5)) return false
  if (exercise.requiredSkills) {
    for (const [skill, threshold] of Object.entries(exercise.requiredSkills)) {
      if ((progress.skillXp?.[skill as keyof typeof progress.skillXp] ?? 0) < (threshold ?? 0)) return false
    }
  }

  if (profile?.startMode === 'zero') {
    // A brand-new learner stays inside the explicit starter curriculum until a small foundation exists.
    if (vocabulary.size < 6 && exercise.contextTag !== 'beginner-foundation') return false
    // Do not jump to later lessons while the user is still building the first active vocabulary.
    if (vocabulary.size < 12 && exercise.lesson > 1) return false
  }

  return true
}

export function registerIntroductions(progress: UserProgress, exercise: Exercise): UserProgress {
  return {
    ...progress,
    introducedVocabulary: Array.from(new Set([...(progress.introducedVocabulary ?? []), ...(exercise.introducesVocabulary ?? [])])),
    introducedGrammar: Array.from(new Set([...(progress.introducedGrammar ?? []), ...(exercise.introducesGrammar ?? [])])),
  }
}
