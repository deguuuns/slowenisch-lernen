import type { Exercise } from '@/types'
import { visualVocabularyExercises } from './visualVocabulary'

export type FoundationChunk = {
  id: string
  sl: string
  de: string
  usage: string
  prerequisites?: string[]
}

export type VerbForm = {
  person: string
  form: string
  key: string
}

export type VerbDefinition = {
  id: string
  infinitive: string
  de: string
  forms: VerbForm[]
}

export type GrammarConcept = {
  id: string
  title: string
  explanation: string
  examples: Array<{ sl: string; de: string }>
  prerequisites?: string[]
}

export const foundationChunks: FoundationChunk[] = [
  { id: 'chunk:zivjo', sl: 'Živjo!', de: 'Hallo!', usage: 'Lockere Begrüßung.' },
  { id: 'chunk:dober-dan', sl: 'Dober dan!', de: 'Guten Tag!', usage: 'Neutrale Begrüßung tagsüber.' },
  { id: 'chunk:dobro-jutro', sl: 'Dobro jutro!', de: 'Guten Morgen!', usage: 'Begrüßung am Morgen.' },
  { id: 'chunk:dober-vecer', sl: 'Dober večer!', de: 'Guten Abend!', usage: 'Begrüßung am Abend.' },
  { id: 'chunk:lahko-noc', sl: 'Lahko noč!', de: 'Gute Nacht!', usage: 'Beim Verabschieden vor dem Schlafengehen.' },
  { id: 'chunk:hvala', sl: 'Hvala.', de: 'Danke.', usage: 'Zum Bedanken.' },
  { id: 'chunk:prosim', sl: 'Prosim.', de: 'Bitte. / Gern geschehen.', usage: 'Als Bitte oder Antwort auf Danke.' },
]

export const verbs: VerbDefinition[] = [
  {
    id: 'verb:biti', infinitive: 'biti', de: 'sein',
    forms: [
      { person: 'jaz', form: 'sem', key: 'conjugation:biti:jaz' },
      { person: 'ti', form: 'si', key: 'conjugation:biti:ti' },
      { person: 'on/ona', form: 'je', key: 'conjugation:biti:on-ona' },
      { person: 'midva/midve', form: 'sva', key: 'conjugation:biti:midva-midve' },
      { person: 'vidva/vidve', form: 'sta', key: 'conjugation:biti:vidva-vidve' },
      { person: 'mi', form: 'smo', key: 'conjugation:biti:mi' },
      { person: 'vi', form: 'ste', key: 'conjugation:biti:vi' },
      { person: 'oni/one', form: 'so', key: 'conjugation:biti:oni-one' },
    ],
  },
  {
    id: 'verb:iti', infinitive: 'iti', de: 'gehen',
    forms: [
      { person: 'jaz', form: 'grem', key: 'conjugation:iti:jaz' },
      { person: 'ti', form: 'greš', key: 'conjugation:iti:ti' },
      { person: 'on/ona', form: 'gre', key: 'conjugation:iti:on-ona' },
    ],
  },
]

export const grammarConcepts: GrammarConcept[] = [
  {
    id: 'grammar:biti-basic',
    title: 'biti – sein',
    explanation: 'Im Slowenischen verändert sich „sein“ je nach Person. Starte mit jaz sem, ti si und on/ona je.',
    examples: [
      { sl: 'Jaz sem Dejan.', de: 'Ich bin Dejan.' },
      { sl: 'Ti si doma.', de: 'Du bist zu Hause.' },
      { sl: 'Ona je tukaj.', de: 'Sie ist hier.' },
    ],
  },
  {
    id: 'grammar:kje-kam',
    title: 'KJE oder KAM?',
    explanation: 'KJE fragt nach einem Ort: WO? KAM fragt nach einer Richtung: WOHIN? Bei „sem“ bleibst du an einem Ort; bei „grem“ bewegst du dich zu einem Ziel.',
    prerequisites: ['vocab:kje', 'vocab:kam', 'vocab:grem'],
    examples: [
      { sl: 'Kje si? – Sem v Sloveniji.', de: 'Wo bist du? – Ich bin in Slowenien.' },
      { sl: 'Kam greš? – Grem v Slovenijo.', de: 'Wohin gehst du? – Ich gehe nach Slowenien.' },
      { sl: 'Sem doma. – Grem domov.', de: 'Ich bin zu Hause. – Ich gehe nach Hause.' },
    ],
  },
]

export const foundationExercises: Exercise[] = [
  {
    id: 'f-chunk-dober-dan-intro', lesson: 1, type: 'introduce', modality: 'text',
    prompt: 'Neu: „Dober dan!“ bedeutet „Guten Tag!“. Nutze es tagsüber als neutrale Begrüßung. Tippe den Ausdruck einmal.',
    answer: 'Dober dan', acceptedAnswers: ['Dober dan.','Dober dan!'], evaluationMode: 'accepted',
    level: 'A1', difficulty: 1, skills: ['wortschatz','schreiben'], introducesVocabulary: ['dober dan'], learningTargets: ['chunk:dober-dan'], contentKey: 'chunk-dober-dan', contextTag: 'begrüßung', sentencePatternKey: 'chunk-intro',
  },
  {
    id: 'f-chunk-dobro-jutro-intro', lesson: 1, type: 'introduce', modality: 'text',
    prompt: 'Neu: „Dobro jutro!“ bedeutet „Guten Morgen!“. Lerne den Ausdruck zunächst als feste Einheit. Tippe ihn einmal.',
    answer: 'Dobro jutro', acceptedAnswers: ['Dobro jutro.','Dobro jutro!'], evaluationMode: 'accepted',
    level: 'A1', difficulty: 1, skills: ['wortschatz','schreiben'], introducesVocabulary: ['dobro jutro'], learningTargets: ['chunk:dobro-jutro'], contentKey: 'chunk-dobro-jutro', contextTag: 'begrüßung', sentencePatternKey: 'chunk-intro',
  },
  {
    id: 'f-chunk-dober-vecer-intro', lesson: 1, type: 'introduce', modality: 'text',
    prompt: 'Neu: „Dober večer!“ bedeutet „Guten Abend!“. Lerne den Ausdruck als feste Einheit. Tippe ihn einmal.',
    answer: 'Dober večer', acceptedAnswers: ['Dober večer.','Dober večer!'], evaluationMode: 'accepted',
    level: 'A1', difficulty: 1, skills: ['wortschatz','schreiben'], introducesVocabulary: ['dober večer'], learningTargets: ['chunk:dober-vecer'], contentKey: 'chunk-dober-vecer', contextTag: 'begrüßung', sentencePatternKey: 'chunk-intro',
  },
  {
    id: 'f-biti-si-intro', lesson: 1, type: 'introduce', modality: 'text',
    prompt: 'Neu bei „biti“ (sein): jaz sem = ich bin, ti si = du bist. Tippe „si“ für „du bist“.',
    answer: 'si', level: 'A1', difficulty: 1, skills: ['grammatik','wortschatz','schreiben'],
    requiredVocabulary: ['sem'], introducesVocabulary: ['si'], introducesGrammar: ['biti-basic'], learningTargets: ['conjugation:biti:ti','grammar:biti-basic'], contentKey: 'biti-si-intro', contextTag: 'biti', sentencePatternKey: 'verb-form-intro',
  },
  {
    id: 'f-biti-je-intro', lesson: 1, type: 'introduce', modality: 'text',
    prompt: 'Nächster Schritt bei „biti“: on/ona je = er/sie ist. Tippe „je“.',
    answer: 'je', level: 'A1', difficulty: 1, skills: ['grammatik','wortschatz','schreiben'],
    requiredVocabulary: ['si'], requiredGrammar: ['biti-basic'], introducesVocabulary: ['je'], learningTargets: ['conjugation:biti:on-ona','grammar:biti-basic'], contentKey: 'biti-je-intro', contextTag: 'biti', sentencePatternKey: 'verb-form-intro',
  },
  {
    id: 'f-biti-person-choice', lesson: 1, type: 'choice', modality: 'choice',
    prompt: 'Welche Form passt zu „ti“ (du)?', answer: 'si', alternatives: ['sem','si','je'], level: 'A1', difficulty: 1,
    skills: ['grammatik','lesen'], requiredVocabulary: ['sem','si','je'], requiredGrammar: ['biti-basic'], learningTargets: ['conjugation:biti:ti','grammar:biti-basic'], contentKey: 'biti-ti-choice', contextTag: 'biti', sentencePatternKey: 'pronoun-to-verb',
  },
  {
    id: 'f-kje-intro', lesson: 1, type: 'introduce', modality: 'text',
    prompt: 'Neu: „kje“ bedeutet „wo?“. Es fragt nach einem Ort. Tippe kje.', answer: 'kje', level: 'A1', difficulty: 1,
    skills: ['wortschatz','schreiben'], introducesVocabulary: ['kje'], learningTargets: ['vocab:kje'], contentKey: 'kje-intro', contextTag: 'ort-richtung', sentencePatternKey: 'question-word-intro',
  },
  {
    id: 'f-kam-intro', lesson: 1, type: 'introduce', modality: 'text',
    prompt: 'Neu: „kam“ bedeutet „wohin?“. Es fragt nach einer Richtung oder einem Ziel. Tippe kam.', answer: 'kam', level: 'A1', difficulty: 1,
    skills: ['wortschatz','schreiben'], requiredVocabulary: ['kje'], introducesVocabulary: ['kam'], learningTargets: ['vocab:kam'], contentKey: 'kam-intro', contextTag: 'ort-richtung', sentencePatternKey: 'question-word-intro',
  },
  {
    id: 'f-grem-intro', lesson: 1, type: 'introduce', modality: 'text',
    prompt: 'Neu: „grem“ bedeutet „ich gehe / ich fahre“. Es ist die jaz-Form von iti. Tippe grem.', answer: 'grem', level: 'A1', difficulty: 1,
    skills: ['wortschatz','grammatik','schreiben'], introducesVocabulary: ['grem'], introducesGrammar: ['iti-1s'], learningTargets: ['vocab:grem','conjugation:iti:jaz'], contentKey: 'grem-intro', contextTag: 'bewegung', sentencePatternKey: 'verb-form-intro',
  },
  {
    id: 'f-kje-kam-grammar-intro', lesson: 1, type: 'introduce', modality: 'text',
    prompt: 'Grammatik neu: KJE = WO? (Ort), KAM = WOHIN? (Richtung). Beispiel: „Sem v Sloveniji.“ aber „Grem v Slovenijo.“ Tippe zur Bestätigung: kje / kam',
    answer: 'kje / kam', acceptedAnswers: ['kje/kam','kje kam'], evaluationMode: 'accepted', level: 'A1', difficulty: 1,
    skills: ['grammatik','lesen','schreiben'], requiredVocabulary: ['kje','kam','grem','sem'], introducesGrammar: ['kje-kam','location-direction'], learningTargets: ['grammar:kje-kam','grammar:location-direction'], contentKey: 'kje-kam-intro', contextTag: 'ort-richtung', sentencePatternKey: 'grammar-contrast',
  },
  ...visualVocabularyExercises,
]
