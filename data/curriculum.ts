import type { CEFRLevel, LearningSkill } from '@/types'

export type CurriculumUnit = {
  id: string
  level: CEFRLevel
  title: string
  goal: string
  skills: LearningSkill[]
  lessonIds: number[]
  status: 'available' | 'planned'
  prerequisites?: string[]
  introduces?: string[]
}

export const curriculum: CurriculumUnit[] = [
  {
    id: 'a1-foundation-1', level: 'A1', title: 'Begrüßungen & Höflichkeit',
    goal: 'Die ersten nützlichen slowenischen Wörter und festen Wendungen verstehen, hören und benutzen.',
    skills: ['hören','sprechen','wortschatz'], lessonIds: [1], status: 'available',
    introduces: ['chunk:živjo','chunk:dober-dan','chunk:dobro-jutro','chunk:dober-večer','chunk:hvala','chunk:prosim'],
  },
  {
    id: 'a1-foundation-2', level: 'A1', title: 'Ich & du mit biti',
    goal: 'jaz sem, ti si und on/ona je schrittweise verstehen und in einfachen Sätzen verwenden.',
    skills: ['sprechen','schreiben','grammatik','wortschatz'], lessonIds: [1], status: 'available',
    prerequisites: ['vocab:sem'], introduces: ['grammar:biti-basic','conjugation:biti:jaz','conjugation:biti:ti','conjugation:biti:on-ona'],
  },
  {
    id: 'a1-foundation-3', level: 'A1', title: 'Wo? – KJE',
    goal: 'Nach einem Ort fragen und einfache bekannte Ortsangaben verstehen.',
    skills: ['hören','sprechen','grammatik','wortschatz'], lessonIds: [1], status: 'available',
    prerequisites: ['grammar:biti-basic'], introduces: ['vocab:kje'],
  },
  {
    id: 'a1-foundation-4', level: 'A1', title: 'Wohin? – KAM',
    goal: 'Nach einem Ziel fragen und die erste Bewegungsform grem verwenden.',
    skills: ['hören','sprechen','grammatik','wortschatz'], lessonIds: [1], status: 'available',
    prerequisites: ['vocab:kje','conjugation:iti:jaz'], introduces: ['vocab:kam','vocab:grem'],
  },
  {
    id: 'a1-foundation-5', level: 'A1', title: 'KJE oder KAM?',
    goal: 'Ort und Richtung bewusst unterscheiden: Sem v Sloveniji. / Grem v Slovenijo.',
    skills: ['hören','sprechen','schreiben','grammatik'], lessonIds: [1], status: 'available',
    prerequisites: ['vocab:kje','vocab:kam','vocab:grem','grammar:biti-basic'], introduces: ['grammar:location-direction'],
  },
  { id: 'a1-2', level: 'A1', title: 'Ich & Familie', goal: 'Über Familie, Besitz, Alter und Wohnort sprechen.', skills: ['sprechen','schreiben','grammatik','wortschatz'], lessonIds: [2], status: 'available', prerequisites:['grammar:location-direction'] },
  { id: 'a1-3', level: 'A1', title: 'Mein Tag', goal: 'Tagesablauf, Arbeit und Uhrzeiten ausdrücken.', skills: ['hören','sprechen','grammatik'], lessonIds: [3], status: 'available', prerequisites:['a1-2'] },
  { id: 'a1-4', level: 'A1', title: 'Essen & Trinken', goal: 'Über Essen sprechen und einfache Wünsche äußern.', skills: ['lesen','sprechen','wortschatz','grammatik'], lessonIds: [4], status: 'available', prerequisites:['a1-3'] },
  { id: 'a1-5', level: 'A1', title: 'Im Restaurant', goal: 'Bestellen, nachfragen und bezahlen.', skills: ['hören','sprechen','wortschatz'], lessonIds: [5], status: 'available', prerequisites:['a1-4'] },
  { id: 'a1-6', level: 'A1', title: 'Unterwegs', goal: 'Verkehrsmittel, Wege und Ziele beschreiben.', skills: ['hören','sprechen','wortschatz'], lessonIds: [], status: 'planned' },
  { id: 'a1-7', level: 'A1', title: 'Einkaufen', goal: 'Preise, Mengen, Farben und einfache Wünsche ausdrücken.', skills: ['lesen','sprechen','wortschatz'], lessonIds: [], status: 'planned' },
  { id: 'a1-8', level: 'A1', title: 'Freizeit & Wochenende', goal: 'Vorlieben und einfache Pläne besprechen.', skills: ['sprechen','schreiben','grammatik'], lessonIds: [], status: 'planned' },
  { id: 'a2-1', level: 'A2', title: 'Vergangenheit erzählen', goal: 'Über gestern, Reisen und Erlebnisse sprechen.', skills: ['sprechen','schreiben','grammatik'], lessonIds: [], status: 'planned' },
  { id: 'a2-2', level: 'A2', title: 'Gesundheit & Apotheke', goal: 'Beschwerden beschreiben und Hilfe erfragen.', skills: ['hören','sprechen','wortschatz'], lessonIds: [], status: 'planned' },
  { id: 'a2-3', level: 'A2', title: 'Wohnen & Alltag', goal: 'Wohnung, Haushalt und tägliche Probleme erklären.', skills: ['lesen','sprechen','wortschatz'], lessonIds: [], status: 'planned' },
  { id: 'a2-4', level: 'A2', title: 'Arbeit & Termine', goal: 'Arbeitsabläufe, Termine und Verpflichtungen besprechen.', skills: ['hören','schreiben','sprechen'], lessonIds: [], status: 'planned' },
  { id: 'a2-5', level: 'A2', title: 'Meinung & Vergleich', goal: 'Dinge vergleichen, begründen und einfache Meinungen äußern.', skills: ['sprechen','schreiben','grammatik'], lessonIds: [], status: 'planned' },
  { id: 'b1-1', level: 'B1', title: 'Erlebnisse & Geschichten', goal: 'Zusammenhängend über persönliche Erfahrungen erzählen.', skills: ['sprechen','schreiben','hören'], lessonIds: [], status: 'planned' },
  { id: 'b1-2', level: 'B1', title: 'Diskutieren & begründen', goal: 'Meinungen differenziert ausdrücken und begründen.', skills: ['sprechen','hören','grammatik'], lessonIds: [], status: 'planned' },
]
