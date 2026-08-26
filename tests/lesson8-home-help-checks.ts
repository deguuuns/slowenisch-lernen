import assert from 'node:assert/strict'
import { conversations, exercises, lessons, releasedVocabulary, sentences } from '@/data/curriculum'
import { validateExerciseSet } from '@/lib/exercise-integrity'

const lesson = lessons.find(item => item.id === 8)
assert.ok(lesson, 'Lektion 8 muss im freigegebenen Curriculum enthalten sein')
assert.equal(lesson?.title, 'Doma in pomoč')

const words = releasedVocabulary.filter(item => item.lesson === 8)
const legacyIds = Array.from({length:20}, (_,index) => `v${161 + index}`)
const v2WordsForLesson = words.filter(item => /^v\d+$/.test(item.id) && Number(item.id.slice(1)) >= 181 && Number(item.id.slice(1)) <= 230)
assert.ok(words.length >= 20, 'Lektion 8 muss mindestens die 20 kuratierten Wörter v161-v180 erhalten')
for (const id of legacyIds) assert.ok(words.some(item=>item.id===id), `Lektion 8 muss Legacy-Wort ${id} für gespeicherten Fortschritt erhalten`)
assert.ok(v2WordsForLesson.every(item=>item.cefrLevel==='A1'&&item.curriculumUnit==='A1.8 Wohnen, Wetter und Hilfe'), 'Neue V2-Wörter in Lektion 8 müssen definierte A1.8-Erweiterungen sein')

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

const v2Words=releasedVocabulary.filter(item=>/^v\d+$/.test(item.id)&&Number(item.id.slice(1))>=181&&Number(item.id.slice(1))<=230)
assert.equal(v2Words.length,50,'Curriculum V2 muss genau die definierte neue A1-ID-Serie v181-v230 enthalten')
assert.ok(v2Words.every(item=>item.cefrLevel==='A1'&&item.curriculumUnit),'Jede V2-Erweiterung braucht CEFR- und Curriculum-Metadaten')

console.log(`Lesson 8 home/help checks passed: ${words.length} words, ${lessonExercises.length} exercises, ${lessonSentences.length} sentences.`)
