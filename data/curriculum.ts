import { a1VocabularyExpansion } from '@/data/a1-vocabulary-expansion'
import { lesson6, lesson6Conversation, lesson6Exercises, lesson6Sentences } from '@/data/lesson-6-shopping'
import { lesson7, lesson7Conversation, lesson7Exercises, lesson7Sentences } from '@/data/lesson-7-travel'
import { lesson8, lesson8Conversation, lesson8Exercises, lesson8Sentences } from '@/data/lesson-8-home-help'
import {
  conversations as seedConversations,
  exercises as seedExercises,
  lessons as seedLessons,
  sentences as seedSentences,
  vocabulary as seedVocabulary,
} from '@/data/seed'

export const vocabulary = [...seedVocabulary, ...a1VocabularyExpansion]
export const lessons = [...seedLessons, lesson6, lesson7, lesson8]
export const sentences = [...seedSentences, ...lesson6Sentences, ...lesson7Sentences, ...lesson8Sentences]
export const exercises = [...seedExercises, ...lesson6Exercises, ...lesson7Exercises, ...lesson8Exercises]
export const conversations = [...seedConversations, lesson6Conversation, lesson7Conversation, lesson8Conversation]

export const releasedLessonIds = lessons.map(lesson => lesson.id)
export const releasedVocabulary = vocabulary.filter(word => releasedLessonIds.includes(word.lesson))
