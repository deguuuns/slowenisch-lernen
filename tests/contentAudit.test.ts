import test from 'node:test'
import assert from 'node:assert/strict'
import { beginnerExercises } from '../data/beginnerContent'
import { beginnerReinforcementExercises } from '../data/beginnerReinforcement'
import { exercises as diverseExercises } from '../data/diverseContent'
import { visualVocabularyExercises } from '../data/visualVocabulary'
import { auditAdaptiveContent, auditErrors } from '../lib/contentAudit'

const modernBeginnerPool = [...beginnerExercises, ...beginnerReinforcementExercises, ...visualVocabularyExercises]

test('modern beginner curriculum has no hard content-audit errors', () => {
  const errors = auditErrors(modernBeginnerPool)
  assert.deepEqual(errors, [])
})

test('every modern introduction contains a German meaning', () => {
  const intros = modernBeginnerPool.filter(item => item.type === 'introduce')
  assert.ok(intros.length > 0)
  assert.ok(intros.every(item => !!item.introSl?.trim() && !!item.introDe?.trim()))
})

test('legacy pool audit detects unsafe production instead of silently treating it as modern content', () => {
  const issues = auditAdaptiveContent(diverseExercises)
  const helloLegacy = issues.find(issue => issue.exerciseId === 'e01' && issue.code === 'unsafe-production')
  assert.ok(helloLegacy)
})
