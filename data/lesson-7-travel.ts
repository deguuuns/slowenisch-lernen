import { Conversation, Exercise, Lesson, Sentence } from '@/types'

export const lesson7: Lesson = {
  id: 7,
  title: 'Na poti',
  subtitle: 'Verkehrsmittel, Fahrkarten, Wege und Reisezeiten',
  minutes: 24,
  focus: ['Verkehrsmittel', 'Fahrkarten', 'Wegbeschreibung', 'Abfahrt und Ankunft'],
  grammar: {
    title: 'Unterwegs nach dem Weg fragen',
    body: 'Mit „Kje je …?“ fragst du nach einem Ort. „Pojdite levo/desno/naravnost“ hilft bei einfachen Wegbeschreibungen. Zeitangaben mit „ob“ geben Abfahrt oder Ankunft an.',
    examples: ['Kje je postaja?', 'Pojdite naravnost.', 'Vlak pride ob osmih.'],
  },
}

export const lesson7Sentences: Sentence[] = [
  { id:'s68', sl:'Kje je avtobusna postaja?', de:'Wo ist die Bushaltestelle?', lesson:7 },
  { id:'s69', sl:'Grem z avtobusom.', de:'Ich fahre mit dem Bus.', lesson:7 },
  { id:'s70', sl:'Vlak pride ob osmih.', de:'Der Zug kommt um acht.', lesson:7 },
  { id:'s71', sl:'Eno vozovnico, prosim.', de:'Eine Fahrkarte, bitte.', lesson:7 },
  { id:'s72', sl:'Letališče je daleč.', de:'Der Flughafen ist weit weg.', lesson:7 },
  { id:'s73', sl:'Pojdite levo.', de:'Gehen Sie nach links.', lesson:7 },
  { id:'s74', sl:'Potem zavijte desno.', de:'Dann biegen Sie rechts ab.', lesson:7 },
  { id:'s75', sl:'Pojdite naravnost.', de:'Gehen Sie geradeaus.', lesson:7 },
  { id:'s76', sl:'Je postaja blizu?', de:'Ist die Haltestelle in der Nähe?', lesson:7 },
  { id:'s77', sl:'Čakam na vlak.', de:'Ich warte auf den Zug.', lesson:7 },
  { id:'s78', sl:'Vlak ima zamudo.', de:'Der Zug hat Verspätung.', lesson:7 },
  { id:'s79', sl:'Srečno pot!', de:'Gute Reise!', lesson:7 },
]

export const lesson7Exercises: Exercise[] = [
  { id:'e45', lesson:7, type:'translate-de-sl', prompt:'Wo ist die Bushaltestelle?', answer:'Kje je avtobusna postaja?', vocabularyIds:['v141','v142'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:['Kje je postaja za avtobus?'], skillTargets:['production'], difficulty:'easy', responseScope:'fixed' },
  { id:'e46', lesson:7, type:'translate-de-sl', prompt:'Ich fahre mit dem Bus.', answer:'Grem z avtobusom.', vocabularyIds:['v142'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'normal', responseScope:'fixed' },
  { id:'e47', lesson:7, type:'translate-de-sl', prompt:'Der Zug kommt um acht.', answer:'Vlak pride ob osmih.', vocabularyIds:['v143','v153'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'normal', responseScope:'fixed' },
  { id:'e48', lesson:7, type:'translate-de-sl', prompt:'Eine Fahrkarte, bitte.', answer:'Eno vozovnico, prosim.', vocabularyIds:['v144'], grammarRuleIds:['accusative-feminine-a-o'], evaluationMode:'grammar', acceptedAnswers:['Vozovnico, prosim.'], skillTargets:['production','grammar-application'], difficulty:'normal', responseScope:'fixed' },
  { id:'e49', lesson:7, type:'translate-de-sl', prompt:'Der Flughafen ist weit weg.', answer:'Letališče je daleč.', vocabularyIds:['v145','v152'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'easy', responseScope:'fixed' },
  { id:'e50', lesson:7, type:'translate-de-sl', prompt:'Gehen Sie geradeaus.', answer:'Pojdite naravnost.', vocabularyIds:['v150'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'normal', responseScope:'fixed' },
  { id:'e51', lesson:7, type:'translate-de-sl', prompt:'Dann biegen Sie rechts ab.', answer:'Potem zavijte desno.', vocabularyIds:['v149'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:['Zavijte desno.'], skillTargets:['production'], difficulty:'normal', responseScope:'fixed' },
  { id:'e52', lesson:7, type:'translate-de-sl', prompt:'Ich warte auf den Zug.', answer:'Čakam na vlak.', vocabularyIds:['v143','v155'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'normal', responseScope:'fixed' },
  { id:'e53', lesson:7, type:'translate-de-sl', prompt:'Der Zug hat Verspätung.', answer:'Vlak ima zamudo.', vocabularyIds:['v143','v156'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'normal', responseScope:'fixed' },
  { id:'e54', lesson:7, type:'choice', prompt:'Welche Antwort bedeutet „Gehen Sie nach links.“?', answer:'Pojdite levo.', alternatives:['Pojdite naravnost.','Zavijte desno.','Postaja je daleč.'], vocabularyIds:['v148'], grammarRuleIds:[], evaluationMode:'exact', acceptedAnswers:[], skillTargets:['recognition'], difficulty:'easy', responseScope:'fixed' },
  { id:'e55', lesson:7, type:'choice', prompt:'Was passt zu einer Zugverspätung?', answer:'Vlak ima zamudo.', alternatives:['Vlak pride ob osmih.','Srečno pot!','Eno vozovnico, prosim.'], vocabularyIds:['v143','v156'], grammarRuleIds:[], evaluationMode:'exact', acceptedAnswers:[], skillTargets:['recognition'], difficulty:'easy', responseScope:'fixed' },
  { id:'e56', lesson:7, type:'free', prompt:'Du bist unterwegs und suchst den Bahnhof. Frage auf Slowenisch nach der Station.', answer:'Kje je postaja?', acceptedAnswers:['Kje je železniška postaja?','Kje je avtobusna postaja?'], vocabularyIds:['v141'], grammarRuleIds:[], evaluationMode:'open', skillTargets:['production'], difficulty:'normal', responseScope:'personal-open' },
]

export const lesson7Conversation: Conversation = {
  id:'c7',
  title:'Am Bahnhof',
  lesson:7,
  turns:[
    { speaker:'Nutzer', sl:'Dober dan. Eno vozovnico, prosim.', de:'Guten Tag. Eine Fahrkarte, bitte.' },
    { speaker:'Tutor', sl:'Kam potujete?', de:'Wohin reisen Sie?' },
    { speaker:'Nutzer', sl:'V Ljubljano.' },
    { speaker:'Tutor', sl:'Vlak odide ob desetih.', de:'Der Zug fährt um zehn ab.' },
    { speaker:'Nutzer', sl:'Ali ima vlak zamudo?', de:'Hat der Zug Verspätung?' },
    { speaker:'Tutor', sl:'Ne. Prihod je ob enajstih.', de:'Nein. Die Ankunft ist um elf.' },
  ],
}
