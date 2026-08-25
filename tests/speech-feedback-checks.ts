import assert from 'node:assert/strict'
import { evaluateAnswer } from '../lib/answer-evaluation'
import { buildSpeechFeedback, speechTranscriptSimilarity } from '../lib/speech-feedback'

assert.equal(speechTranscriptSimilarity('Dober dan!', 'Dober dan.'), 1)
assert.ok(speechTranscriptSimilarity('Imam dva brata', 'Imam dva brata.') > 0.95)
assert.ok(speechTranscriptSimilarity('Imam dve brata', 'Imam dva brata.') < 0.95)

const correct = evaluateAnswer({ input: 'Imam dva brata.', expected: 'Imam dva brata.' })
const strong = buildSpeechFeedback({ actual: 'Imam dva brata.', expected: 'Imam dva brata.', evaluation: correct, recognitionConfidence: 0.9 })
assert.equal(strong.contentCorrect, true)
assert.equal(strong.deliveryBand, 'strong')

const grammar = evaluateAnswer({ input: 'Imam dve brata.', expected: 'Imam dva brata.' })
const grammarFeedback = buildSpeechFeedback({ actual: 'Imam dve brata.', expected: 'Imam dva brata.', evaluation: grammar, recognitionConfidence: 0.9 })
assert.equal(grammarFeedback.contentCorrect, false)

const uncertainSpeech = buildSpeechFeedback({ actual: 'imam brata', expected: 'Imam dva brata.', evaluation: correct, recognitionConfidence: 0.2 })
assert.equal(uncertainSpeech.contentCorrect, true)
assert.notEqual(uncertainSpeech.deliveryBand, 'strong')

console.log('speech feedback checks passed')
