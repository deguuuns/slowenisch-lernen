import { Conversation, Exercise, Lesson, Sentence } from '@/types'

export const lesson8: Lesson = {
  id: 8,
  title: 'Doma in pomoč',
  subtitle: 'Zuhause, Wetter und grundlegende Hilfe',
  minutes: 24,
  focus: ['Zuhause', 'Zimmer und Gegenstände', 'Wetter', 'Hilfe und Gesundheit'],
  grammar: {
    title: 'Orte beschreiben und um Hilfe bitten',
    body: 'Mit „Kje je …?“ fragst du nach Orten. „Potrebujem …“ eignet sich für grundlegende Bedürfnisse und Hilfe. Für Wetter und Zustand nutzt du einfache Sätze mit „je“ oder „sem“.',
    examples: ['Kje je kopalnica?', 'Potrebujem pomoč.', 'Danes je hladno.'],
  },
}

export const lesson8Sentences: Sentence[] = [
  { id:'s80', sl:'Moja hiša je majhna.', de:'Mein Haus ist klein.', lesson:8 },
  { id:'s81', sl:'Živim v stanovanju.', de:'Ich wohne in einer Wohnung.', lesson:8 },
  { id:'s82', sl:'Soba je velika.', de:'Das Zimmer ist groß.', lesson:8 },
  { id:'s83', sl:'Kuhinja je tukaj.', de:'Die Küche ist hier.', lesson:8 },
  { id:'s84', sl:'Kje je kopalnica?', de:'Wo ist das Badezimmer?', lesson:8 },
  { id:'s85', sl:'Vrata so odprta.', de:'Die Tür ist offen.', lesson:8 },
  { id:'s86', sl:'Kje je ključ?', de:'Wo ist der Schlüssel?', lesson:8 },
  { id:'s87', sl:'Kakšno je vreme?', de:'Wie ist das Wetter?', lesson:8 },
  { id:'s88', sl:'Danes je hladno.', de:'Heute ist es kalt.', lesson:8 },
  { id:'s89', sl:'Zunaj je toplo.', de:'Draußen ist es warm.', lesson:8 },
  { id:'s90', sl:'Potrebujem pomoč.', de:'Ich brauche Hilfe.', lesson:8 },
  { id:'s91', sl:'Kje je lekarna?', de:'Wo ist die Apotheke?', lesson:8 },
]

export const lesson8Exercises: Exercise[] = [
  { id:'e57', lesson:8, type:'translate-de-sl', prompt:'Wo ist das Badezimmer?', answer:'Kje je kopalnica?', vocabularyIds:['v165'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'easy', responseScope:'fixed' },
  { id:'e58', lesson:8, type:'translate-de-sl', prompt:'Ich wohne in einer Wohnung.', answer:'Živim v stanovanju.', vocabularyIds:['v162'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'normal', responseScope:'fixed' },
  { id:'e59', lesson:8, type:'translate-de-sl', prompt:'Die Küche ist hier.', answer:'Kuhinja je tukaj.', vocabularyIds:['v164'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'easy', responseScope:'fixed' },
  { id:'e60', lesson:8, type:'translate-de-sl', prompt:'Wo ist der Schlüssel?', answer:'Kje je ključ?', vocabularyIds:['v168'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'easy', responseScope:'fixed' },
  { id:'e61', lesson:8, type:'translate-de-sl', prompt:'Heute ist es kalt.', answer:'Danes je hladno.', vocabularyIds:['v174'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'easy', responseScope:'fixed' },
  { id:'e62', lesson:8, type:'translate-de-sl', prompt:'Draußen ist es warm.', answer:'Zunaj je toplo.', vocabularyIds:['v175'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'easy', responseScope:'fixed' },
  { id:'e63', lesson:8, type:'translate-de-sl', prompt:'Ich brauche Hilfe.', answer:'Potrebujem pomoč.', vocabularyIds:['v176'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'normal', responseScope:'fixed' },
  { id:'e64', lesson:8, type:'translate-de-sl', prompt:'Ich brauche einen Arzt.', answer:'Potrebujem zdravnika.', vocabularyIds:['v177'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'normal', responseScope:'fixed' },
  { id:'e65', lesson:8, type:'choice', prompt:'Welche Antwort bedeutet „Wo ist die Apotheke?“', answer:'Kje je lekarna?', alternatives:['Kje je kopalnica?','Danes je hladno.','Potrebujem pomoč.'], vocabularyIds:['v178'], grammarRuleIds:[], evaluationMode:'exact', acceptedAnswers:[], skillTargets:['recognition'], difficulty:'easy', responseScope:'fixed' },
  { id:'e66', lesson:8, type:'choice', prompt:'Was passt zu „Heute bin ich krank.“?', answer:'Danes sem bolan.', alternatives:['Danes je sonce.','Zunaj je toplo.','Zvečer sem utrujen.'], vocabularyIds:['v179'], grammarRuleIds:[], evaluationMode:'exact', acceptedAnswers:[], skillTargets:['recognition'], difficulty:'easy', responseScope:'fixed' },
  { id:'e67', lesson:8, type:'free', prompt:'Du brauchst Hilfe. Sage auf Slowenisch, dass du Hilfe brauchst.', answer:'Potrebujem pomoč.', acceptedAnswers:['Prosim, potrebujem pomoč.'], vocabularyIds:['v176'], grammarRuleIds:[], evaluationMode:'open', skillTargets:['production'], difficulty:'normal', responseScope:'personal-open' },
  { id:'e68', lesson:8, type:'free', prompt:'Frage auf Slowenisch nach der Apotheke.', answer:'Kje je lekarna?', acceptedAnswers:['Oprostite, kje je lekarna?'], vocabularyIds:['v178'], grammarRuleIds:[], evaluationMode:'open', skillTargets:['production'], difficulty:'normal', responseScope:'personal-open' },
]

export const lesson8Conversation: Conversation = {
  id:'c8',
  title:'Zuhause und Hilfe',
  lesson:8,
  turns:[
    { speaker:'Nutzer', sl:'Oprostite, kje je kopalnica?', de:'Entschuldigung, wo ist das Badezimmer?' },
    { speaker:'Tutor', sl:'Tam, poleg kuhinje.', de:'Dort, neben der Küche.' },
    { speaker:'Nutzer', sl:'Hvala. Kje je moj ključ?', de:'Danke. Wo ist mein Schlüssel?' },
    { speaker:'Tutor', sl:'Ključ je na mizi.', de:'Der Schlüssel liegt auf dem Tisch.' },
    { speaker:'Nutzer', sl:'Ne počutim se dobro. Potrebujem pomoč.', de:'Ich fühle mich nicht gut. Ich brauche Hilfe.' },
    { speaker:'Tutor', sl:'Lekarna je blizu. Če je nujno, pokličemo zdravnika.', de:'Die Apotheke ist in der Nähe. Wenn es dringend ist, rufen wir einen Arzt.' },
  ],
}
