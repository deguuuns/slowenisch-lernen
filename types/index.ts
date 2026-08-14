export type CEFRLevel = 'A1' | 'A2' | 'B1'
export type LearningSkill = 'lesen' | 'hören' | 'schreiben' | 'sprechen' | 'grammatik' | 'wortschatz'
export type LearningStatus = 'neu' | 'unsicher' | 'gelernt' | 'sicher' | 'überfällig'
export type InputMode = 'typed' | 'speech'
export type ExerciseEvaluationMode = 'exact' | 'accepted' | 'free'
export type ExerciseModality = 'text' | 'choice' | 'listening' | 'speaking'

export type Vocabulary = {
  id: string
  sl: string
  de: string
  partOfSpeech: string
  category: string
  example: string
  exampleDe: string
  lesson: number
  level?: CEFRLevel
  gender?: 'm' | 'f' | 'n'
  dual?: string
  plural?: string
  forms?: string[]
  audioText?: string
}

export type Sentence = {
  id: string
  sl: string
  de: string
  lesson: number
  note?: string
  level?: CEFRLevel
  skills?: LearningSkill[]
}

export type ExerciseType =
  | 'translate-de-sl'
  | 'fill'
  | 'choice'
  | 'free'
  | 'ending'
  | 'listen-choice'
  | 'listen-type'
  | 'listen-answer'
  | 'dialog-comprehension'
  | 'speak-answer'
  | 'spot-error'
  | 'transform'

export type Exercise = {
  id: string
  lesson: number
  type: ExerciseType
  prompt: string
  answer: string
  acceptedAnswers?: string[]
  alternatives?: string[]
  hint?: string
  explanation?: string
  level?: CEFRLevel
  skills?: LearningSkill[]
  evaluationMode?: ExerciseEvaluationMode
  difficulty?: 1 | 2 | 3 | 4 | 5
  audioPrompt?: string
  grammarTag?: string
  prerequisites?: string[]
  learningTargets?: string[]
  modality?: ExerciseModality
  contentKey?: string
  contextTag?: string
}

export type GrammarPoint = {
  id?: string
  title: string
  body: string
  examples: string[]
  commonMistakes?: string[]
  level?: CEFRLevel
  tags?: string[]
}

export type Lesson = {
  id: number
  title: string
  subtitle: string
  minutes: number
  focus: string[]
  grammar: GrammarPoint
  level?: CEFRLevel
  objectives?: string[]
  skills?: LearningSkill[]
}

export type ConversationTurn = {
  speaker: 'Tutor' | 'Nutzer'
  sl: string
  de?: string
}

export type Conversation = {
  id: string
  title: string
  lesson: number
  turns: ConversationTurn[]
  level?: CEFRLevel
}

export type MistakeCategory =
  | 'format'
  | 'word'
  | 'case'
  | 'gender'
  | 'number'
  | 'dual'
  | 'verb-person'
  | 'preposition'
  | 'location-direction'
  | 'word-order'
  | 'number-form'
  | 'unknown'

export type Mistake = {
  key: string
  count: number
  lastSeen: number
  category?: MistakeCategory
}

export type ReviewItem = {
  key: string
  status: LearningStatus
  dueAt: number
  intervalIndex: number
  correctCount?: number
  incorrectCount?: number
  lastReviewedAt?: number
  lastResponseMs?: number
  ease?: number
  difficulty?: number
  confidence?: 1 | 2 | 3 | 4 | 5
}

export type LearningItemKind = 'exercise' | 'vocabulary' | 'grammar' | 'phrase' | 'pattern' | 'listening' | 'speaking' | 'lesson'

export type LearningItemState = {
  key: string
  kind: LearningItemKind
  level?: CEFRLevel
  skills?: LearningSkill[]
  grammarTag?: string
  attempts: number
  correctCount: number
  incorrectCount: number
  correctStreak: number
  incorrectStreak: number
  mastery: number
  difficulty: number
  lastSeenAt?: number
  nextDueAt?: number
  averageResponseMs?: number
  lastMistakeCategory?: MistakeCategory
}

export type SessionHistoryItem = {
  exerciseId: string
  learningTargets: string[]
  skills: LearningSkill[]
  correct: boolean
  timestamp: number
  mistakeCategory?: MistakeCategory
  reason?: string
  exerciseType?: ExerciseType
  modality?: ExerciseModality
  grammarTag?: string
  contentKey?: string
  contextTag?: string
}

export type DailyActivity = {
  date: string
  minutes: number
  exercises: number
  correct: number
}

export type UserProgress = {
  schemaVersion?: number
  completedLessons: number[]
  streak: number
  wordsLearned: string[]
  secureWords: string[]
  mistakes: Mistake[]
  reviews: ReviewItem[]
  speakingMinutes: number
  listeningMinutes: number
  totalLearningMinutes?: number
  dailyActivity?: DailyActivity[]
  lastSessionAt?: number
  skillXp?: Partial<Record<LearningSkill, number>>
  learningItems?: Record<string, LearningItemState>
  recentSessionHistory?: SessionHistoryItem[]
}
