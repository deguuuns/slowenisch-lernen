import { lesson6, lesson6Conversation, lesson6Exercises, lesson6Sentences } from '@/data/lesson-6-shopping'
import { lesson7, lesson7Conversation, lesson7Exercises, lesson7Sentences } from '@/data/lesson-7-travel'
import { lesson8, lesson8Conversation, lesson8Exercises, lesson8Sentences } from '@/data/lesson-8-home-help'
import { lesson1AtomicExercises, lesson1AtomicSentences } from '@/data/lesson-1-atomic'
import { conversations as seedConversations, exercises as seedExercises, lessons as seedLessons, sentences as seedSentences } from '@/data/seed'
import { vocabulary } from '@/data/vocabulary-catalog'
import type { Lesson } from '@/types'

export { vocabulary }

const lessonGoals:Record<number,Pick<Lesson,'communicativeGoal'|'vocabularyGoals'|'grammarGoals'|'transferGoals'>>={
  1:{communicativeGoal:'Begrüßen, nach dem Befinden fragen und erste einfache Ortsfragen verstehen.',vocabularyGoals:['Begrüßung','kako','biti und benötigte Personenformen','erste Fragewörter'],grammarGoals:['Verbform zu Person zuordnen','kako von kakšen unterscheiden','erste Orts- und Richtungsfragen'],transferGoals:['Živjo! Kako si? aus bekannten Bausteinen bilden','eine kurze erste Begegnung verstehen']},
  2:{communicativeGoal:'Über sich und die eigene Familie sprechen.',vocabularyGoals:['Familie','haben','Zahlen','wohnen'],grammarGoals:['Akkusativ bei Familienwörtern','Dual bei genau zwei','imeti und Verneinung'],transferGoals:['Familienangaben selbst bilden','nach Familie und Wohnort fragen']},
  3:{communicativeGoal:'Den eigenen Tagesablauf und Arbeitszeiten beschreiben.',vocabularyGoals:['Arbeit','Tageszeiten','Uhrzeit','fahren'],grammarGoals:['Zeitangaben mit ob','doma und domov','wichtige Präsensformen'],transferGoals:['einen einfachen Tagesablauf erzählen']},
  4:{communicativeGoal:'Über Essen, Trinken und eigene Bedürfnisse sprechen.',vocabularyGoals:['Essen','Getränke','Hunger und Durst'],grammarGoals:['Akkusativ feminin -a zu -o','jesti und piti'],transferGoals:['einfache Vorlieben und Bestellungen bilden']},
  5:{communicativeGoal:'Im Restaurant bestellen, nachfragen und bezahlen.',vocabularyGoals:['Restaurant','Höflichkeit','Bestellen und Bezahlen'],grammarGoals:['prosim','lahko','Mengenangaben'],transferGoals:['einen kurzen Restaurantdialog bewältigen']},
  6:{communicativeGoal:'Beim Einkaufen nach Dingen, Größen und Preisen fragen.',vocabularyGoals:['Geschäfte','Kleidung','Farben','Bezahlen'],grammarGoals:['bekannte Objektformen übertragen'],transferGoals:['eine einfache Einkaufssituation bewältigen']},
  7:{communicativeGoal:'Unterwegs nach dem Weg und Reiseinformationen fragen.',vocabularyGoals:['Verkehrsmittel','Fahrkarten','Richtungen','Zeiten'],grammarGoals:['Ort und Richtung unterscheiden'],transferGoals:['einen Weg verstehen und nach einer Verbindung fragen']},
  8:{communicativeGoal:'Wohnung, Wetter und grundlegende gesundheitliche Bedürfnisse ausdrücken.',vocabularyGoals:['Wohnen','Wetter','Hilfe und Körper'],grammarGoals:['bekannte Orts- und Zustandsmuster übertragen'],transferGoals:['einfache Hilfe erbitten und einen Zustand beschreiben']},
}

export const lessons = [...seedLessons,lesson6,lesson7,lesson8].map(lesson=>({...lesson,...lessonGoals[lesson.id]}))
export const sentences = [...seedSentences,...lesson1AtomicSentences,...lesson6Sentences,...lesson7Sentences,...lesson8Sentences]
export const exercises = [...seedExercises,...lesson1AtomicExercises,...lesson6Exercises,...lesson7Exercises,...lesson8Exercises]
export const conversations = [...seedConversations,lesson6Conversation,lesson7Conversation,lesson8Conversation]

export const releasedLessonIds=lessons.map(lesson=>lesson.id)
export const releasedVocabulary=vocabulary.filter(word=>releasedLessonIds.includes(word.lesson))
