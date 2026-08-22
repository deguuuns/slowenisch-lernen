import { AnswerClassification, EvaluationResult, GrammarFeature } from '@/lib/answer-evaluation'
import { MistakeCategory, VerbNumber } from '@/types'

const grammarFeatureCategory: Partial<Record<GrammarFeature, MistakeCategory>> = {
  case: 'case-error',
  gender: 'gender-error',
  number: 'number-error',
  conjugation: 'conjugation-error',
  person: 'verb-person-error',
  preposition: 'preposition-error',
  'word-order': 'word-order-error',
}

export function mistakeCategoryFromEvaluation(result: EvaluationResult): MistakeCategory | undefined {
  if (result.isCorrect) return undefined
  const feature = result.issues[0]?.feature
  if (feature && grammarFeatureCategory[feature]) return grammarFeatureCategory[feature]
  const byClassification: Partial<Record<AnswerClassification, MistakeCategory>> = {
    MINOR_TYPO: 'spelling-error',
    INCOMPLETE: 'incomplete-answer',
    WRONG_MEANING: 'wrong-meaning',
    UNRECOGNIZED: 'other',
    GRAMMAR_ERROR: 'other',
  }
  return byClassification[result.classification] || 'other'
}

export function conjugationMistakeCategory(expectedNumber: VerbNumber, actualNumber?: VerbNumber): MistakeCategory {
  if (actualNumber === 'dual' || expectedNumber === 'dual') return 'dual-error'
  if (actualNumber === 'plural' || expectedNumber === 'plural') return 'plural-error'
  return 'verb-person-error'
}

export function inferMistakeCategoryFromExerciseId(key: string): MistakeCategory {
  const tagged = key.match(/:mistake:([a-z-]+)$/)?.[1] as MistakeCategory | undefined
  if (tagged) return tagged
  if (key.startsWith('conj:')) return 'verb-person-error'
  if (key.startsWith('vocab-test:')) return 'vocabulary-recall'
  return 'other'
}
