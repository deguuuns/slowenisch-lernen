const numberWords: Record<string, string> = {
  '0': 'nič',
  '1': 'ena',
  '2': 'dve',
  '3': 'tri',
  '4': 'štiri',
  '5': 'pet',
  '6': 'šest',
  '7': 'sedem',
  '8': 'osem',
  '9': 'devet',
  '10': 'deset',
  '11': 'enajst',
  '12': 'dvanajst'
}

function normalizeNumbers(value: string) {
  return value.replace(/\b(10|11|12|[0-9])\b/g, match => numberWords[match] ?? match)
}

export function normalizeAnswer(value: string) {
  return normalizeNumbers(value)
    .toLocaleLowerCase('sl-SI')
    .trim()
    .replace(/[.!?;,]/g, '')
    .replace(/\s+/g, ' ')
}

export function isEquivalent(input: string, expected: string) {
  const a = normalizeAnswer(input)
  const b = normalizeAnswer(expected)

  if (a === b) return true

  const variants: Record<string, string[]> = {
    'grem spat ob desetih': [
      'grem spat ob deset',
      'grem spat ob 10'
    ]
  }

  return variants[b]?.some(v => normalizeAnswer(v) === a) ?? false
}