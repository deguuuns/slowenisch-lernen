export const VERB_UNLOCK_THRESHOLDS = {
  minAttemptsPerForm: 1,
  minActiveCorrectPerForm: 1,
  minimumScore: 0.45,
  masteredScore: 0.9,
  masteredAttempts: 4,
} as const

export const REVIEW_INTERVALS_DAYS = [1, 3, 5, 7, 14, 30, 60, 90] as const
export const ERROR_RETRY_DELAY_MINUTES = 10

export const SESSION_TARGET_LIMITS = {
  maxTargetExercisesPerSession: 1,
  maxErrorRetryPerTarget: 1,
} as const

export const EXAM_CONFIG = {
  checkpoint: { min: 4, default: 6, max: 7 },
  final: { min: 10, default: 12, max: 15 },
  major: { min: 20, default: 25, max: 30 },
} as const

export const MAJOR_TEST_CONFIG = {
  lessonsPerTest: 5,
} as const

export const EXAM_REPEAT_CONFIG = {
  historyLimit: 8,
  exerciseCooldownExams: 2,
  openingCooldownExams: 3,
  promptCooldownExams: 2,
  maxTopicShare: 0.25,
} as const

export const LEARNING_FLOW_CONFIG = {
  newWordsPerBlock: 3,
  exercisesPerBlock: 4,
  minRecallGapTasks: 1,
} as const
