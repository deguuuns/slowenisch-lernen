import { lesson6, lesson6Conversation, lesson6Exercises, lesson6Sentences } from '@/data/lesson-6-shopping'
import { lesson7, lesson7Conversation, lesson7Exercises, lesson7Sentences } from '@/data/lesson-7-travel'
import { lesson8, lesson8Conversation, lesson8Exercises, lesson8Sentences } from '@/data/lesson-8-home-help'
import { lesson1AtomicExercises, lesson1AtomicSentences } from '@/data/lesson-1-atomic'
import {
  conversations as seedConversations,
  exercises as seedExercises,
  lessons as seedLessons,
  sentences as seedSentences,
} from '@/data/seed'
import { vocabulary } from '@/data/vocabulary-catalog'

export { vocabulary }
export const lessons = [...seedLessons, lesson6, lesson7, lesson8]
export const sentences = [...seedSentences, ...lesson1AtomicSentences, ...lesson6Sentences, ...lesson7Sentences, ...lesson8Sentences]
export const exercises = [...seedExercises, ...lesson1AtomicExercises, ...lesson6Exercises, ...lesson7Exercises, ...lesson8Exercises]
export const conversations = [...seedConversations, lesson6Conversation, lesson7Conversation, lesson8Conversation]

export const releasedLessonIds = lessons.map(lesson => lesson.id)
export const releasedVocabulary = vocabulary.filter(word => releasedLessonIds.includes(word.lesson))
