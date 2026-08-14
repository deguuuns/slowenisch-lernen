import type { Exercise } from '@/types'

export const beginnerExercises: Exercise[] = [
  {
    id: 'b0-zivjo-intro', lesson: 1, type: 'introduce', modality: 'text',
    prompt: 'Dein erstes slowenisches Wort: „Živjo“ bedeutet „Hallo“. Tippe Živjo einmal ab.',
    answer: 'Živjo', level: 'A1', difficulty: 1, skills: ['wortschatz','schreiben'],
    introducesVocabulary: ['živjo'], learningTargets: ['vocab:živjo'], contextTag: 'beginner-foundation', contentKey: 'intro-zivjo',
  },
  {
    id: 'b0-da-intro', lesson: 1, type: 'introduce', modality: 'text',
    prompt: '„Da“ bedeutet „ja“. Tippe das slowenische Wort für „ja“.',
    answer: 'da', level: 'A1', difficulty: 1, skills: ['wortschatz','schreiben'],
    introducesVocabulary: ['da'], learningTargets: ['vocab:da'], contextTag: 'beginner-foundation', contentKey: 'intro-da',
  },
  {
    id: 'b0-ne-intro', lesson: 1, type: 'introduce', modality: 'text',
    prompt: '„Ne“ bedeutet „nein“. Tippe das slowenische Wort für „nein“.',
    answer: 'ne', level: 'A1', difficulty: 1, skills: ['wortschatz','schreiben'],
    introducesVocabulary: ['ne'], learningTargets: ['vocab:ne'], contextTag: 'beginner-foundation', contentKey: 'intro-ne',
  },
  {
    id: 'b0-jaz-intro', lesson: 1, type: 'introduce', modality: 'text',
    prompt: '„Jaz“ bedeutet „ich“. Tippe „ich“ auf Slowenisch.',
    answer: 'jaz', level: 'A1', difficulty: 1, skills: ['wortschatz','schreiben'],
    introducesVocabulary: ['jaz'], learningTargets: ['vocab:jaz'], contextTag: 'beginner-foundation', contentKey: 'intro-jaz',
  },
  {
    id: 'b0-sem-intro', lesson: 1, type: 'introduce', modality: 'text',
    prompt: '„Sem“ bedeutet hier „ich bin“. Tippe „ich bin“ auf Slowenisch.',
    answer: 'sem', level: 'A1', difficulty: 1, skills: ['wortschatz','grammatik','schreiben'],
    requiredVocabulary: ['jaz'], introducesVocabulary: ['sem'], introducesGrammar: ['biti-1s'], learningTargets: ['vocab:sem','grammar:biti-1s'], contextTag: 'beginner-foundation', contentKey: 'intro-sem',
  },
  {
    id: 'b0-doma-intro', lesson: 1, type: 'introduce', modality: 'text',
    prompt: '„Doma“ bedeutet „zu Hause“ (an einem Ort). Tippe doma.',
    answer: 'doma', level: 'A1', difficulty: 1, skills: ['wortschatz','schreiben'],
    introducesVocabulary: ['doma'], learningTargets: ['vocab:doma'], contextTag: 'beginner-foundation', contentKey: 'intro-doma',
  },
  {
    id: 'b0-zivjo-listen', lesson: 1, type: 'listen-choice', modality: 'listening',
    prompt: 'Höre das Wort. Was bedeutet es?', audioPrompt: 'Živjo', answer: 'Hallo', alternatives: ['Hallo','Nein','Danke'],
    requiredVocabulary: ['živjo'], level: 'A1', difficulty: 1, skills: ['hören','wortschatz'], learningTargets: ['vocab:živjo'], contextTag: 'beginner-foundation', contentKey: 'listen-zivjo',
  },
  {
    id: 'b0-da-ne-choice', lesson: 1, type: 'choice', modality: 'choice',
    prompt: 'Welches Wort bedeutet „nein“?', answer: 'ne', alternatives: ['da','ne','jaz'],
    requiredVocabulary: ['da','ne'], level: 'A1', difficulty: 1, skills: ['lesen','wortschatz'], learningTargets: ['vocab:da','vocab:ne'], contextTag: 'beginner-foundation', contentKey: 'recognize-da-ne',
  },
  {
    id: 'b0-sem-doma-build', lesson: 1, type: 'fill', modality: 'text',
    prompt: 'Baue deinen ersten Mini-Satz: „Ich bin zu Hause.“ → Sem ___.', answer: 'doma',
    requiredVocabulary: ['sem','doma'], requiredGrammar: ['biti-1s'], level: 'A1', difficulty: 2, skills: ['grammatik','schreiben'], learningTargets: ['pattern:sem-doma'], contextTag: 'beginner-foundation', contentKey: 'build-sem-doma',
  },
  {
    id: 'b0-sem-doma-listen', lesson: 1, type: 'listen-choice', modality: 'listening',
    prompt: 'Höre den Mini-Satz. Was bedeutet er?', audioPrompt: 'Sem doma.', answer: 'Ich bin zu Hause.', alternatives: ['Ich bin zu Hause.','Ich gehe nach Hause.','Ich sage Hallo.'],
    requiredVocabulary: ['sem','doma'], requiredGrammar: ['biti-1s'], level: 'A1', difficulty: 2, skills: ['hören','lesen','grammatik'], learningTargets: ['pattern:sem-doma'], contextTag: 'beginner-foundation', contentKey: 'listen-sem-doma',
  },
  {
    id: 'b0-sem-doma-speak', lesson: 1, type: 'repeat-after-me', modality: 'speaking',
    prompt: 'Sprich den bekannten Satz nach.', audioPrompt: 'Sem doma.', answer: 'Sem doma.',
    requiredVocabulary: ['sem','doma'], requiredGrammar: ['biti-1s'], level: 'A1', difficulty: 2, skills: ['sprechen','hören'], learningTargets: ['pattern:sem-doma'], contextTag: 'beginner-foundation', contentKey: 'speak-sem-doma',
  },
]
