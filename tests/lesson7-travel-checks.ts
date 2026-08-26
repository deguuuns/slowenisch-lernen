import assert from 'node:assert/strict'
import { exercises, lessons, releasedVocabulary, sentences } from '@/data/curriculum'
import { validateExerciseSet } from '@/lib/exercise-integrity'

const lesson = lessons.find(item => item.id === 7)
assert.ok(lesson, 'Lektion 7 muss im freigegebenen Curriculum enthalten sein')
assert.equal(lesson?.title, 'Na poti')

const words = releasedVocabulary.filter(item => item.lesson === 7)
const legacyIds = Array.from({length:20}, (_,index) => `v${141 + index}`)
assert.ok(words.length >= 20, 'Lektion 7 muss mindestens die 20 kuratierten Reisewörter erhalten')
for (const id of legacyIds) assert.ok(words.some(item=>item.id===id), `Lektion 7 muss Legacy-Wort ${id} für gespeicherten Fortschritt erhalten`)
assert.ok(words.filter(item=>!legacyIds.includes(item.id)).every(item=>item.cefrLevel==='A1'&&item.curriculumUnit==='A1.7 Unterwegs'), 'Neue Wörter in Lektion 7 müssen definierte A1.7-Erweiterungen sein')

const lessonExercises = exercises.filter(item => item.lesson === 7)
assert.ok(lessonExercises.length >= 10, 'Lektion 7 braucht ausreichend kuratierte Übungen')
assert.equal(validateExerciseSet(lessonExercises, releasedVocabulary).length, 0, 'Lektion-7-Übungen müssen die Integritätsprüfung bestehen')
assert.ok(lessonExercises.some(item => item.type === 'choice'), 'Lektion 7 braucht Erkennungsaufgaben')
assert.ok(lessonExercises.some(item => item.type === 'free'), 'Lektion 7 braucht aktive freie Produktion')
assert.ok(lessonExercises.some(item => item.grammarRuleIds?.includes('accusative-feminine-a-o')), 'Bekannte Grammatik soll in Lektion 7 transferiert werden')

const lessonSentences = sentences.filter(item => item.lesson === 7)
assert.ok(lessonSentences.length >= 10, 'Lektion 7 braucht genügend natürliche Beispielsätze')

for (const exercise of lessonExercises) {
  for (const id of exercise.vocabularyIds || []) {
    const word = releasedVocabulary.find(item => item.id === id)
    assert.ok(word, `${exercise.id} referenziert unbekannten Wortschatz ${id}`)
    assert.ok((word?.lesson || 0) <= 7, `${exercise.id} darf keinen zukünftigen Wortschatz verwenden`)
  }
}

console.log(`Lesson 7 travel checks passed: ${words.length} words, ${lessonExercises.length} exercises, ${lessonSentences.length} sentences.`)
