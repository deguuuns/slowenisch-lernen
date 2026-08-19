export type LearningStatus = 'neu' | 'unsicher' | 'gelernt' | 'sicher'
export type EvaluationMode = 'exact' | 'acceptedVariants' | 'grammar' | 'semantic' | 'open'

export type Vocabulary = {
  id: string
  sl: string
  de: string
  partOfSpeech: string
  category: string
  example: string
  exampleDe: string
  lesson: number
  lemma?: string
  gender?: 'masculine' | 'feminine' | 'neuter'
  cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
  pronunciation?: string
  tags?: string[]
}

export type Sentence = { id:string; sl:string; de:string; lesson:number; note?:string }
export type ExerciseType = 'translate-de-sl' | 'fill' | 'choice' | 'free' | 'ending'
export type Exercise = {
  id:string
  lesson:number
  type:ExerciseType
  prompt:string
  answer:string
  alternatives?:string[]
  acceptedAnswers?:string[]
  hint?:string
  explanation?:string
  vocabularyIds?:string[]
  grammarRuleIds?:string[]
  evaluationMode?:EvaluationMode
  generated?:boolean
  transferSourceExerciseId?:string
  transferRuleId?:string
}
export type Lesson = { id:number; title:string; subtitle:string; minutes:number; focus:string[]; grammar:{title:string;body:string;examples:string[]} }
export type ConversationTurn = { speaker:'Tutor'|'Nutzer'; sl:string; de?:string }
export type Conversation = { id:string; title:string; lesson:number; turns:ConversationTurn[] }
export type Mistake = { key:string; count:number; lastSeen:number }
export type ReviewItem = { key:string; status:LearningStatus; dueAt:number; intervalIndex:number }

export type AttemptSignal = {
  exerciseId:string
  correct:boolean
  responseMs:number
  hintsUsed:number
  occurredAt:number
}

export type TransferItem = {
  sourceExerciseId:string
  grammarRuleId:string
  dueAfter:number
  createdAt:number
}

export type MasteryItem = {
  key:string
  kind:'vocabulary'|'grammar'|'skill'
  score:number
  attempts:number
  correct:number
  lastSeen:number
}

export type UserProgress = {
  completedLessons:number[]
  streak:number
  introducedWords:string[]
  wordsLearned:string[]
  secureWords:string[]
  mistakes:Mistake[]
  reviews:ReviewItem[]
  speakingMinutes:number
  listeningMinutes:number
  mastery:Record<string,MasteryItem>
  recentAttempts:AttemptSignal[]
  transferQueue:TransferItem[]
}
