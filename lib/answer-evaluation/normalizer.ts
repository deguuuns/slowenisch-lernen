export type NormalizationOptions = {
  locale?: string
  removeTerminalPunctuation?: boolean
}

/**
 * Conservative normalization for learner answers.
 *
 * Important: this deliberately does NOT rewrite lexical or grammatical forms.
 * In particular, Slovene dva/dve, inflected nouns, cases and verb forms remain
 * untouched so the grammar layer can inspect them reliably.
 */
export function normalizeAnswerText(
  value: string,
  options: NormalizationOptions = {}
) {
  const locale = options.locale ?? 'sl-SI'
  const removeTerminalPunctuation = options.removeTerminalPunctuation ?? true

  let normalized = value
    .normalize('NFC')
    .toLocaleLowerCase(locale)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim()
    .replace(/\s+/g, ' ')

  if (removeTerminalPunctuation) {
    normalized = normalized.replace(/[.!?;,]+$/g, '').trim()
  }

  return normalized
}

export function tokenizeNormalizedAnswer(value: string, locale = 'sl-SI') {
  return normalizeAnswerText(value, { locale })
    .split(/\s+/)
    .filter(Boolean)
}
