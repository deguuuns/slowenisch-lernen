import assert from 'node:assert/strict'
import { vocabulary } from '@/data/seed'
import {
  singularVerbIntroFromRegistry,
  verbById,
  verbByInfinitive,
  verbFormFor,
  vocabularyVerbFormRequirements,
} from '@/lib/content-registry'
import { isVerbFormVocabularyId, singularVerbIntroForVocabulary } from '@/lib/curriculum-access'

for (const [vocabularyId, requirement] of Object.entries(vocabularyVerbFormRequirements)) {
  const word = vocabulary.find(item => item.id === vocabularyId)
  assert.ok(word, `Registered verb-form vocabulary id ${vocabularyId} must exist in seed vocabulary`)
  assert.equal(word?.partOfSpeech, 'Verb', `${vocabularyId} must remain a Verb vocabulary item`)
  assert.ok(verbById(requirement.verbId), `${vocabularyId} references missing verb ${requirement.verbId}`)
  assert.ok(verbFormFor(requirement), `${vocabularyId} references missing canonical form ${requirement.verbId}:${requirement.number}:${requirement.person}`)
  assert.equal(isVerbFormVocabularyId(vocabularyId), true, `${vocabularyId} must be recognized through the canonical registry`)
}

for (const verb of ['biti','delati','iti','imeti','živeti','začeti','končati','peljati-se','jesti','piti','želeti']) {
  const entry = verbById(verb)
  assert.ok(entry, `Canonical verb ${verb} must exist`)
  assert.equal(entry?.forms.length, 9, `${verb} must expose singular, dual and plural for all three persons`)
  assert.equal(entry?.forms.filter(form => form.number === 'singular').length, 3, `${verb} must expose three singular forms`)
  assert.equal(entry?.forms.filter(form => form.number === 'dual').length, 3, `${verb} must expose three dual forms`)
  assert.equal(entry?.forms.filter(form => form.number === 'plural').length, 3, `${verb} must expose three plural forms`)
  assert.ok(singularVerbIntroFromRegistry(verb), `${verb} must provide a lesson-compatible singular introduction`)
}

const infinitives = vocabulary.filter(word => word.partOfSpeech === 'Verb' && !isVerbFormVocabularyId(word.id))
for (const word of infinitives) {
  const canonical = verbByInfinitive(word.sl)
  if (!canonical) continue
  assert.equal(canonical.infinitive, word.sl, `Infinitive ${word.sl} must resolve to itself in the canonical registry`)
}

const intro = singularVerbIntroForVocabulary(['v024','v025'])
assert.equal(intro.length, 1, 'Multiple vocabulary forms of iti must yield one verb introduction')
assert.equal(intro[0]?.verbId, 'iti')
assert.deepEqual(intro[0]?.forms.map(form => form.formSl), ['grem','greš','gre'])

console.log(`content-registry-checks: ${Object.keys(vocabularyVerbFormRequirements).length} legacy form bindings and 11 canonical verbs verified`)
