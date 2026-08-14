import {
  conversations as seedConversations,
  exercises as seedExercises,
  lessons as seedLessons,
  sentences as seedSentences,
  vocabulary as seedVocabulary,
} from './seed'
import type { Exercise, Lesson, Vocabulary } from '@/types'

const lessonObjectives: Record<number, string[]> = {
  1: ['dich begrüßen und vorstellen', 'KJE (wo) und KAM (wohin) unterscheiden', 'einfache Orts- und Herkunftsangaben bilden'],
  2: ['über Familie und Besitz sprechen', 'bei genau zwei Personen den Dual verwenden', 'Wohnort und Alter ausdrücken'],
  3: ['deinen Tagesablauf beschreiben', 'Uhrzeiten mit „ob“ verwenden', 'doma und domov unterscheiden'],
  4: ['über Essen und Trinken sprechen', 'häufige Akkusativformen aktiv bilden', 'einfache Vorlieben ausdrücken'],
  5: ['im Restaurant bestellen', 'höflich nachfragen', 'die Rechnung verlangen und bezahlen'],
}

const lessonSkills: Record<number, Lesson['skills']> = {
  1: ['lesen','hören','schreiben','sprechen','grammatik','wortschatz'],
  2: ['lesen','schreiben','sprechen','grammatik','wortschatz'],
  3: ['hören','schreiben','sprechen','grammatik','wortschatz'],
  4: ['hören','schreiben','sprechen','grammatik','wortschatz'],
  5: ['hören','lesen','sprechen','wortschatz'],
}

const exerciseOverrides: Record<string, Partial<Exercise>> = {
  e01: { level: 'A1', skills: ['schreiben','wortschatz'], evaluationMode: 'accepted', acceptedAnswers: ['Kako si? Živjo!'] },
  e02: { level: 'A1', skills: ['schreiben','grammatik'], grammarTag: 'location-direction', difficulty: 2 },
  e03: { level: 'A1', skills: ['schreiben','grammatik'], grammarTag: 'location-direction', difficulty: 3 },
  e04: { level: 'A1', skills: ['grammatik'], grammarTag: 'preposition', difficulty: 1 },
  e05: { level: 'A1', skills: ['grammatik'], grammarTag: 'case-location', difficulty: 2 },
  e06: { level: 'A1', skills: ['grammatik'], grammarTag: 'case-direction', difficulty: 2 },
  e07: { level: 'A1', skills: ['schreiben','sprechen'], evaluationMode: 'free' },
  e08: { level: 'A1', skills: ['schreiben','grammatik'], grammarTag: 'dual', learningTargets: ['grammar:dual'], difficulty: 3, acceptedAnswers: ['Imam 2 brata.'] },
  e09: { level: 'A1', skills: ['schreiben','grammatik'], grammarTag: 'accusative', learningTargets: ['grammar:accusative'], difficulty: 2 },
  e10: { level: 'A1', skills: ['schreiben','grammatik'], grammarTag: 'location', difficulty: 2, evaluationMode: 'accepted', acceptedAnswers: ['V Nemčiji živim.'] },
  e11: { level: 'A1', skills: ['grammatik'], grammarTag: 'negation', difficulty: 2 },
  e12: { level: 'A1', skills: ['schreiben','sprechen'], evaluationMode: 'free' },
  e13: { level: 'A1', skills: ['schreiben','wortschatz'], difficulty: 2, acceptedAnswers: ['Star sem 35 let.'] },
  e14: { level: 'A1', skills: ['schreiben','grammatik'], grammarTag: 'location', difficulty: 2 },
  e15: { level: 'A1', skills: ['schreiben','grammatik'], grammarTag: 'direction', difficulty: 2 },
  e16: { level: 'A1', skills: ['schreiben','grammatik'], grammarTag: 'time-number-form', learningTargets: ['grammar:time-number-form'], difficulty: 3, acceptedAnswers: ['Grem spat ob 10.'] },
  e17: { level: 'A1', skills: ['wortschatz'], difficulty: 1 },
  e18: { level: 'A1', skills: ['schreiben','sprechen'], evaluationMode: 'free' },
  e19: { level: 'A1', skills: ['schreiben','wortschatz'], difficulty: 1 },
  e20: { level: 'A1', skills: ['schreiben','grammatik'], grammarTag: 'accusative', learningTargets: ['grammar:accusative'], difficulty: 2 },
  e21: { level: 'A1', skills: ['schreiben','wortschatz'], difficulty: 1 },
  e22: { level: 'A1', skills: ['schreiben','grammatik'], grammarTag: 'accusative', difficulty: 2 },
  e23: { level: 'A1', skills: ['schreiben','sprechen'], evaluationMode: 'free' },
  e24: { level: 'A1', skills: ['schreiben','sprechen'], evaluationMode: 'free' },
  e25: { level: 'A1', skills: ['schreiben','wortschatz'], difficulty: 1 },
  e26: { level: 'A1', skills: ['schreiben','wortschatz'], difficulty: 1 },
  e27: { level: 'A1', skills: ['schreiben','wortschatz'], difficulty: 1 },
  e28: { level: 'A1', skills: ['schreiben','sprechen'], difficulty: 2 },
  e29: { level: 'A1', skills: ['schreiben','sprechen'], difficulty: 1 },
  e30: { level: 'A1', skills: ['schreiben','grammatik'], grammarTag: 'number-form', difficulty: 2, acceptedAnswers: ['Miza za 2, prosim.'] },
  e31: { level: 'A1', skills: ['schreiben','wortschatz'], difficulty: 1 },
  e32: { level: 'A1', skills: ['grammatik'], grammarTag: 'case-direction', difficulty: 2 },
}

const genderById: Record<string, Vocabulary['gender']> = {
  v035: 'm', v036: 'm', v037: 'm', v038: 'm', v039: 'm', v040: 'f', v041: 'm', v042: 'f', v043: 'm', v044: 'f', v045: 'n',
  v061: 'f', v070: 'f', v087: 'f', v088: 'n', v089: 'f', v090: 'm', v091: 'f', v092: 'm', v093: 'm', v094: 'n',
  v095: 'm', v096: 'n', v097: 'f', v101: 'f', v102: 'm', v103: 'f', v104: 'm',
}

const formsById: Record<string, string[]> = {
  v039: ['brat', 'dva brata', 'bratje'],
  v040: ['sestra', 'eno sestro', 'dve sestri', 'sestre'],
  v052: ['doma'],
  v053: ['domov'],
  v059: ['deset', 'desetih'],
  v075: ['grem spat', 'ob desetih'],
  v089: ['kava', 'kavo'],
  v091: ['pica', 'pico'],
}

export const lessons: Lesson[] = seedLessons.map(lesson => ({
  ...lesson,
  level: 'A1',
  objectives: lessonObjectives[lesson.id] ?? lesson.focus,
  skills: lessonSkills[lesson.id],
  grammar: {
    ...lesson.grammar,
    level: 'A1',
    commonMistakes: lesson.id === 1 ? ['v Sloveniji ≠ v Slovenijo']
      : lesson.id === 2 ? ['dve brata ✗ → dva brata', 'ne imam ✗ → nimam']
      : lesson.id === 3 ? ['ob deset ✗ → ob desetih', 'Sem domov. ✗ / Grem doma. ✗']
      : lesson.id === 4 ? ['Jem pica. ✗ → Jem pico.', 'Pijem kava. ✗ → Pijem kavo.']
      : ['prosim macht Wünsche und Bestellungen höflicher.'],
  },
}))

const baseExercises: Exercise[] = seedExercises.map(exercise => ({
  level: 'A1',
  skills: exercise.type === 'free' ? ['schreiben','sprechen'] : ['schreiben'],
  evaluationMode: exercise.type === 'free' ? 'free' : 'exact',
  difficulty: 2,
  ...exercise,
  ...(exerciseOverrides[exercise.id] ?? {}),
}))

const transferExercises: Exercise[] = [
  { id:'t-dual-1', lesson:2, type:'fill', level:'A1', difficulty:2, prompt:'Imam ___ brata. (zwei)', answer:'dva', skills:['grammatik','schreiben'], grammarTag:'dual', learningTargets:['grammar:dual'], explanation:'Bei männlichen Personen heißt „zwei“ im Dual hier „dva“.' },
  { id:'t-dual-2', lesson:2, type:'translate-de-sl', level:'A1', difficulty:3, prompt:'Ich sehe zwei Freunde.', answer:'Vidim dva prijatelja.', skills:['grammatik','schreiben'], grammarTag:'dual', learningTargets:['grammar:dual'], acceptedAnswers:['Vidim 2 prijatelja.'] },
  { id:'t-location-1', lesson:1, type:'translate-de-sl', level:'A1', difficulty:2, prompt:'Ich bin in Deutschland.', answer:'Sem v Nemčiji.', skills:['grammatik','schreiben'], grammarTag:'location-direction', learningTargets:['grammar:location-direction'] },
  { id:'t-direction-1', lesson:1, type:'translate-de-sl', level:'A1', difficulty:2, prompt:'Ich gehe nach Slowenien.', answer:'Grem v Slovenijo.', skills:['grammatik','schreiben'], grammarTag:'location-direction', learningTargets:['grammar:location-direction'] },
  { id:'t-home-1', lesson:3, type:'fill', level:'A1', difficulty:2, prompt:'Zdaj sem ___. (zu Hause)', answer:'doma', skills:['grammatik','wortschatz'], grammarTag:'location-direction', learningTargets:['grammar:doma-domov'] },
  { id:'t-home-2', lesson:3, type:'fill', level:'A1', difficulty:2, prompt:'Zdaj grem ___. (nach Hause)', answer:'domov', skills:['grammatik','wortschatz'], grammarTag:'location-direction', learningTargets:['grammar:doma-domov'] },
  { id:'t-time-1', lesson:3, type:'fill', level:'A1', difficulty:2, prompt:'Grem spat ob ___. (zehn)', answer:'desetih', skills:['grammatik','schreiben'], grammarTag:'time-number-form', learningTargets:['grammar:time-number-form'] },
  { id:'t-pizza-1', lesson:4, type:'fill', level:'A1', difficulty:2, prompt:'Jem ___. (Pizza)', answer:'pico', skills:['grammatik','schreiben'], grammarTag:'accusative', learningTargets:['grammar:accusative'] },
]

export const exercises: Exercise[] = [...baseExercises, ...transferExercises]

export const vocabulary: Vocabulary[] = seedVocabulary.map(item => ({
  ...item,
  level: 'A1',
  gender: genderById[item.id],
  forms: formsById[item.id],
  audioText: item.sl,
}))

export const sentences = seedSentences.map(sentence => ({ ...sentence, level: 'A1' as const }))
export const conversations = seedConversations.map(conversation => ({ ...conversation, level: 'A1' as const }))
