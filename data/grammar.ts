import type { GrammarPoint } from '@/types'

export const grammarLibrary: GrammarPoint[] = [
  {
    id: 'g-being', level: 'A1', title: 'Biti – sein',
    body: 'Im Präsens wird das Personalpronomen oft weggelassen, weil die Verbform die Person bereits zeigt.',
    examples: ['Jaz sem Dejan. / Sem Dejan.', 'Ti si doma.', 'On je v službi.'],
    commonMistakes: ['sem = ich bin; si = du bist', 'Bei Ortsangaben den passenden Fall beachten.'], tags: ['Verben', 'Präsens']
  },
  {
    id: 'g-have', level: 'A1', title: 'Imeti – haben und verneinen',
    body: '„imam“ bedeutet ich habe. Die Verneinung ist „nimam“ – nicht „ne imam“.',
    examples: ['Imam čas.', 'Imaš avto?', 'Nimam denarja.'],
    commonMistakes: ['nimam statt ne imam'], tags: ['Verben', 'Negation']
  },
  {
    id: 'g-kje-kam', level: 'A1', title: 'KJE oder KAM? Ort und Richtung',
    body: 'KJE fragt nach einem Ort, KAM nach einer Richtung. Bei vielen Ländern auf -ija sieht man den Fall an der Endung.',
    examples: ['Kje? Sem v Sloveniji.', 'Kam? Grem v Slovenijo.', 'Kje? Živim v Nemčiji.'],
    commonMistakes: ['v Sloveniji ≠ v Slovenijo', 'v Nemčiji ≠ v Nemčijo'], tags: ['Kasus', 'Präpositionen', 'Ort/Richtung']
  },
  {
    id: 'g-home', level: 'A1', title: 'Doma oder domov?',
    body: '„doma“ beschreibt den Ort zu Hause. „domov“ beschreibt die Richtung nach Hause.',
    examples: ['Sem doma.', 'Danes delam doma.', 'Grem domov.'],
    commonMistakes: ['Sem domov. ✗', 'Grem doma. ✗'], tags: ['Ort/Richtung']
  },
  {
    id: 'g-acc-f', level: 'A1', title: 'Weibliche Wörter als direktes Objekt',
    body: 'Viele feminine Wörter auf -a bekommen im Akkusativ Singular die Endung -o.',
    examples: ['pica → Jem pico.', 'kava → Pijem kavo.', 'sestra → Imam eno sestro.'],
    commonMistakes: ['Jem pica. ✗', 'Pijem kava. ✗'], tags: ['Kasus', 'Akkusativ']
  },
  {
    id: 'g-dual', level: 'A1', title: 'Dual – genau zwei',
    body: 'Slowenisch hat neben Singular und Plural einen Dual. Bei genau zwei Personen oder Dingen ändern sich Zahlwort und Nomen.',
    examples: ['dva brata', 'dve sestri', 'dva avtomobila'],
    commonMistakes: ['dve brata ✗', 'dva sestri ✗'], tags: ['Dual', 'Numerus', 'Zahlen']
  },
  {
    id: 'g-time', level: 'A1', title: 'Uhrzeiten mit ob',
    body: 'Für Uhrzeiten steht häufig „ob“ mit einer gebeugten Zahlform.',
    examples: ['ob osmih', 'ob devetih', 'ob desetih'],
    commonMistakes: ['ob deset ✗ → ob desetih'], tags: ['Uhrzeit', 'Zahlen', 'Präpositionen']
  },
  {
    id: 'g-present', level: 'A1', title: 'Präsens und Verbperson',
    body: 'Die Verbendung zeigt, wer handelt. Deshalb sind „grem“ und „greš“ nicht austauschbar.',
    examples: ['jaz grem / ti greš', 'jaz pijem / ti piješ', 'jaz živim / ti živiš'],
    commonMistakes: ['grem = ich gehe; greš = du gehst'], tags: ['Verben', 'Präsens']
  },
  {
    id: 'g-genitive-negation', level: 'A2', title: 'Genitiv bei Verneinung',
    body: 'Bei vielen verneinten Aussagen steht das Objekt im Genitiv. Dieses Muster wird besonders mit „nimam“ und „ne“ wichtig.',
    examples: ['Imam čas. → Nimam časa.', 'Imam denar. → Nimam denarja.', 'Jem meso. → Ne jem mesa.'],
    commonMistakes: ['Nimam čas. ✗'], tags: ['Genitiv', 'Negation']
  },
  {
    id: 'g-adjectives', level: 'A2', title: 'Adjektive und Genus',
    body: 'Adjektive stimmen mit dem Nomen bzw. der Person in Genus und Numerus überein.',
    examples: ['Lačen sem.', 'Lačna sem.', 'Dobra kava.'],
    commonMistakes: ['Genus des Sprechers oder Nomens nicht beachten.'], tags: ['Adjektive', 'Genus']
  },
  {
    id: 'g-modal', level: 'A2', title: 'Modalität und höfliche Wünsche',
    body: 'Mit „lahko“, „moram“, „želim“ und höflichen Formen lassen sich Wünsche und Möglichkeiten ausdrücken.',
    examples: ['Lahko ponovite?', 'Moram iti.', 'Želim kavo.'],
    commonMistakes: ['Wortstellung aus dem Deutschen zu direkt übertragen.'], tags: ['Modalität', 'Höflichkeit']
  },
  {
    id: 'g-past', level: 'B1', title: 'Vergangenheit – Einführung',
    body: 'Die Vergangenheit wird mit einer Form von „biti“ und dem l-Partizip gebildet. Genus und Numerus werden sichtbar.',
    examples: ['Včeraj sem delal.', 'Včeraj sem delala.', 'Šli smo domov.'],
    commonMistakes: ['Genus im Partizip vergessen.', 'Hilfsverb auslassen.'], tags: ['Vergangenheit', 'Verben']
  },
]
