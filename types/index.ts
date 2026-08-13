export type LearningStatus = 'neu' | 'unsicher' | 'gelernt' | 'sicher'

export type Vocabulary = {
  id: string
  sl: string
  de: string
  partOfSpeech: string
  category: string
  example: string
  exampleDe: string
  lesson: number
}

export type Sentence = {
  id: string
  sl: string
  de: string
  lesson: number
  note?: string
}

export type ExerciseType = 'translate-de-sl' | 'fill' | 'choice' | 'free' | 'ending'

export type Exercise = {
  id: string
  lesson: number
  type: ExerciseType
  prompt: string
  answer: string
  alternatives?: string[]
  hint?: string
  explanation?: string
}

export type Lesson = {
  id: number
  title: string
  subtitle: string
  minutes: number
  focus: string[]
  grammar: { title: string; body: string; examples: string[] }
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
}

export type Mistake = {
  key: string
  count: number
  lastSeen: number
}

export type ReviewItem = {
  key: string
  status: LearningStatus
  dueAt: number
  intervalIndex: number
}

export type UserProgress = {
  completedLessons: number[]
  streak: number
  wordsLearned: string[]
  secureWords: string[]
  mistakes: Mistake[]
  reviews: ReviewItem[]
  speakingMinutes: number
  listeningMinutes: number
}
