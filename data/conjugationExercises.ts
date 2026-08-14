import type { Exercise } from '@/types'

export const conjugationExercises: Exercise[] = [
  {
    id:'cj-ti-intro', lesson:1, type:'introduce', modality:'text',
    prompt:'Neu: „ti“ bedeutet „du“. Tippe ti.', answer:'ti', level:'A1', difficulty:1,
    skills:['wortschatz','schreiben'], introducesVocabulary:['ti'], learningTargets:['vocab:ti'], contentKey:'vocab-ti', contextTag:'biti',
  },
  {
    id:'cj-biti-sem-fill', lesson:1, type:'fill', modality:'text',
    prompt:'Jaz ___ doma. (ich bin)', answer:'sem', level:'A1', difficulty:1,
    skills:['grammatik','schreiben'], requiredVocabulary:['jaz','sem','doma'], requiredGrammar:['biti-1s'],
    learningTargets:['conjugation:biti:jaz','grammar:biti-basic'], contentKey:'biti-sem-fill', contextTag:'biti',
  },
  {
    id:'cj-biti-si-fill', lesson:1, type:'fill', modality:'text',
    prompt:'Ti ___ doma. (du bist)', answer:'si', level:'A1', difficulty:1,
    skills:['grammatik','schreiben'], requiredVocabulary:['ti','si','doma'], requiredGrammar:['biti-basic'],
    learningTargets:['conjugation:biti:ti','grammar:biti-basic'], contentKey:'biti-si-fill', contextTag:'biti',
  },
  {
    id:'cj-biti-je-person', lesson:1, type:'choice', modality:'choice',
    prompt:'Zu welcher Person passt die Form „je“?', answer:'on / ona', alternatives:['jaz','ti','on / ona'], level:'A1', difficulty:1,
    skills:['grammatik','lesen'], requiredVocabulary:['je'], requiredGrammar:['biti-basic'],
    learningTargets:['conjugation:biti:on-ona'], contentKey:'biti-je-person', contextTag:'biti',
  },
  {
    id:'cj-biti-error', lesson:1, type:'spot-error', modality:'text',
    prompt:'Korrigiere den Fehler: „Jaz si doma.“', answer:'Jaz sem doma.', acceptedAnswers:['Jaz sem doma'], evaluationMode:'accepted', level:'A1', difficulty:2,
    skills:['grammatik','schreiben'], requiredVocabulary:['jaz','sem','si','doma'], requiredGrammar:['biti-basic'],
    learningTargets:['conjugation:biti:jaz','conjugation:biti:ti'], contentKey:'biti-error-jaz-si', contextTag:'biti',
    explanation:'Zu jaz gehört sem; zu ti gehört si.',
  },
  {
    id:'cj-biti-translate-ti', lesson:1, type:'translate-de-sl', modality:'text',
    prompt:'Du bist zu Hause.', answer:'Ti si doma.', acceptedAnswers:['Si doma.'], evaluationMode:'accepted', level:'A1', difficulty:2,
    skills:['grammatik','schreiben'], requiredVocabulary:['ti','si','doma'], requiredGrammar:['biti-basic'],
    learningTargets:['conjugation:biti:ti','pattern:si-doma'], contentKey:'biti-ti-translate', contextTag:'biti',
  },
  {
    id:'cj-biti-speak-sem', lesson:1, type:'speak-answer', modality:'speaking',
    prompt:'Sag laut: „Ich bin zu Hause.“', answer:'Sem doma.', acceptedAnswers:['Jaz sem doma.'], level:'A1', difficulty:2,
    skills:['sprechen','grammatik'], requiredVocabulary:['sem','doma'], requiredGrammar:['biti-basic'],
    learningTargets:['conjugation:biti:jaz','pattern:sem-doma'], contentKey:'biti-sem-speech', contextTag:'biti',
  },
  {
    id:'cj-gres-intro', lesson:1, type:'introduce', modality:'text',
    prompt:'Bei „iti“ (gehen) kennst du schon jaz grem. Für „du gehst“ heißt es „ti greš“. Tippe greš.', answer:'greš', level:'A1', difficulty:1,
    skills:['grammatik','wortschatz','schreiben'], requiredVocabulary:['ti','grem'], requiredGrammar:['iti-1s'],
    introducesVocabulary:['greš'], introducesGrammar:['iti-basic'], learningTargets:['conjugation:iti:ti','grammar:iti-basic'], contentKey:'iti-gres-intro', contextTag:'bewegung',
  },
  {
    id:'cj-iti-person-choice', lesson:1, type:'choice', modality:'choice',
    prompt:'Welche Form passt zu „ti“?', answer:'greš', alternatives:['grem','greš','gre'], level:'A1', difficulty:1,
    skills:['grammatik','lesen'], requiredVocabulary:['grem','greš'], requiredGrammar:['iti-basic'],
    learningTargets:['conjugation:iti:ti'], contentKey:'iti-ti-choice', contextTag:'bewegung',
  },
  {
    id:'cj-iti-fill', lesson:1, type:'fill', modality:'text',
    prompt:'Ti ___ domov. (du gehst)', answer:'greš', level:'A1', difficulty:2,
    skills:['grammatik','schreiben'], requiredVocabulary:['ti','greš'], requiredGrammar:['iti-basic','location-direction'],
    learningTargets:['conjugation:iti:ti','grammar:location-direction'], contentKey:'iti-gres-domov', contextTag:'bewegung',
  },
]
