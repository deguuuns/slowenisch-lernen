export function normalizeAnswer(value: string) {
  return value
    .toLocaleLowerCase('sl-SI')
    .trim()
    .replace(/[.!?;,]/g, '')
    .replace(/\s+/g, ' ')
}

export function isEquivalent(input: string, expected: string) {
  return normalizeAnswer(input) === normalizeAnswer(expected)
}
