import {
  conversations,
  exercises as baseExercises,
  lessons,
  sentences,
  vocabulary,
} from './learningContent'
import type { Exercise } from '@/types'

const transferExercises: Exercise[] = [
  {
    id: 't-dual-1', lesson: 2, type: 'fill', level: 'A1', difficulty: 2,
    prompt: 'Imam ___ brata. (zwei)', answer: 'dva', skills: ['grammatik','schreiben'],
    grammarTag: 'dual', learningTargets: ['grammar:dual'],
    explanation: 'Bei männlichen Personen heißt „zwei“ im Dual hier „dva“.'
  },
  {
    id: 't-dual-2', lesson: 2, type: 'translate-de-sl', level: 'A1', difficulty: 3,
    prompt: 'Ich sehe zwei Freunde.', answer: 'Vidim dva prijatelja.', skills: ['grammatik','schreiben'],
    grammarTag: 'dual', learningTargets: ['grammar:dual'],
    acceptedAnswers: ['Vidim 2 prijatelja.']
  },
  {
    id: 't-location-1', lesson: 1, type: 'translate-de-sl', level: 'A1', difficulty: 2,
    prompt: 'Ich bin in Deutschland.', answer: 'Sem v Nemčiji.', skills: ['grammatik','schreiben'],
    grammarTag: 'location-direction', learningTargets: ['grammar:location-direction']
  },
  {
    id: 't-direction-1', lesson: 1, type: 'translate-de-sl', level: 'A1', difficulty: 2,
    prompt: 'Ich fahre nach Slowenien.', answer: 'Grem v Slovenijo.', skills: ['grammatik','schreiben'],
    grammarTag: 'location-direction', learningTargets: ['grammar:location-direction']
  },
  {
    id: 't-home-1', lesson: 3, type: 'fill', level: 'A1', difficulty: 2,
    prompt: 'Zdaj sem ___. (zu Hause)', answer: 'doma', skills: ['grammatik','wortschatz'],
    grammarTag: 'location-direction', learningTargets: ['grammar:doma-domov']
  },
  {
    id: 't-home-2', lesson: 3, type: 'fill', level: 'A1', difficulty: 2,
    prompt: 'Zdaj grem ___. (nach Hause)', answer: 'domov', skills: ['grammatik','wortschatz'],
    grammarTag: 'location-direction', learningTargets: ['grammar:doma-domov']
  },
  {
    id: 't-time-1', lesson: 3, type: 'fill', level: 'A1', difficulty: 2,
    prompt: 'Grem spat ob ___. (zehn)', answer: 'desetih', skills: ['grammatik','schreiben'],
    grammarTag: 'time-number-form', learningTargets: ['grammar:time-number-form']
  },
  {
    id: 't-pizza-1', lesson: 4, type: 'fill', level: 'A1', difficulty: 2,
    prompt: 'Jem ___. (Pizza)', answer: 'pico', skills: ['grammatik','schreiben'],
    grammarTag: 'accusative', learningTargets: ['grammar:accusative']
  },
]

export const exercises: Exercise[] = [...baseExercises, ...transferExercises]
export { conversations, lessons, sentences, vocabulary }
