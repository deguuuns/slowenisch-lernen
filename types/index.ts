export type LearningStatus = 'neu' | 'unsicher' | 'gelernt' | 'sicher'
export type VocabularyStatus = 'neu' | 'eingeführt' | 'lernen' | 'gelernt' | 'sicher'
export type EvaluationMode = 'exact' | 'acceptedVariants' | 'grammar' | 'semantic' | 'open'
export type SkillTarget = 'recognition' | 'production' | 'grammar-application' | 'listening' | 'speaking'
export type MasteryDimension = 'recognition' | 'production' | 'listening' | 'speaking' | 'grammar'
export type HintType = 'translation' | 'firstLetter' | 'grammarHint' | 'slowAudio' | 'replayAudio' | 'generic'
export type ExerciseDifficulty = 'intro' | 'easy' | 'normal' | 'challenge'
export type ExercisePresentation = 'standard' | 'reorder' | 'recognition-choice' | 'active-recall'
export type VerbNumber = 'singular' | 'dual' | 'plural'
export type VerbAnswerMode = 'full-person-form' | 'form-only' | 'gap'
export type ResponseScope = 'fixed' | 'contextual' | 'personal-open'
export type LearningPhase = 'understand' | 'recognize' | 'guided-production' | 'active-production' | 'variation' | 'transfer' | 'remediation'
export type MistakeCategory = 'vocabulary-recall' | 'case-error' | 'gender-error' | 'dual-error' | 'plural-error' | 'number-error' | 'verb-person-error' | 'conjugation-error' | 'preposition-error' | 'word-order-error' | 'reflexive-error' | 'spelling-error' | 'incomplete-answer' | 'listening-error' | 'wrong-meaning' | 'other'
export type VerbFormRequirement = { verbId:string; person:1|2|3; number:VerbNumber }
export type TargetContentKey = `vocab:${string}` | `grammar:${string}` | `verb:${string}` | `skill:${string}`
export type VocabularyPriority = 1|2|3|4|5
export type VocabularyTopic = 'basics'|'people'|'family'|'numbers-time'|'food-drink'|'shopping'|'travel'|'home'|'work'|'weather'|'health'|'clothing'|'free-time'|'function-words'|'other'
export type ContentType = 'lexeme'|'form'|'phrase'|'pattern'|'sentence'|'grammarConcept'
export type VocabularyMorphology = {
  nominativePlural?:string
  accusativeSingular?:string
  dual?:string
  plural?:string
  notes?:string[]
}

export type Vocabulary = {
  id:string
  sl:string
  de:string
  partOfSpeech:string
  category:string
  example:string
  exampleDe:string
  lesson:number
  lemma?:string
  gender?:'masculine'|'feminine'|'neuter'
  cefrLevel?:'A1'|'A2'|'B1'|'B2'|'C1'
  pronunciation?:string
  tags?:string[]
  alternativeMeanings?:string[]
  priority?:VocabularyPriority
  topic?:VocabularyTopic
  curriculumUnit?:string
  morphology?:VocabularyMorphology
  contentType?:ContentType
  parentId?:string
  prerequisites?:TargetContentKey[]
  sequence?:number
  usageNote?:string
  literalMeaningDe?:string
  introExample?:boolean
}
export type Sentence = { id:string; sl:string; de:string; lesson:number; note?:string; vocabularyIds?:string[]; prerequisites?:TargetContentKey[]; contentType?:'phrase'|'pattern'|'sentence' }
export type ExerciseType = 'translate-de-sl' | 'fill' | 'choice' | 'free' | 'ending'
export type Exercise = { id:string; lesson:number; type:ExerciseType; prompt:string; answer:string; alternatives?:string[]; acceptedAnswers?:string[]; hint?:string; explanation?:string; vocabularyIds?:string[]; grammarRuleIds?:string[]; evaluationMode?:EvaluationMode; skillTargets?:SkillTarget[]; difficulty?:ExerciseDifficulty; requiredVerbForms?:VerbFormRequirement[]; generated?:boolean; verbPractice?:boolean; verbAnswerMode?:VerbAnswerMode; responseScope?:ResponseScope; targetContentKeys?:TargetContentKey[]; supportingContentKeys?:TargetContentKey[]; transferSourceExerciseId?:string; transferRuleId?:string; mistakeCategory?:MistakeCategory; presentationVariant?:ExercisePresentation; variantOfExerciseId?:string; wordBank?:string[]; learningPhase?:LearningPhase; prerequisites?:TargetContentKey[] }
export type Lesson = { id:number; title:string; subtitle:string; minutes:number; focus:string[]; grammar:{title:string;body:string;examples:string[]}; communicativeGoal?:string; vocabularyGoals?:string[]; grammarGoals?:string[]; transferGoals?:string[]; prerequisites?:TargetContentKey[] }
export type ConversationTurn = { speaker:'Tutor'|'Nutzer'; sl:string; de?:string }
export type Conversation = { id:string; title:string; lesson:number; turns:ConversationTurn[] }
export type Mistake = { key:string; count:number; lastSeen:number; category?:MistakeCategory }
export type ReviewItem = { key:string; status:LearningStatus; dueAt:number; intervalIndex:number; updatedAt?:number; lastReviewedAt?:number; successfulReviews?:number; consecutiveCorrect?:number }
export type AttemptSignal = { exerciseId:string; correct:boolean; responseMs:number; hintsUsed:number; hintTypes?:HintType[]; occurredAt:number; vocabularyIds?:string[]; grammarRuleIds?:string[]; skillTargets?:SkillTarget[]; activeProduction?:boolean; mistakeCategory?:MistakeCategory }
export type TransferItem = { sourceExerciseId:string; grammarRuleId:string; dueAfter:number; createdAt:number; failedTransfers?:number }
export type MasteryItem = { key:string; kind:'vocabulary'|'grammar'|'skill'|'verb'; score:number; attempts:number; correct:number; activeCorrect?:number; passiveCorrect?:number; hintsUsed?:number; slowCorrect?:number; lastSeen:number; dimensions?:Partial<Record<MasteryDimension,number>> }
export type LearnerPreferences = { onboardingCompleted:boolean; nativeLanguage:'de'; targetLevel:'A1'|'A2'|'B1'|'B2'; dailyGoalMinutes:5|10|15|20|30; pace:'ruhig'|'normal'|'intensiv'; audioSpeed:'langsam'|'normal' }
export type ExamHistoryItem = { sessionId:string; kind:'checkpoint'|'final'|'major'; lessonId:number; exerciseIds:string[]; firstExerciseIds:string[]; promptSignatures:string[]; vocabularyIds:string[]; grammarRuleIds:string[]; targetContentKeys?:TargetContentKey[]; completedAt:number }
export type UserProgress = { completedLessons:number[]; streak:number; introducedWords:string[]; introducedGrammarRules:string[]; introducedVerbForms:string[]; wordsLearned:string[]; secureWords:string[]; mistakes:Mistake[]; reviews:ReviewItem[]; speakingMinutes:number; listeningMinutes:number; mastery:Record<string,MasteryItem>; recentAttempts:AttemptSignal[]; transferQueue:TransferItem[]; examHistory?:ExamHistoryItem[]; preferences:LearnerPreferences; updatedAt:number; preferencesUpdatedAt:number; resetAt?:number; lastSyncedAt?:number; contentVersion?:number }
