import { singularVerbIntroForVocabulary, verbFormKey } from '@/lib/curriculum-access'
import { VERB_UNLOCK_THRESHOLDS } from '@/lib/learning-config'
import { Exercise, UserProgress, VerbFormRequirement } from '@/types'

export { VERB_UNLOCK_THRESHOLDS } from '@/lib/learning-config'

export type VerbLearningStatus = 'LOCKED' | 'INTRODUCED' | 'LEARNING' | 'KNOWN' | 'MASTERED'

export function verbFormMasteryKey(requirement: VerbFormRequirement) {
  return `verb:${verbFormKey(requirement)}`
}

export function verbFormStatus(
  progress: UserProgress,
  requirement: VerbFormRequirement,
): VerbLearningStatus {
  const key = verbFormKey(requirement)
  const mastery = progress.mastery?.[verbFormMasteryKey(requirement)]
  if (!progress.introducedVerbForms.includes(key)) return 'LOCKED'
  if (!mastery || mastery.attempts === 0) return 'INTRODUCED'

  const ready =
    mastery.attempts >= VERB_UNLOCK_THRESHOLDS.minAttemptsPerForm &&
    (mastery.activeCorrect || 0) >= VERB_UNLOCK_THRESHOLDS.minActiveCorrectPerForm &&
    mastery.score >= VERB_UNLOCK_THRESHOLDS.minimumScore

  if (!ready) return 'LEARNING'
  if (
    mastery.score >= VERB_UNLOCK_THRESHOLDS.masteredScore &&
    mastery.attempts >= VERB_UNLOCK_THRESHOLDS.masteredAttempts
  ) return 'MASTERED'
  return 'KNOWN'
}

export function verbFormReadyForNormalPractice(
  progress: UserProgress,
  requirement: VerbFormRequirement,
) {
  const status = verbFormStatus(progress, requirement)
  return status === 'KNOWN' || status === 'MASTERED'
}

export function verbIntrosForVocabulary(ids: string[]) {
  return singularVerbIntroForVocabulary(ids).map(verb => ({
    ...verb,
    examples: verbExamples(verb.verbId),
  }))
}

function verbExamples(verbId: string) {
  const examples: Record<string, { sl: string; de: string }[]> = {
    biti: [
      { sl: 'Jaz sem tukaj.', de: 'Ich bin hier.' },
      { sl: 'Ti si doma.', de: 'Du bist zu Hause.' },
      { sl: 'Ona je tukaj.', de: 'Sie ist hier.' },
    ],
    imeti: [
      { sl: 'Jaz imam čas.', de: 'Ich habe Zeit.' },
      { sl: 'Ti imaš čas.', de: 'Du hast Zeit.' },
      { sl: 'Ona ima kavo.', de: 'Sie hat Kaffee.' },
    ],
    iti: [
      { sl: 'Jaz grem domov.', de: 'Ich gehe nach Hause.' },
      { sl: 'Ti greš domov.', de: 'Du gehst nach Hause.' },
      { sl: 'On gre domov.', de: 'Er geht nach Hause.' },
    ],
    delati: [
      { sl: 'Jaz delam.', de: 'Ich arbeite.' },
      { sl: 'Ti delaš.', de: 'Du arbeitest.' },
      { sl: 'Ona dela.', de: 'Sie arbeitet.' },
    ],
    živeti: [
      { sl: 'Jaz živim v Nemčiji.', de: 'Ich lebe in Deutschland.' },
      { sl: 'Ti živiš tukaj.', de: 'Du lebst hier.' },
      { sl: 'On živi v Sloveniji.', de: 'Er lebt in Slowenien.' },
    ],
    piti: [
      { sl: 'Jaz pijem vodo.', de: 'Ich trinke Wasser.' },
      { sl: 'Ti piješ kavo.', de: 'Du trinkst Kaffee.' },
      { sl: 'Ona pije vodo.', de: 'Sie trinkt Wasser.' },
    ],
    jesti: [
      { sl: 'Jaz jem.', de: 'Ich esse.' },
      { sl: 'Ti ješ.', de: 'Du isst.' },
      { sl: 'On je.', de: 'Er isst.' },
    ],
  }
  return examples[verbId] || []
}

export function buildVerbPracticeExercises(
  lessonId: number,
  verb: {
    verbId: string
    forms: { person: 1 | 2 | 3; pronounSl: string; formSl: string; translationDe: string }[]
  },
): Exercise[] {
  const allForms = verb.forms.map(form => form.formSl)
  const exercises: Exercise[] = []

  for (const form of verb.forms) {
    const requirement: VerbFormRequirement = {
      verbId: verb.verbId,
      person: form.person,
      number: 'singular',
    }
    const alternatives = allForms.filter(value => value !== form.formSl)
    const pronoun = form.pronounSl.split(' / ')[0]

    exercises.push(
      {
        id: `verb-${verb.verbId}-${form.person}-choice`,
        lesson: lessonId,
        type: 'choice',
        prompt: `Welche Form passt zu „${form.pronounSl}“?`,
        answer: form.formSl,
        alternatives,
        skillTargets: ['recognition'],
        requiredVerbForms: [requirement],
        evaluationMode: 'exact',
        generated: true,
        verbPractice: true,
      },
      {
        id: `verb-${verb.verbId}-${form.person}-produce`,
        lesson: lessonId,
        type: 'translate-de-sl',
        prompt: form.translationDe,
        answer: `${pronoun} ${form.formSl}`,
        acceptedAnswers: [form.formSl, `${pronoun} ${form.formSl}`],
        skillTargets: ['production'],
        requiredVerbForms: [requirement],
        evaluationMode: 'acceptedVariants',
        generated: true,
        verbPractice: true,
      },
      {
        id: `verb-${verb.verbId}-${form.person}-fill`,
        lesson: lessonId,
        type: 'fill',
        prompt: `${pronoun} ___  (${verb.verbId})`,
        answer: form.formSl,
        acceptedAnswers: [form.formSl],
        skillTargets: ['production'],
        requiredVerbForms: [requirement],
        evaluationMode: 'acceptedVariants',
        generated: true,
        verbPractice: true,
      },
    )
  }
  return exercises
}

export function allVerbFormsReady(
  progress: UserProgress,
  requirements: VerbFormRequirement[],
) {
  return requirements.every(requirement =>
    verbFormReadyForNormalPractice(progress, requirement),
  )
}
