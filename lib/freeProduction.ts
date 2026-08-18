import type { Exercise } from '@/types'
import { normalizeSurfaceForm } from './answerMatching'

export type FreeProductionResult = {
  acceptable: boolean
  reason: string
  feedback: string
}

const GERMAN_MARKERS = new Set([
  'ich','du','er','sie','wir','ihr','bin','bist','ist','sind','habe','hast','gehe','wohne','kann','hier','alles','was','will','deutschland','österreich','slowenien',
])

// Free production must fail closed: we only mark an answer as correct when the app can
// actually justify it. In particular, starting a string with "Sem" is not enough to
// certify the rest as Slovenian. These are intentionally high-confidence beginner
// location answers; unsupported personal locations remain usable as input, but are not
// awarded mastery until we have a reliable validator for them.
const KNOWN_LOCATION_ANSWERS = new Set([
  'sem doma',
  'sem tukaj',
  'sem zunaj',
  'sem v sloveniji',
  'sem v nemčiji',
  'sem v avstriji',
  'sem v ljubljani',
  'sem v mariboru',
  'sem v šoli',
  'sem v službi',
  'sem v trgovini',
  'sem v hotelu',
  'sem v restavraciji',
  'sem v kavarni',
  'sem na delu',
  'sem na poti',
  'sem na dopustu',
])

function foldDiacritics(value: string) {
  return normalizeSurfaceForm(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function words(value: string) {
  return normalizeSurfaceForm(value).split(/\s+/).filter(Boolean)
}

function containsObviousGerman(value: string) {
  return words(value).filter(word => GERMAN_MARKERS.has(word)).length >= 2
}

function result(acceptable: boolean, reason: string, feedback: string): FreeProductionResult {
  return { acceptable, reason, feedback }
}

function isKnownLocationAnswer(exercise: Exercise, input: string) {
  const normalized = normalizeSurfaceForm(input).replace(/^zdaj\s+/, '')
  const explicit = [exercise.answer, ...(exercise.acceptedAnswers ?? [])]
    .map(answer => normalizeSurfaceForm(answer).replace(/^zdaj\s+/, ''))
  return KNOWN_LOCATION_ANSWERS.has(normalized) || explicit.includes(normalized)
}

export function validateFreeProduction(exercise: Exercise, input: string): FreeProductionResult {
  const normalized = normalizeSurfaceForm(input)
  if (!normalized || normalized.length < 2) return result(false, 'empty', 'Schreibe zuerst eine kurze slowenische Antwort.')
  if (containsObviousGerman(input)) return result(false, 'german-text', 'Die Antwort soll auf Slowenisch sein. Nutze die bereits gelernten Bausteine.')

  const prompt = foldDiacritics(exercise.prompt)

  if (prompt.includes('kje si zdaj')) {
    if (isKnownLocationAnswer(exercise, input)) {
      return result(true, 'location-answer', 'Das ist eine passende slowenische Ortsantwort.')
    }
    if (/^(zdaj\s+)?sem\b/.test(normalized)) {
      return result(false, 'unverified-location', 'Die Struktur mit „Sem …“ passt, aber diese Ortsangabe kann die App noch nicht sicher als korrektes Slowenisch bewerten. Nutze einen bereits gelernten Ortsbaustein.')
    }
    return result(false, 'location-shape', 'Antworte mit der bekannten Struktur „Sem …“ und sage, wo du bist.')
  }

  if (prompt.includes('koliko bratov imas')) {
    const ok = /^(imam|nimam)\b/.test(normalized)
    return ok
      ? result(true, 'family-answer', 'Die Antwort verwendet eine passende Struktur mit imam/nimam.')
      : result(false, 'family-shape', 'Beginne mit „Imam …“ oder „Nimam …“ und antworte auf deine eigene Situation.')
  }

  if (prompt.includes('kdaj zacnes delati')) {
    const ok = normalized.includes('ob ') || normalized.includes('začnem') || normalized.includes('delati')
    return ok
      ? result(true, 'time-answer', 'Die Antwort passt zur Frage nach dem Zeitpunkt.')
      : result(false, 'time-shape', 'Antworte mit einer bekannten Zeitangabe, zum Beispiel mit „ob …“.')
  }

  if (prompt.includes('kaj jes danes')) {
    const ok = /\bjem\b/.test(normalized)
    return ok
      ? result(true, 'food-answer', 'Die Antwort verwendet „jem“ und passt zur Frage.')
      : result(false, 'food-shape', 'Nutze für „ich esse“ die Form „jem“ und ergänze etwas, das du isst.')
  }

  if (prompt.includes('kaj pijes')) {
    const ok = /\bpijem\b/.test(normalized)
    return ok
      ? result(true, 'drink-answer', 'Die Antwort verwendet „pijem“ und passt zur Frage.')
      : result(false, 'drink-shape', 'Nutze für „ich trinke“ die Form „pijem“ und ergänze ein Getränk.')
  }

  // Unknown free tasks are deliberately not auto-certified as grammatically correct.
  return result(false, 'needs-review', 'Diese freie Antwort kann die App noch nicht zuverlässig automatisch bewerten. Sie wird deshalb nicht als sicher beherrscht markiert.')
}
