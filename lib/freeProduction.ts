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

function words(value: string) {
  return normalizeSurfaceForm(value).split(/\s+/).filter(Boolean)
}

function containsObviousGerman(value: string) {
  return words(value).filter(word => GERMAN_MARKERS.has(word)).length >= 2
}

function result(acceptable: boolean, reason: string, feedback: string): FreeProductionResult {
  return { acceptable, reason, feedback }
}

export function validateFreeProduction(exercise: Exercise, input: string): FreeProductionResult {
  const normalized = normalizeSurfaceForm(input)
  if (!normalized || normalized.length < 2) return result(false, 'empty', 'Schreibe zuerst eine kurze slowenische Antwort.')
  if (containsObviousGerman(input)) return result(false, 'german-text', 'Die Antwort soll auf Slowenisch sein. Nutze die bereits gelernten Bausteine.')

  const prompt = normalizeSurfaceForm(exercise.prompt)

  if (prompt.includes('kje si zdaj')) {
    const ok = /^(zdaj\s+)?sem\s+/.test(normalized) && normalized.split(/\s+/).length <= 8
    return ok
      ? result(true, 'location-answer', 'Das ist eine plausible persönliche Ortsantwort.')
      : result(false, 'location-shape', 'Antworte mit der bekannten Struktur „Sem …“ und sage, wo du bist.')
  }

  if (prompt.includes('koliko bratov imas')) {
    const ok = /^(imam|nimam)\b/.test(normalized)
    return ok
      ? result(true, 'family-answer', 'Die Antwort verwendet eine passende Struktur mit imam/nimam.')
      : result(false, 'family-shape', 'Beginne mit „Imam …“ oder „Nimam …“ und antworte auf deine eigene Situation.')
  }

  if (prompt.includes('kdaj zacnes delati')) {
    const ok = normalized.includes('ob ') || normalized.includes('zacnem') || normalized.includes('delati')
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
