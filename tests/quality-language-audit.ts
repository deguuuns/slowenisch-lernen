import assert from 'node:assert/strict'
import { conversations, exercises, lessons, releasedVocabulary, sentences, vocabulary } from '../data/curriculum'

const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
const asRecord = (value: unknown) => value && typeof value === 'object' ? value as Record<string, unknown> : {}
const unique = (values: string[], label: string) => {
  const seen = new Set<string>()
  for (const value of values) {
    assert.ok(value, `${label} must not contain empty identifiers`)
    assert.ok(!seen.has(value), `Duplicate ${label}: ${value}`)
    seen.add(value)
  }
}

unique(lessons.map(item => String(asRecord(item).id ?? '')), 'lesson id')
unique(vocabulary.map(item => String(asRecord(item).id ?? '')), 'vocabulary id')
unique(exercises.map(item => String(asRecord(item).id ?? '')), 'exercise id')
unique(sentences.map(item => String(asRecord(item).id ?? '')), 'sentence id')

const lessonIds = new Set(lessons.map(item => Number(asRecord(item).id)))
for (const word of vocabulary) {
  const row = asRecord(word)
  assert.ok(text(row.sl), `${row.id}: Slovene vocabulary form is empty`)
  assert.ok(text(row.de), `${row.id}: German vocabulary gloss is empty`)
  assert.ok(lessonIds.has(Number(row.lesson)), `${row.id}: unknown lesson ${String(row.lesson)}`)
}

assert.equal(releasedVocabulary.length, vocabulary.length, 'Every curriculum vocabulary item must belong to a released lesson')

for (const exercise of exercises) {
  const row = asRecord(exercise)
  assert.ok(text(row.prompt), `${row.id}: exercise prompt is empty`)
  assert.ok(text(row.answer), `${row.id}: exercise answer is empty`)
  assert.ok(lessonIds.has(Number(row.lesson)), `${row.id}: exercise points to unknown lesson ${String(row.lesson)}`)

  const accepted = Array.isArray(row.acceptedAnswers) ? row.acceptedAnswers : []
  for (const candidate of accepted) {
    assert.ok(text(candidate), `${row.id}: accepted answer must not be blank`)
  }
}

for (const sentence of sentences) {
  const row = asRecord(sentence)
  assert.ok(text(row.sl), `${row.id}: Slovene sentence is empty`)
  assert.ok(text(row.de), `${row.id}: German sentence translation is empty`)
}

for (const conversation of conversations) {
  const row = asRecord(conversation)
  const id = String(row.id ?? 'conversation')
  const turns = Array.isArray(row.turns) ? row.turns : Array.isArray(row.steps) ? row.steps : []
  assert.ok(turns.length > 0, `${id}: conversation has no turns`)
  for (const turn of turns) {
    const turnRow = asRecord(turn)
    const visibleText = text(turnRow.text) || text(turnRow.prompt) || text(turnRow.sl)
    assert.ok(visibleText, `${id}: conversation contains an empty turn`)
  }
}

// Critical Slovenian distinctions that previously caused false positives must stay strict.
const dvaBrata = exercises.filter(item => text(asRecord(item).answer).toLowerCase().includes('dva brata'))
for (const exercise of dvaBrata) {
  const accepted = Array.isArray(asRecord(exercise).acceptedAnswers) ? asRecord(exercise).acceptedAnswers as unknown[] : []
  assert.ok(!accepted.some(value => text(value).toLowerCase().includes('dve brata')), `${asRecord(exercise).id}: dve brata must never be accepted`)
}

console.log(`Quality/language audit passed: ${lessons.length} lessons, ${vocabulary.length} words, ${exercises.length} exercises, ${sentences.length} sentences, ${conversations.length} conversations`)
