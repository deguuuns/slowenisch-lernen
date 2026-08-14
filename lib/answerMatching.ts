export type InputMode = 'typed' | 'speech'

export type CompareAnswerOptions = {
  input: string
  expected: string
  acceptedAnswers?: string[]
  inputMode?: InputMode
}

export type AnswerComparison = {
  correct: boolean
  normalizedInput: string
  normalizedExpected: string
  matchedAnswer?: string
  reason?: string
}

const NUMBER_FORMS: Record<string, string[]> = {
  '0': ['nič'],
  '1': ['ena', 'en', 'eno', 'enega', 'ene'],
  '2': ['dva', 'dve', 'dveh', 'dvema'],
  '3': ['tri', 'treh', 'trem'],
  '4': ['štiri', 'štirih', 'štirim'],
  '5': ['pet', 'petih', 'petim'],
  '6': ['šest', 'šestih', 'šestim'],
  '7': ['sedem', 'sedmih', 'sedmim'],
  '8': ['osem', 'osmih', 'osmim'],
  '9': ['devet', 'devetih', 'devetim'],
  '10': ['deset', 'desetih', 'desetim'],
  '11': ['enajst', 'enajstih', 'enajstim'],
  '12': ['dvanajst', 'dvanajstih', 'dvanajstim'],
  '35': ['petintrideset', 'petintridesetih', 'petintridesetim']
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function normalizeUnicode(value: string) {
  return value.normalize('NFC')
}

export function normalizeSurfaceForm(value: string) {
  return normalizeUnicode(value)
    .toLocaleLowerCase('sl-SI')
    .trim()
    .replace(/[.!?;,]+$/g, '')
    .replace(/\s+/g, ' ')
}

function replaceOneExpectedNumberWithDigit(input: string, expected: string, digit: string, forms: string[]) {
  if (!new RegExp(`\\b${escapeRegex(digit)}\\b`, 'u').test(input)) return null

  for (const form of forms) {
    const formRegex = new RegExp(`\\b${escapeRegex(form)}\\b`, 'u')
    if (!formRegex.test(expected)) continue

    const candidate = input.replace(new RegExp(`\\b${escapeRegex(digit)}\\b`, 'u'), form)
    if (normalizeSurfaceForm(candidate) === normalizeSurfaceForm(expected)) return expected
  }

  return null
}

export function normalizeSpeechArtifacts(input: string, expected: string) {
  const surfaceInput = normalizeSurfaceForm(input)
  const surfaceExpected = normalizeSurfaceForm(expected)

  if (surfaceInput === surfaceExpected) return surfaceExpected

  for (const [digit, forms] of Object.entries(NUMBER_FORMS)) {
    const match = replaceOneExpectedNumberWithDigit(surfaceInput, surfaceExpected, digit, forms)
    if (match) return match
  }

  return surfaceInput
}

export function matchAcceptedAnswer(input: string, acceptedAnswers: string[] = []) {
  const normalizedInput = normalizeSurfaceForm(input)
  return acceptedAnswers.find(answer => normalizeSurfaceForm(answer) === normalizedInput)
}

function matchSpeechNumberVariant(input: string, candidate: string) {
  return normalizeSpeechArtifacts(input, candidate) === normalizeSurfaceForm(candidate)
}

export function compareAnswer({
  input,
  expected,
  acceptedAnswers = [],
  inputMode = 'typed'
}: CompareAnswerOptions): AnswerComparison {
  const normalizedInput = normalizeSurfaceForm(input)
  const normalizedExpected = normalizeSurfaceForm(expected)

  if (normalizedInput === normalizedExpected) {
    return { correct: true, normalizedInput, normalizedExpected, matchedAnswer: expected }
  }

  const accepted = matchAcceptedAnswer(input, acceptedAnswers)
  if (accepted) {
    return { correct: true, normalizedInput, normalizedExpected, matchedAnswer: accepted }
  }

  const candidates = [expected, ...acceptedAnswers]
  for (const candidate of candidates) {
    if (matchSpeechNumberVariant(input, candidate)) {
      return {
        correct: true,
        normalizedInput,
        normalizedExpected,
        matchedAnswer: candidate,
        reason: inputMode === 'speech' ? 'speech-number-artifact' : 'numeric-shorthand'
      }
    }
  }

  return { correct: false, normalizedInput, normalizedExpected }
}

export function isEquivalent(input: string, expected: string, acceptedAnswers: string[] = [], inputMode: InputMode = 'typed') {
  return compareAnswer({ input, expected, acceptedAnswers, inputMode }).correct
}

export function explainMismatch(input: string, expected: string) {
  const actual = normalizeSurfaceForm(input)
  const target = normalizeSurfaceForm(expected)

  const rules: Array<{ pattern: RegExp; targetPattern: RegExp; explanation: string }> = [
    { pattern: /\bdve brata\b/u, targetPattern: /\bdva brata\b/u, explanation: '„brat“ ist männlich. Im Dual heißt es hier „dva brata“.' },
    { pattern: /\bdva sestri\b/u, targetPattern: /\bdve sestri\b/u, explanation: '„sestra“ ist weiblich. Im Dual heißt es hier „dve sestri“.' },
    { pattern: /\bv slovenijo\b/u, targetPattern: /\bv sloveniji\b/u, explanation: 'Du beschreibst einen Ort (KJE?). Deshalb steht hier der Lokativ: „v Sloveniji“.' },
    { pattern: /\bv sloveniji\b/u, targetPattern: /\bv slovenijo\b/u, explanation: 'Du beschreibst eine Richtung (KAM?). Deshalb steht hier der Akkusativ: „v Slovenijo“.' },
    { pattern: /\bv nemčijo\b/u, targetPattern: /\bv nemčiji\b/u, explanation: 'Du beschreibst einen Ort (KJE?). Deshalb heißt es „v Nemčiji“.' },
    { pattern: /\bv nemčiji\b/u, targetPattern: /\bv nemčijo\b/u, explanation: 'Du beschreibst eine Richtung (KAM?). Deshalb heißt es „v Nemčijo“.' },
    { pattern: /\bsem domov\b/u, targetPattern: /\bsem doma\b/u, explanation: '„doma“ beschreibt den Ort „zu Hause“. „domov“ beschreibt die Richtung nach Hause.' },
    { pattern: /\bgrem doma\b/u, targetPattern: /\bgrem domov\b/u, explanation: 'Bei einer Bewegung nach Hause verwendest du „domov“.' },
    { pattern: /\bjem pica\b/u, targetPattern: /\bjem pico\b/u, explanation: '„pica“ ist hier direktes Objekt und steht im Akkusativ: „pico“.' },
    { pattern: /\bob deset\b/u, targetPattern: /\bob desetih\b/u, explanation: 'Nach „ob“ bei der Uhrzeit brauchst du hier die Form „desetih“, nicht „deset“.' }
  ]

  const hit = rules.find(rule => rule.pattern.test(actual) && rule.targetPattern.test(target))
  return hit?.explanation
}
