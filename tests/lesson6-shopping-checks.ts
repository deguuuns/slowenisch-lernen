import assert from 'node:assert/strict'
import { exercises, lessons, releasedVocabulary, sentences } from '@/data/curriculum'
import { validateExerciseSet } from '@/lib/exercise-integrity'

const lesson = lessons.find(item => item.id === 6)
assert.ok(lesson, 'Lektion 6 muss im freigegebenen Curriculum enthalten sein')
assert.equal(lesson?.title, 'Nakupovanje')

const words = releasedVocabulary.filter(item => item.lesson === 6)
assert.equal(words.length, 20, 'Lektion 6 muss genau die 20 vorbereiteten Einkaufswörter freischalten')
assert.deepEqual(words.map(item => item.id), Array.from({length:20}, (_,index) => `v${121 + index}`))

const lessonExercises = exercises.filter(item => item.lesson === 6)
assert.ok(lessonExercises.length >= 10, 'Lektion 6 braucht ausreichend kuratierte Übungen')
assert.equal(validateExerciseSet(lessonExercises, releasedVocabulary).length, 0, 'Lektion-6-Übungen müssen die Integritätsprüfung bestehen')
assert.ok(lessonExercises.some(item => item.type === 'choice'), 'Lektion 6 braucht Erkennungsaufgaben')
assert.ok(lessonExercises.some(item => item.type === 'free'), 'Lektion 6 braucht aktive freie Produktion')
assert.ok(lessonExercises.some(item => item.grammarRuleIds?.includes('accusative-feminine-a-o')), 'Bekannte Grammatik soll in Lektion 6 transferiert werden')

const lessonSentences = sentences.filter(item => item.lesson === 6)
assert.ok(lessonSentences.length >= 10, 'Lektion 6 braucht genügend natürliche Beispielsätze')

for (const exercise of lessonExercises) {
  for (const id of exercise.vocabularyIds || []) {
    const word = releasedVocabulary.find(item => item.id === id)
    assert.ok(word, `${exercise.id} referenziert unbekannten Wortschatz ${id}`)
    assert.ok((word?.lesson || 0) <= 6, `${exercise.id} darf keinen zukünftigen Wortschatz verwenden`)
  }
}

console.log(`Lesson 6 shopping checks passed: ${words.length} words, ${lessonExercises.length} exercises, ${lessonSentences.length} sentences.`)
