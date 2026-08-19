import { normalizeAnswerText, tokenizeNormalizedAnswer } from './normalizer'
import { detectSloveneGrammarIssues } from './slovene'
import { EvaluationRequest, EvaluationResult } from './types'

function levenshtein(a: string, b: string) {
  const rows = a.length + 1
  const cols = b.length + 1
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0))

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  return matrix[a.length][b.length]
}

function isMinorTypo(input: string, expected: string) {
  if (!input || !expected) return false
  if (input.includes(' ') !== expected.includes(' ')) return false

  const distance = levenshtein(input, expected)
  const maxLength = Math.max(input.length, expected.length)
  return distance === 1 && maxLength >= 4
}

export function evaluateAnswer(request: EvaluationRequest): EvaluationResult {
  const locale = request.locale ?? 'sl-SI'
  const normalizedInput = normalizeAnswerText(request.input, { locale })
  const normalizedExpected = normalizeAnswerText(request.expected, { locale })
  const candidates = [request.expected, ...(request.alternatives ?? [])]

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeAnswerText(candidate, { locale })
    if (normalizedInput === normalizedCandidate) {
      return {
        classification: candidate === request.expected ? 'CORRECT' : 'ACCEPTABLE_VARIANT',
        isCorrect: true,
        normalizedInput,
        normalizedExpected,
        matchedAnswer: candidate,
        issues: []
      }
    }
  }

  const grammarIssues = detectSloveneGrammarIssues(request.input, request.expected)
  if (grammarIssues.length > 0) {
    return {
      classification: 'GRAMMAR_ERROR',
      isCorrect: false,
      normalizedInput,
      normalizedExpected,
      issues: grammarIssues,
      explanation: `${grammarIssues[0].message} Richtig ist: ${request.expected}`
    }
  }

  const inputTokens = tokenizeNormalizedAnswer(request.input, locale)
  const expectedTokens = tokenizeNormalizedAnswer(request.expected, locale)

  if (inputTokens.length < expectedTokens.length && inputTokens.every((token, i) => token === expectedTokens[i])) {
    return {
      classification: 'INCOMPLETE',
      isCorrect: false,
      normalizedInput,
      normalizedExpected,
      issues: [],
      explanation: `Die Antwort ist noch unvollständig. Richtig ist: ${request.expected}`
    }
  }

  if (isMinorTypo(normalizedInput, normalizedExpected)) {
    return {
      classification: 'MINOR_TYPO',
      isCorrect: false,
      normalizedInput,
      normalizedExpected,
      issues: [],
      explanation: `Fast richtig – prüfe die Schreibweise. Richtig ist: ${request.expected}`
    }
  }

  return {
    classification: normalizedInput ? 'WRONG_MEANING' : 'UNRECOGNIZED',
    isCorrect: false,
    normalizedInput,
    normalizedExpected,
    issues: [],
    explanation: normalizedInput ? `Richtig ist: ${request.expected}` : 'Ich konnte keine Antwort erkennen.'
  }
}

export * from './types'
export { normalizeAnswerText } from './normalizer'
