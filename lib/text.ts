import { evaluateAnswer, normalizeAnswerText } from './answer-evaluation'

/**
 * Backwards-compatible facade for the current UI.
 * New features should use evaluateAnswer directly so they can surface the
 * classification and grammar explanation instead of only true/false.
 */
export function normalizeAnswer(value: string) {
  return normalizeAnswerText(value)
}

export function isEquivalent(input: string, expected: string, alternatives: string[] = []) {
  return evaluateAnswer({ input, expected, alternatives }).isCorrect
}
