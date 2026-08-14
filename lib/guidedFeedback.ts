import type { MistakeCategory } from '@/types'

export type FeedbackStage = 1 | 2 | 3

export function guidedHint(category: MistakeCategory | undefined, input: string, expected: string, stage: FeedbackStage) {
  const first = firstDifferentToken(input, expected)
  const token = first?.input || 'diese Stelle'

  const hints: Partial<Record<MistakeCategory, [string, string]>> = {
    dual: [`Prüfe „${token}“. Achte darauf, ob das Bezugswort männlich oder weiblich ist.`, 'Beim slowenischen Dual hängt die Form von „zwei“ unter anderem vom Genus ab.'],
    gender: [`Prüfe „${token}“. Die Form passt noch nicht zum Genus des Bezugswortes.`, 'Schau dir an, ob das Wort männlich, weiblich oder sächlich ist und welche Form dazu gehört.'],
    case: [`Prüfe die Form „${token}“. Der Satz verlangt hier eine andere Fallform.`, 'Frage dich: Beschreibst du Ort, Richtung, Besitz oder ein Objekt? Das entscheidet über die Form.'],
    'location-direction': [`Überlege: Beschreibst du WO etwas ist oder WOHIN sich jemand bewegt?`, 'Bei Ort und Richtung verwendet Slowenisch nach derselben Präposition unterschiedliche Formen.'],
    'number-form': [`Schau dir die Zahlform „${token}“ noch einmal an.`, 'Zahlwörter können je nach Satz grammatisch verändert werden; die Grundform passt nicht immer.'],
    'verb-person': [`Prüfe das Verb „${token}“. Passt die Endung zur Person im Satz?`, 'Achte darauf, wer handelt: ich, du, er/sie, wir …'],
    preposition: [`Prüfe die Präposition rund um „${token}“.`, 'Überlege, welche Beziehung gemeint ist: Ort, Richtung, Zeit oder etwas anderes.'],
    'word-order': ['Die Wörter sind verständlich, aber ihre Stellung passt hier noch nicht optimal.', 'Versuche, die bekannten Satzteile in der im Lernbeispiel verwendeten Reihenfolge anzuordnen.'],
    'missing-word': ['In deiner Antwort fehlt wahrscheinlich noch ein notwendiger Baustein.', 'Vergleiche gedanklich, welche Bedeutung aus der Aufgabe noch nicht in deinem Satz vorkommt.'],
    word: [`„${token}“ passt hier noch nicht zur Bedeutung der Aufgabe.`, 'Überlege, welches bereits gelernte Wort die gefragte Bedeutung ausdrückt.'],
    format: ['Sprachlich sieht es fast richtig aus. Prüfe Schreibweise und Zeichen.', 'Achte besonders auf č, š, ž und kleine Tippfehler.'],
  }

  const selected = hints[category ?? 'unknown'] ?? [`Prüfe besonders „${token}“. Dort liegt wahrscheinlich der entscheidende Unterschied.`, 'Gehe den Satz Baustein für Baustein durch und prüfe Form und Bedeutung.']
  return stage === 1 ? selected[0] : selected[1]
}

export function firstDifferentToken(input: string, expected: string) {
  const a = tokenize(input)
  const b = tokenize(expected)
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index += 1) {
    if ((a[index] ?? '') !== (b[index] ?? '')) return { index, input: a[index] ?? '', expected: b[index] ?? '' }
  }
  return null
}

function tokenize(value: string) {
  return value.toLocaleLowerCase('sl-SI').normalize('NFC').replace(/[.!?,;:]+$/g, '').trim().split(/\s+/).filter(Boolean)
}
