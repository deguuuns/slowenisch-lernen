import { Conversation, Exercise, Lesson, Sentence } from '@/types'

export const lesson6: Lesson = {
  id: 6,
  title: 'Nakupovanje',
  subtitle: 'Einkaufen, Preise, Farben, Größen und Bezahlen',
  minutes: 24,
  focus: ['Einkaufen', 'Preise', 'Farben und Größen', 'bezahlen'],
  grammar: {
    title: 'Wünsche beim Einkaufen',
    body: 'Mit „Želim …“ und „Potrebujem …“ kannst du beim Einkaufen einfach ausdrücken, was du möchtest oder brauchst. „Koliko stane?“ fragt nach dem Preis.',
    examples: ['Želim rdečo majico.', 'Potrebujem veliko torbo.', 'Koliko stane?'],
  },
}

export const lesson6Sentences: Sentence[] = [
  { id:'s56', sl:'Iščem majico.', de:'Ich suche ein T-Shirt.', lesson:6 },
  { id:'s57', sl:'Želim rdečo majico.', de:'Ich möchte ein rotes T-Shirt.', lesson:6 },
  { id:'s58', sl:'Potrebujem veliko torbo.', de:'Ich brauche eine große Tasche.', lesson:6 },
  { id:'s59', sl:'Koliko stane?', de:'Wie viel kostet es?', lesson:6 },
  { id:'s60', sl:'To je poceni.', de:'Das ist günstig.', lesson:6 },
  { id:'s61', sl:'To je predrago.', de:'Das ist zu teuer.', lesson:6 },
  { id:'s62', sl:'Imate manjšo številko?', de:'Haben Sie eine kleinere Größe?', lesson:6 },
  { id:'s63', sl:'Imate zeleno?', de:'Haben Sie es in Grün?', lesson:6 },
  { id:'s64', sl:'Plačam s kartico.', de:'Ich bezahle mit Karte.', lesson:6 },
  { id:'s65', sl:'Imam samo gotovino.', de:'Ich habe nur Bargeld.', lesson:6 },
  { id:'s66', sl:'Kje lahko plačam?', de:'Wo kann ich bezahlen?', lesson:6 },
  { id:'s67', sl:'Želim kupiti kruh.', de:'Ich möchte Brot kaufen.', lesson:6 },
]

export const lesson6Exercises: Exercise[] = [
  { id:'e33', lesson:6, type:'translate-de-sl', prompt:'Ich suche ein T-Shirt.', answer:'Iščem majico.', vocabularyIds:['v123'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'easy', responseScope:'fixed' },
  { id:'e34', lesson:6, type:'translate-de-sl', prompt:'Ich möchte ein rotes T-Shirt.', answer:'Želim rdečo majico.', vocabularyIds:['v131'], grammarRuleIds:['accusative-feminine-a-o'], evaluationMode:'grammar', acceptedAnswers:[], skillTargets:['production','grammar-application'], difficulty:'normal', responseScope:'fixed' },
  { id:'e35', lesson:6, type:'translate-de-sl', prompt:'Ich brauche eine große Tasche.', answer:'Potrebujem veliko torbo.', vocabularyIds:['v124','v129'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'normal', responseScope:'fixed' },
  { id:'e36', lesson:6, type:'translate-de-sl', prompt:'Das ist günstig.', answer:'To je poceni.', vocabularyIds:['v127'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'easy', responseScope:'fixed' },
  { id:'e37', lesson:6, type:'translate-de-sl', prompt:'Das ist zu teuer.', answer:'To je predrago.', vocabularyIds:['v128'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:['To je zelo drago.'], skillTargets:['production'], difficulty:'easy', responseScope:'fixed' },
  { id:'e38', lesson:6, type:'translate-de-sl', prompt:'Haben Sie eine kleinere Größe?', answer:'Imate manjšo številko?', vocabularyIds:['v130','v136'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'normal', responseScope:'fixed' },
  { id:'e39', lesson:6, type:'translate-de-sl', prompt:'Ich bezahle mit Karte.', answer:'Plačam s kartico.', vocabularyIds:['v138','v140'], grammarRuleIds:[], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'normal', responseScope:'fixed' },
  { id:'e40', lesson:6, type:'translate-de-sl', prompt:'Ich habe nur Bargeld.', answer:'Imam samo gotovino.', vocabularyIds:['v139'], grammarRuleIds:['accusative-feminine-a-o'], evaluationMode:'grammar', acceptedAnswers:[], skillTargets:['production','grammar-application'], difficulty:'normal', responseScope:'fixed' },
  { id:'e41', lesson:6, type:'translate-de-sl', prompt:'Wo kann ich bezahlen?', answer:'Kje lahko plačam?', vocabularyIds:['v140','v026'], grammarRuleIds:['polite-request-lahko'], evaluationMode:'acceptedVariants', acceptedAnswers:[], skillTargets:['production'], difficulty:'normal', responseScope:'fixed' },
  { id:'e42', lesson:6, type:'choice', prompt:'Welche Antwort passt zu „Ich möchte Brot kaufen.“?', answer:'Želim kupiti kruh.', alternatives:['Potrebujem rdečo majico.','Plačam s kartico.','To je poceni.'], vocabularyIds:['v122','v092'], grammarRuleIds:[], evaluationMode:'exact', acceptedAnswers:[], skillTargets:['recognition'], difficulty:'easy', responseScope:'fixed' },
  { id:'e43', lesson:6, type:'free', prompt:'Antworte im Geschäft: Kaj iščete? (Was suchen Sie?)', answer:'Iščem majico.', acceptedAnswers:['Iščem kruh.','Iščem denarnico.'], vocabularyIds:['v123'], grammarRuleIds:[], evaluationMode:'open', skillTargets:['production'], difficulty:'normal', responseScope:'personal-open' },
  { id:'e44', lesson:6, type:'choice', prompt:'Wie sagst du, dass du bar bezahlen möchtest?', answer:'Imam samo gotovino.', alternatives:['Plačam s kartico.','Koliko stane?','Imate zeleno?'], vocabularyIds:['v139'], grammarRuleIds:[], evaluationMode:'exact', acceptedAnswers:[], skillTargets:['recognition'], difficulty:'easy', responseScope:'fixed' },
]

export const lesson6Conversation: Conversation = {
  id:'c6',
  title:'Im Geschäft',
  lesson:6,
  turns:[
    { speaker:'Tutor', sl:'Dober dan. Kaj iščete?', de:'Guten Tag. Was suchen Sie?' },
    { speaker:'Nutzer', sl:'Iščem majico.' },
    { speaker:'Tutor', sl:'Katero barvo želite?', de:'Welche Farbe möchten Sie?' },
    { speaker:'Nutzer', sl:'Želim rdečo majico.' },
    { speaker:'Tutor', sl:'Ta stane dvajset evrov.', de:'Diese kostet zwanzig Euro.' },
    { speaker:'Nutzer', sl:'V redu. Plačam s kartico.' },
  ],
}
