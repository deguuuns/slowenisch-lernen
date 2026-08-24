import assert from 'node:assert/strict'
import { conversations, exercises, lessons, releasedVocabulary, sentences } from '@/data/curriculum'
import { validateExerciseSet } from '@/lib/exercise-integrity'

const lesson = lessons.find(item => item.id === 8)
assert.ok(lesson, 'Lektion 8 muss im freigegebenen Curriculum enthalten sein')
assert.equal(lesson?.title, 'Doma in pomoč')

const words = releasedVocabulary.filter(item => item.lesson === 8)
assert.equal(words.length, 20, 'Lektion 8 muss genau die 20 vorbereiteten Wörter v161-v180 freischalten')
assert.deepEqual(words.map(item => item.id), Array.from({length:20}, (_,index) => `v${161 + index}`))

const lessonExercises = exercises.filter(item => item.lesson === 8)
assert.ok(lessonExercises.length >= 10, 'Lektion 8 braucht ausreichend kuratierte Übungen')
assert.equal(validateExerciseSet(lessonExercises, releasedVocabulary).length, 0, 'Lektion-8-Übungen müssen die Integritätsprüfung bestehen')
assert.ok(lessonExercises.some(item => item.type === 'choice'), 'Lektion 8 braucht Erkennungsaufgaben')
assert.ok(lessonExercises.some(item => item.type === 'free'), 'Lektion 8 braucht aktive freie Produktion')
assert.ok(lessonExercises.some(item => item.vocabularyIds?.includes('v176')), 'Grundlegende Hilfe muss aktiv geübt werden')
assert.ok(lessonExercises.some(item => item.vocabularyIds?.includes('v178')), 'Apothekenwortschatz muss aktiv geübt werden')

const lessonSentences = sentences.filter(item => item.lesson === 8)
assert.ok(lessonSentences.length >= 10, 'Lektion 8 braucht genügend natürliche Beispielsätze')
assert.ok(conversations.some(item => item.lesson === 8), 'Lektion 8 braucht einen kuratierten Dialog')

for (const exercise of lessonExercises) {
  for (const id of exercise.vocabularyIds || []) {
    const word = releasedVocabulary.find(item => item.id === id)
    assert.ok(word, `${exercise.id} referenziert unbekannten Wortschatz ${id}`)
    assert.ok((word?.lesson || 0) <= 8, `${exercise.id} darf keinen zukünftigen Wortschatz verwenden`)
  }
}

assert.equal(releasedVocabulary.filter(item => item.id >= 'v181').length, 0, 'Phase 20 darf keinen nicht vorbereiteten Wortschatz freischalten')

console.log(`Lesson 8 home/help checks passed: ${words.length} words, ${lessonExercises.length} exercises, ${lessonSentences.length} sentences.`)
