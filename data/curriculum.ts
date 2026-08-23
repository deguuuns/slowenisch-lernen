import { a1VocabularyExpansion } from '@/data/a1-vocabulary-expansion'
import { lesson6, lesson6Conversation, lesson6Exercises, lesson6Sentences } from '@/data/lesson-6-shopping'
import {
  conversations as seedConversations,
  exercises as seedExercises,
  lessons as seedLessons,
  sentences as seedSentences,
  vocabulary as seedVocabulary,
} from '@/data/seed'

export const vocabulary = [...seedVocabulary, ...a1VocabularyExpansion]
export const lessons = [...seedLessons, lesson6]
export const sentences = [...seedSentences, ...lesson6Sentences]
export const exercises = [...seedExercises, ...lesson6Exercises]
export const conversations = [...seedConversations, lesson6Conversation]

export const releasedLessonIds = lessons.map(lesson => lesson.id)
export const releasedVocabulary = vocabulary.filter(word => releasedLessonIds.includes(word.lesson))
