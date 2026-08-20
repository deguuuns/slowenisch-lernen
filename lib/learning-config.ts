export const VERB_UNLOCK_THRESHOLDS = {
  minAttemptsPerForm: 3,
  minActiveCorrectPerForm: 2,
  minimumScore: 0.7,
  masteredScore: 0.9,
  masteredAttempts: 5,
} as const

export const EXAM_CONFIG = {
  checkpoint: { min: 4, default: 6, max: 7 },
  final: { min: 10, default: 12, max: 15 },
} as const

export const LEARNING_FLOW_CONFIG = {
  newWordsPerBlock: 3,
  exercisesPerBlock: 4,
  minRecallGapTasks: 1,
} as const
