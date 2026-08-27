import type { Exercise, Sentence } from '@/types'

export const lesson1AtomicSentences:Sentence[]=[
  {id:'s01a',sl:'Kako si?',de:'Wie geht es dir?',lesson:1,contentType:'phrase',vocabularyIds:['v181','v012'],prerequisites:['vocab:v181','vocab:v012'],note:'Natürliche deutsche Bedeutung; nicht Wort für Wort übersetzen.'},
]

export const lesson1AtomicExercises:Exercise[]=[
  {
    id:'e01a-kako-si-recognize',lesson:1,type:'choice',prompt:'Was bedeutet „Kako si?“?',answer:'Wie geht es dir?',alternatives:['Wo bist du?','Wie heißt du?','Was machst du?'],
    vocabularyIds:['v181','v012'],grammarRuleIds:['greeting-basic'],evaluationMode:'exact',skillTargets:['recognition'],difficulty:'easy',responseScope:'fixed',
    prerequisites:['vocab:v181','vocab:v012'],targetContentKeys:['vocab:v181'],supportingContentKeys:['vocab:v012'],learningPhase:'recognize',
  },
  {
    id:'e01b-kako-si-guided',lesson:1,type:'free',prompt:'Baue: Wie geht es dir?',answer:'Kako si?',wordBank:['Kako','si?'],acceptedAnswers:['Kako si'],
    vocabularyIds:['v181','v012'],grammarRuleIds:['greeting-basic'],evaluationMode:'acceptedVariants',skillTargets:['production'],difficulty:'easy',responseScope:'fixed',
    prerequisites:['vocab:v181','vocab:v012'],targetContentKeys:['vocab:v181'],supportingContentKeys:['vocab:v012'],learningPhase:'guided-production',
    explanation:'kako = wie; si = du bist (Form von biti). Zusammen ist „Kako si?“ die natürliche Frage „Wie geht es dir?“.'
  },
  {
    id:'e01c-kako-si-active',lesson:1,type:'translate-de-sl',prompt:'Wie geht es dir?',answer:'Kako si?',acceptedAnswers:['Kako si'],
    vocabularyIds:['v181','v012'],grammarRuleIds:['greeting-basic'],evaluationMode:'acceptedVariants',skillTargets:['production'],difficulty:'easy',responseScope:'fixed',
    prerequisites:['vocab:v181','vocab:v012'],targetContentKeys:['vocab:v181'],supportingContentKeys:['vocab:v012'],learningPhase:'active-production',
  },
  {
    id:'e01d-zivjo-kako-si',lesson:1,type:'translate-de-sl',prompt:'Hallo! Wie geht es dir?',answer:'Živjo! Kako si?',acceptedAnswers:['Živjo, kako si?','Živjo! Kako si'],
    vocabularyIds:['v001','v181','v012'],grammarRuleIds:['greeting-basic'],evaluationMode:'acceptedVariants',skillTargets:['production'],difficulty:'normal',responseScope:'fixed',
    prerequisites:['vocab:v001','vocab:v181','vocab:v012'],targetContentKeys:['vocab:v001'],supportingContentKeys:['vocab:v181','vocab:v012'],learningPhase:'variation',
  },
]
