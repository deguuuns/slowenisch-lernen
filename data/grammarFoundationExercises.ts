import type { Exercise } from '@/types'
import { conjugationExercises } from './conjugationExercises'

export const grammarFoundationExercises: Exercise[] = [
  {
    id:'gf-brat-intro', lesson:2, type:'introduce', modality:'text',
    prompt:'Neu: „brat“ bedeutet „Bruder“. Tippe brat.', answer:'brat', level:'A1', difficulty:1,
    skills:['wortschatz','schreiben'], introducesVocabulary:['brat'], learningTargets:['vocab:brat'], contentKey:'vocab-brat', contextTag:'familie',
  },
  {
    id:'gf-sestra-intro', lesson:2, type:'introduce', modality:'text',
    prompt:'Neu: „sestra“ bedeutet „Schwester“. Tippe sestra.', answer:'sestra', level:'A1', difficulty:1,
    skills:['wortschatz','schreiben'], introducesVocabulary:['sestra'], learningTargets:['vocab:sestra'], contentKey:'vocab-sestra', contextTag:'familie',
  },
  {
    id:'gf-dva-intro', lesson:2, type:'introduce', modality:'text',
    prompt:'Für genau zwei männliche Personen lernst du zuerst „dva“. Beispiel: dva brata = zwei Brüder. Tippe dva.', answer:'dva', level:'A1', difficulty:1,
    skills:['wortschatz','grammatik','schreiben'], requiredVocabulary:['brat'], introducesVocabulary:['dva'], learningTargets:['vocab:dva'], contentKey:'vocab-dva', contextTag:'familie',
  },
  {
    id:'gf-dve-intro', lesson:2, type:'introduce', modality:'text',
    prompt:'Bei zwei weiblichen Wörtern lernst du „dve“. Beispiel: dve sestri = zwei Schwestern. Tippe dve.', answer:'dve', level:'A1', difficulty:1,
    skills:['wortschatz','grammatik','schreiben'], requiredVocabulary:['sestra'], introducesVocabulary:['dve'], learningTargets:['vocab:dve'], contentKey:'vocab-dve', contextTag:'familie',
  },
  {
    id:'gf-dual-rule-intro', lesson:2, type:'introduce', modality:'text',
    prompt:'Grammatik neu – Dual: Slowenisch hat eigene Formen für genau zwei. Merke zunächst: dva brata (männlich), dve sestri (weiblich). Tippe „dva brata“.',
    answer:'dva brata', acceptedAnswers:['dva brata.'], evaluationMode:'accepted', level:'A1', difficulty:1,
    skills:['grammatik','schreiben'], requiredVocabulary:['brat','sestra','dva','dve'], introducesGrammar:['dual'], learningTargets:['grammar:dual'], contentKey:'grammar-dual-intro', contextTag:'familie',
  },
  {
    id:'gf-nimam-intro', lesson:2, type:'introduce', modality:'text',
    prompt:'Neu: Die Verneinung von „imam“ ist „nimam“ = ich habe nicht. Nicht „ne imam“. Tippe nimam.', answer:'nimam', level:'A1', difficulty:1,
    skills:['wortschatz','grammatik','schreiben'], introducesVocabulary:['nimam'], introducesGrammar:['negation'], learningTargets:['vocab:nimam','grammar:negation'], contentKey:'nimam-intro', contextTag:'alltag',
  },
  {
    id:'gf-ob-intro', lesson:3, type:'introduce', modality:'text',
    prompt:'Neu bei Uhrzeiten: „ob“ bedeutet hier „um“. Beispiel: ob osmih = um acht Uhr. Tippe ob.', answer:'ob', level:'A1', difficulty:1,
    skills:['wortschatz','schreiben'], introducesVocabulary:['ob'], learningTargets:['vocab:ob'], contentKey:'vocab-ob', contextTag:'uhrzeit',
  },
  {
    id:'gf-deset-intro', lesson:3, type:'introduce', modality:'text',
    prompt:'Neu: „deset“ bedeutet zehn. Tippe deset.', answer:'deset', level:'A1', difficulty:1,
    skills:['wortschatz','schreiben'], introducesVocabulary:['deset'], learningTargets:['vocab:deset'], contentKey:'vocab-deset', contextTag:'uhrzeit',
  },
  {
    id:'gf-time-rule-intro', lesson:3, type:'introduce', modality:'text',
    prompt:'Grammatik neu – Uhrzeit: Nach „ob“ verwendet man bei zehn die Form „desetih“: ob desetih = um zehn Uhr. Tippe ob desetih.',
    answer:'ob desetih', acceptedAnswers:['ob desetih.'], evaluationMode:'accepted', level:'A1', difficulty:1,
    skills:['grammatik','schreiben'], requiredVocabulary:['ob','deset'], introducesGrammar:['time-number-form'], learningTargets:['grammar:time-number-form'], contentKey:'time-rule-intro', contextTag:'uhrzeit',
  },
  {
    id:'gf-pica-intro', lesson:4, type:'introduce', modality:'text',
    prompt:'Neu: „pica“ bedeutet Pizza. Tippe pica.', answer:'pica', level:'A1', difficulty:1,
    skills:['wortschatz','schreiben'], introducesVocabulary:['pica'], learningTargets:['vocab:pica'], contentKey:'vocab-pica', contextTag:'essen',
  },
  {
    id:'gf-kava-intro', lesson:4, type:'introduce', modality:'text',
    prompt:'Neu: „kava“ bedeutet Kaffee. Tippe kava.', answer:'kava', level:'A1', difficulty:1,
    skills:['wortschatz','schreiben'], introducesVocabulary:['kava'], learningTargets:['vocab:kava'], contentKey:'vocab-kava', contextTag:'essen',
  },
  {
    id:'gf-accusative-rule-intro', lesson:4, type:'introduce', modality:'text',
    prompt:'Grammatik neu: Bei vielen weiblichen Wörtern auf -a wird beim direkten Objekt -a zu -o. pica → Jem pico. kava → Pijem kavo. Tippe „Jem pico“.',
    answer:'Jem pico', acceptedAnswers:['Jem pico.'], evaluationMode:'accepted', level:'A1', difficulty:1,
    skills:['grammatik','schreiben'], requiredVocabulary:['pica','kava'], introducesGrammar:['accusative'], learningTargets:['grammar:accusative'], contentKey:'accusative-rule-intro', contextTag:'essen',
  },
  ...conjugationExercises,
]
