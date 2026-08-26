import assert from 'node:assert/strict'
import { exercises, lessons, releasedVocabulary, sentences } from '@/data/curriculum'
import { validateExerciseSet } from '@/lib/exercise-integrity'

const lesson = lessons.find(item => item.id === 6)
assert.ok(lesson, 'Lektion 6 muss im freigegebenen Curriculum enthalten sein')
assert.equal(lesson?.title, 'Nakupovanje')

const words = releasedVocabulary.filter(item => item.lesson === 6)
const legacyIds = Array.from({length:20}, (_,index) => `v${121 + index}`)
const v2Words = words.filter(item => /^v\d+$/.test(item.id) && Number(item.id.slice(1)) >= 181 && Number(item.id.slice(1)) <= 230)
assert.ok(words.length >= 20, 'Lektion 6 muss mindestens die 20 kuratierten Einkaufswörter erhalten')
for (const id of legacyIds) assert.ok(words.some(item=>item.id===id), `Lektion 6 muss Legacy-Wort ${id} für gespeicherten Fortschritt erhalten`)
assert.ok(v2Words.every(item=>item.cefrLevel==='A1'&&item.curriculumUnit==='A1.6 Einkaufen und Kleidung'), 'Neue V2-Wörter in Lektion 6 müssen definierte A1.6-Erweiterungen sein')

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
