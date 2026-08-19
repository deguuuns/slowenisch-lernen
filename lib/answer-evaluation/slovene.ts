import { tokenizeNormalizedAnswer } from './normalizer'
import { GrammarIssue } from './types'

const numeralGenderPairs: Record<string, string> = {
  dva: 'dve',
  dve: 'dva'
}

/**
 * Small deterministic Slovene rule layer.
 * This is intentionally narrow: rules are added only when we can explain
 * them reliably and cover them with regression cases.
 */
export function detectSloveneGrammarIssues(input: string, expected: string): GrammarIssue[] {
  const inputTokens = tokenizeNormalizedAnswer(input)
  const expectedTokens = tokenizeNormalizedAnswer(expected)
  const issues: GrammarIssue[] = []

  const length = Math.min(inputTokens.length, expectedTokens.length)

  for (let i = 0; i < length; i += 1) {
    const actual = inputTokens[i]
    const wanted = expectedTokens[i]

    if (actual === wanted) continue

    if (numeralGenderPairs[wanted] === actual) {
      issues.push({
        feature: 'numeral',
        token: actual,
        expected: wanted,
        message:
          wanted === 'dva'
            ? "Hier wird die männliche Form 'dva' benötigt."
            : "Hier wird die weibliche Form 'dve' benötigt."
      })
    }
  }

  return issues
}
