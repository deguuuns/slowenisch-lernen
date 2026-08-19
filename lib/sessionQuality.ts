import type { Exercise, SessionHistoryItem } from '@/types'

/** Passive teaching/exposure steps do not require the learner to make a decision. */
export function isPassiveTeachingStep(exercise: Exercise) {
  return exercise.type === 'introduce'
}

export function consecutiveIntroductionCount(history: SessionHistoryItem[]) {
  let count = 0
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index].exerciseType !== 'introduce' && history[index].learningPhase !== 'new') break
    count += 1
  }
  return count
}

/**
 * A semantic group is intentionally broader than a concrete target. It lets the
 * selector notice that five different greeting cards are still one narrow topic.
 */
export function semanticGroupForExercise(exercise: Exercise) {
  if (exercise.contextTag) return exercise.contextTag
  if (exercise.curriculumPhase !== undefined) return `curriculum-phase:${exercise.curriculumPhase}`
  if (exercise.grammarTag) return `grammar:${exercise.grammarTag}`
  return undefined
}

export function semanticGroupStreak(history: SessionHistoryItem[], exercise: Exercise) {
  const group = semanticGroupForExercise(exercise)
  if (!group) return 0
  let count = 0
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index]
    const itemGroup = item.contextTag ?? (item.curriculumPhase !== undefined ? `curriculum-phase:${item.curriculumPhase}` : item.grammarTag ? `grammar:${item.grammarTag}` : undefined)
    if (itemGroup !== group) break
    count += 1
  }
  return count
}

export function sessionQualityMetrics(history: SessionHistoryItem[]) {
  const passiveSteps = history.filter(item => item.exerciseType === 'introduce' || item.learningPhase === 'new').length
  const activeSteps = Math.max(0, history.length - passiveSteps)
  const modalities = new Set(history.filter(item => item.exerciseType !== 'introduce').map(item => item.modality).filter(Boolean))
  const exerciseTypes = new Set(history.filter(item => item.exerciseType !== 'introduce').map(item => item.exerciseType).filter(Boolean))
  let maxIntroductionStreak = 0
  let currentIntroductionStreak = 0
  let maxSemanticGroupStreak = 0
  let currentGroup: string | undefined
  let currentGroupStreak = 0

  for (const item of history) {
    if (item.exerciseType === 'introduce' || item.learningPhase === 'new') {
      currentIntroductionStreak += 1
      maxIntroductionStreak = Math.max(maxIntroductionStreak, currentIntroductionStreak)
    } else {
      currentIntroductionStreak = 0
    }

    const group = item.contextTag ?? (item.curriculumPhase !== undefined ? `curriculum-phase:${item.curriculumPhase}` : item.grammarTag ? `grammar:${item.grammarTag}` : undefined)
    if (group && group === currentGroup) currentGroupStreak += 1
    else {
      currentGroup = group
      currentGroupStreak = group ? 1 : 0
    }
    maxSemanticGroupStreak = Math.max(maxSemanticGroupStreak, currentGroupStreak)
  }

  return {
    passiveSteps,
    activeSteps,
    passiveStepRatio: history.length ? passiveSteps / history.length : 0,
    exerciseTypeDiversity: exerciseTypes.size,
    modalityDiversity: modalities.size,
    maxIntroductionStreak,
    maxSemanticGroupStreak,
  }
}
