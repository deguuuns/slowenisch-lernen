import test from 'node:test'
import assert from 'node:assert/strict'
import { chooseSlovenianVoice, isSlovenianVoice } from '../lib/slovenianTts'

const voice = (name: string, lang: string) => ({ name, lang, localService: true })

test('exact sl-SI voice is preferred', () => {
  const result = chooseSlovenianVoice([
    voice('German', 'de-DE'),
    voice('Slovene Generic', 'sl'),
    voice('Slovene Slovenia', 'sl-SI'),
  ])
  assert.equal(result.voice?.name, 'Slovene Slovenia')
  assert.equal(result.exactLocale, true)
  assert.equal(result.reason, 'exact-sl-si')
})

test('another Slovenian locale can be used only as Slovenian fallback', () => {
  const result = chooseSlovenianVoice([
    voice('English', 'en-US'),
    voice('Slovene', 'sl'),
  ])
  assert.equal(result.voice?.name, 'Slovene')
  assert.equal(result.exactLocale, false)
  assert.equal(result.reason, 'slovenian-fallback')
})

test('German or English voices are never used as Slovenian fallback', () => {
  const result = chooseSlovenianVoice([
    voice('German', 'de-DE'),
    voice('English', 'en-US'),
  ])
  assert.equal(result.voice, null)
  assert.equal(result.reason, 'no-slovenian-voice')
})

test('Slovenian language identifiers are detected robustly', () => {
  assert.equal(isSlovenianVoice(voice('A', 'sl-SI')), true)
  assert.equal(isSlovenianVoice(voice('B', 'sl_si')), true)
  assert.equal(isSlovenianVoice(voice('C', 'sl')), true)
  assert.equal(isSlovenianVoice(voice('D', 'sk-SK')), false)
})
