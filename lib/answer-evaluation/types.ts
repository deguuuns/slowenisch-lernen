export type AnswerClassification =
  | 'CORRECT'
  | 'ACCEPTABLE_VARIANT'
  | 'MINOR_TYPO'
  | 'GRAMMAR_ERROR'
  | 'WRONG_MEANING'
  | 'INCOMPLETE'
  | 'UNRECOGNIZED'

export type GrammarFeature =
  | 'gender'
  | 'number'
  | 'case'
  | 'declension'
  | 'conjugation'
  | 'person'
  | 'tense'
  | 'pronoun'
  | 'preposition'
  | 'word-order'
  | 'adjective-inflection'
  | 'numeral'

export type GrammarIssue = {
  feature: GrammarFeature
  token?: string
  expected?: string
  message: string
}

export type EvaluationRequest = {
  input: string
  expected: string
  alternatives?: string[]
  locale?: string
}

export type EvaluationResult = {
  classification: AnswerClassification
  isCorrect: boolean
  normalizedInput: string
  normalizedExpected: string
  matchedAnswer?: string
  issues: GrammarIssue[]
  explanation?: string
}
