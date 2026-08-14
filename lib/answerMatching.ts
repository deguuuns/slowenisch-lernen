import type { MistakeCategory } from '@/types'

export type InputMode = 'typed' | 'speech'

export type CompareAnswerOptions = {
  input: string
  expected: string
  acceptedAnswers?: string[]
  inputMode?: InputMode
  allowNumericShorthand?: boolean
}

export type AnswerComparison = {
  correct: boolean
  normalizedInput: string
  normalizedExpected: string
  matchedAnswer?: string
  reason?: string
  category?: MistakeCategory
  explanation?: string
}

type DiagnosticRule = {
  input: RegExp
  expected: RegExp
  category: MistakeCategory
  explanation: string
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

const DIAGNOSTIC_RULES: DiagnosticRule[] = [
  { input: /\bdve brata\b/, expected: /\bdva brata\b/, category: 'gender', explanation: '„brat“ ist männlich. Im Dual heißt es hier „dva brata“.' },
  { input: /\bdva sestri\b/, expected: /\bdve sestri\b/, category: 'gender', explanation: '„sestra“ ist weiblich. Im Dual heißt es hier „dve sestri“.' },
  { input: /\bv slovenijo\b/, expected: /\bv sloveniji\b/, category: 'location-direction', explanation: 'Du beschreibst einen Ort (KJE?). Deshalb steht hier der Lokativ: „v Sloveniji“.' },
  { input: /\bv sloveniji\b/, expected: /\bv slovenijo\b/, category: 'location-direction', explanation: 'Du beschreibst eine Richtung (KAM?). Deshalb steht hier der Akkusativ: „v Slovenijo“.' },
  { input: /\bv nemčijo\b/, expected: /\bv nemčiji\b/, category: 'location-direction', explanation: 'Du beschreibst einen Ort (KJE?). Deshalb heißt es „v Nemčiji“.' },
  { input: /\bv nemčiji\b/, expected: /\bv nemčijo\b/, category: 'location-direction', explanation: 'Du beschreibst eine Richtung (KAM?). Deshalb heißt es „v Nemčijo“.' },
  { input: /\bsem domov\b/, expected: /\bsem doma\b/, category: 'location-direction', explanation: '„doma“ beschreibt den Ort „zu Hause“. „domov“ beschreibt die Richtung nach Hause.' },
  { input: /\bgrem doma\b/, expected: /\bgrem domov\b/, category: 'location-direction', explanation: 'Bei einer Bewegung nach Hause verwendest du „domov“.' },
  { input: /\bjem pica\b/, expected: /\bjem pico\b/, category: 'case', explanation: '„pica“ ist hier direktes Objekt und steht im Akkusativ: „pico“.' },
  { input: /\bpijem kava\b/, expected: /\bpijem kavo\b/, category: 'case', explanation: 'Nach „pijem“ ist „kava“ das direkte Objekt: „Pijem kavo.“' },
  { input: /\bob deset\b/, expected: /\bob desetih\b/, category: 'number-form', explanation: 'Bei der Uhrzeit nach „ob“ brauchst du hier die Form „desetih“, nicht „deset“.' },
  { input: /\bsem si\b|\bsi sem\b/, expected: /\bsem\b/, category: 'verb-person', explanation: 'Für „ich bin“ verwendest du „sem“. „si“ gehört zur 2. Person: „du bist“.' },
  { input: /\bgrem greš\b|\bgreš\b/, expected: /^grem\b/, category: 'verb-person', explanation: '„grem“ bedeutet „ich gehe“, „greš“ bedeutet „du gehst“.' },
]

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
  if (!new RegExp(`\\b${escapeRegex(digit)}\\b`).test(input)) return null

  for (const form of forms) {
    const formRegex = new RegExp(`\\b${escapeRegex(form)}\\b`)
    if (!formRegex.test(expected)) continue

    const candidate = input.replace(new RegExp(`\\b${escapeRegex(digit)}\\b`), form)
    if (normalizeSurfaceForm(candidate) === normalizeSurfaceForm(expected)) return expected
  }

  return null
}

/** Only converts a digit when the exact grammatical number form already exists in expected. */
export function normalizeSpeechArtifacts(input: string, expected: string) {
  const surfaceInput = normalizeSurfaceForm(input)
  const surfaceExpected = normalizeSurfaceForm(expected)

  if (surfaceInput === surfaceExpected) return surfaceExpected
  if (!/\d/.test(surfaceInput)) return surfaceInput

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

function matchNumberVariant(input: string, candidate: string) {
  return normalizeSpeechArtifacts(input, candidate) === normalizeSurfaceForm(candidate)
}

export function diagnoseMismatch(input: string, expected: string): Pick<AnswerComparison, 'category' | 'explanation'> {
  const actual = normalizeSurfaceForm(input)
  const target = normalizeSurfaceForm(expected)
  const hit = DIAGNOSTIC_RULES.find(rule => rule.input.test(actual) && rule.expected.test(target))
  if (hit) return { category: hit.category, explanation: hit.explanation }

  const inputWords = actual.split(' ')
  const targetWords = target.split(' ')
  if (inputWords.length === targetWords.length && [...inputWords].sort().join('|') === [...targetWords].sort().join('|')) {
    return { category: 'word-order', explanation: 'Die verwendeten Wörter passen, aber die Wortstellung entspricht hier nicht der erwarteten Form.' }
  }

  return { category: 'unknown' }
}

export function compareAnswer({
  input,
  expected,
  acceptedAnswers = [],
  inputMode = 'typed',
  allowNumericShorthand = true
}: CompareAnswerOptions): AnswerComparison {
  const normalizedInput = normalizeSurfaceForm(input)
  const normalizedExpected = normalizeSurfaceForm(expected)

  if (normalizedInput === normalizedExpected) {
    return { correct: true, normalizedInput, normalizedExpected, matchedAnswer: expected, reason: 'exact' }
  }

  const accepted = matchAcceptedAnswer(input, acceptedAnswers)
  if (accepted) {
    return { correct: true, normalizedInput, normalizedExpected, matchedAnswer: accepted, reason: 'accepted-answer' }
  }

  const mayResolveDigits = /\d/.test(normalizedInput) && (inputMode === 'speech' || allowNumericShorthand)
  if (mayResolveDigits) {
    const candidates = [expected, ...acceptedAnswers]
    for (const candidate of candidates) {
      if (matchNumberVariant(input, candidate)) {
        return {
          correct: true,
          normalizedInput,
          normalizedExpected,
          matchedAnswer: candidate,
          reason: inputMode === 'speech' ? 'speech-number-artifact' : 'numeric-shorthand'
        }
      }
    }
  }

  return { correct: false, normalizedInput, normalizedExpected, ...diagnoseMismatch(input, expected) }
}

export function isEquivalent(input: string, expected: string, acceptedAnswers: string[] = [], inputMode: InputMode = 'typed') {
  return compareAnswer({ input, expected, acceptedAnswers, inputMode }).correct
}

export function explainMismatch(input: string, expected: string) {
  return diagnoseMismatch(input, expected).explanation
}
