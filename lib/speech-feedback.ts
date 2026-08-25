import { EvaluationResult } from './answer-evaluation'

export type SpeechDeliveryBand = 'strong' | 'developing' | 'retry'

export type SpeechFeedback = {
  contentCorrect: boolean
  deliveryBand: SpeechDeliveryBand
  transcriptSimilarity: number
  recognitionConfidence?: number
  title: string
  detail: string
}

function normalizeSpeech(value: string) {
  return value
    .toLocaleLowerCase('sl-SI')
    .normalize('NFC')
    .replace(/[.,!?;:()"“”„]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0]
    previous[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const stored = previous[j]
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
      diagonal = stored
    }
  }
  return previous[b.length]
}

export function speechTranscriptSimilarity(actual: string, expected: string) {
  const normalizedActual = normalizeSpeech(actual)
  const normalizedExpected = normalizeSpeech(expected)
  if (!normalizedActual && !normalizedExpected) return 1
  if (!normalizedActual || !normalizedExpected) return 0
  const longest = Math.max(normalizedActual.length, normalizedExpected.length)
  return Math.max(0, 1 - levenshtein(normalizedActual, normalizedExpected) / longest)
}

export function buildSpeechFeedback({
  actual,
  expected,
  evaluation,
  recognitionConfidence,
}: {
  actual: string
  expected: string
  evaluation: EvaluationResult
  recognitionConfidence?: number
}): SpeechFeedback {
  const transcriptSimilarity = speechTranscriptSimilarity(actual, expected)
  const confidence = typeof recognitionConfidence === 'number' ? recognitionConfidence : undefined
  const strongRecognition = transcriptSimilarity >= 0.88 && (confidence === undefined || confidence >= 0.55)
  const developingRecognition = transcriptSimilarity >= 0.65 && (confidence === undefined || confidence >= 0.3)
  const deliveryBand: SpeechDeliveryBand = strongRecognition ? 'strong' : developingRecognition ? 'developing' : 'retry'

  if (evaluation.isCorrect && deliveryBand === 'strong') {
    return {
      contentCorrect: true,
      deliveryBand,
      transcriptSimilarity,
      recognitionConfidence: confidence,
      title: 'Inhalt richtig · sehr klar erkannt',
      detail: 'Die Spracherkennung stimmt sehr gut mit der Zielantwort überein.',
    }
  }

  if (evaluation.isCorrect) {
    return {
      contentCorrect: true,
      deliveryBand,
      transcriptSimilarity,
      recognitionConfidence: confidence,
      title: 'Inhalt richtig · Aussprache noch einmal festigen',
      detail: 'Der Inhalt passt. Sprich die Zielantwort noch einmal ruhig und deutlich nach.',
    }
  }

  if (deliveryBand === 'strong') {
    return {
      contentCorrect: false,
      deliveryBand,
      transcriptSimilarity,
      recognitionConfidence: confidence,
      title: 'Gut erkannt · Inhalt noch korrigieren',
      detail: evaluation.explanation || `Zielantwort: ${expected}`,
    }
  }

  return {
    contentCorrect: false,
    deliveryBand,
    transcriptSimilarity,
    recognitionConfidence: confidence,
    title: 'Inhalt und gesprochene Form noch einmal prüfen',
    detail: evaluation.explanation || `Zielantwort: ${expected}`,
  }
}
