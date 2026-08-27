import { singularVerbIntroForVocabulary, verbFormKey } from '@/lib/curriculum-access'
import { verbRequirementForVocabularyId } from '@/lib/content-registry'
import { VERB_UNLOCK_THRESHOLDS } from '@/lib/learning-config'
import { Exercise, TargetContentKey, UserProgress, VerbFormRequirement } from '@/types'

export { VERB_UNLOCK_THRESHOLDS } from '@/lib/learning-config'

export type VerbLearningStatus = 'LOCKED' | 'INTRODUCED' | 'LEARNING' | 'KNOWN' | 'MASTERED'

export function verbFormMasteryKey(requirement: VerbFormRequirement) { return `verb:${verbFormKey(requirement)}` }

export function verbFormStatus(progress: UserProgress, requirement: VerbFormRequirement): VerbLearningStatus {
  const key = verbFormKey(requirement)
  const mastery = progress.mastery?.[verbFormMasteryKey(requirement)]
  if (!progress.introducedVerbForms.includes(key)) return 'LOCKED'
  if (!mastery || mastery.attempts === 0) return 'INTRODUCED'
  const ready = mastery.attempts >= VERB_UNLOCK_THRESHOLDS.minAttemptsPerForm &&
    (mastery.activeCorrect || 0) >= VERB_UNLOCK_THRESHOLDS.minActiveCorrectPerForm &&
    mastery.score >= VERB_UNLOCK_THRESHOLDS.minimumScore
  if (!ready) return 'LEARNING'
  if (mastery.score >= VERB_UNLOCK_THRESHOLDS.masteredScore && mastery.attempts >= VERB_UNLOCK_THRESHOLDS.masteredAttempts) return 'MASTERED'
  return 'KNOWN'
}

export function verbFormReadyForNormalPractice(progress: UserProgress, requirement: VerbFormRequirement) {
  const status = verbFormStatus(progress, requirement)
  return status === 'KNOWN' || status === 'MASTERED'
}

/**
 * Return only verb forms explicitly represented by the current vocabulary atoms.
 * The full conjugation remains available in the registry for reference and later practice.
 */
export function verbIntrosForVocabulary(ids: string[]) {
  const requirements=ids.map(id=>verbRequirementForVocabularyId(id)).filter((value):value is VerbFormRequirement=>Boolean(value))
  const requirementKeys=new Set(requirements.map(verbFormKey))
  return singularVerbIntroForVocabulary(ids).map(verb => {
    const forms=verb.forms.filter(form=>requirementKeys.has(verbFormKey({verbId:verb.verbId,person:form.person,number:'singular'})))
    return {
      ...verb,
      forms,
      keys:forms.map(form=>verbFormKey({verbId:verb.verbId,person:form.person,number:'singular'})),
      examples:verbExamples(verb.verbId).filter((_,index)=>forms.some(form=>form.person===index+1)),
    }
  }).filter(verb=>verb.forms.length>0)
}

function verbExamples(verbId: string) {
  const examples: Record<string, { sl: string; de: string }[]> = {
    biti: [{ sl:'Jaz sem tukaj.',de:'Ich bin hier.'},{ sl:'Ti si doma.',de:'Du bist zu Hause.'},{ sl:'Ona je tukaj.',de:'Sie ist hier.'}],
    imeti: [{ sl:'Jaz imam čas.',de:'Ich habe Zeit.'},{ sl:'Ti imaš čas.',de:'Du hast Zeit.'},{ sl:'Ona ima kavo.',de:'Sie hat Kaffee.'}],
    iti: [{ sl:'Jaz grem domov.',de:'Ich gehe nach Hause.'},{ sl:'Ti greš domov.',de:'Du gehst nach Hause.'},{ sl:'On gre domov.',de:'Er geht nach Hause.'}],
    delati: [{ sl:'Jaz delam.',de:'Ich arbeite.'},{ sl:'Ti delaš.',de:'Du arbeitest.'},{ sl:'Ona dela.',de:'Sie arbeitet.'}],
    živeti: [{ sl:'Jaz živim v Nemčiji.',de:'Ich lebe in Deutschland.'},{ sl:'Ti živiš tukaj.',de:'Du lebst hier.'},{ sl:'On živi v Sloveniji.',de:'Er lebt in Slowenien.'}],
    piti: [{ sl:'Jaz pijem vodo.',de:'Ich trinke Wasser.'},{ sl:'Ti piješ kavo.',de:'Du trinkst Kaffee.'},{ sl:'Ona pije vodo.',de:'Sie trinkt Wasser.'}],
    jesti: [{ sl:'Jaz jem.',de:'Ich esse.'},{ sl:'Ti ješ.',de:'Du isst.'},{ sl:'On je.',de:'Er isst.'}],
    govoriti:[{sl:'Jaz govorim.',de:'Ich spreche.'},{sl:'Ti govoriš.',de:'Du sprichst.'},{sl:'Ona govori.',de:'Sie spricht.'}],
    razumeti:[{sl:'Jaz razumem.',de:'Ich verstehe.'},{sl:'Ti razumeš.',de:'Du verstehst.'},{sl:'On razume.',de:'Er versteht.'}],
  }
  return examples[verbId] || []
}

function pronounVariants(pronounSl: string) { return pronounSl.split(' / ').map(value => value.trim()).filter(Boolean) }

export function buildVerbPracticeExercises(
  lessonId: number,
  verb: { verbId:string; forms:{ person:1|2|3; pronounSl:string; formSl:string; translationDe:string }[] },
): Exercise[] {
  return verb.forms.map(form => {
    const requirement: VerbFormRequirement = { verbId:verb.verbId, person:form.person, number:'singular' }
    const pronouns = pronounVariants(form.pronounSl)
    const primary = `${pronouns[0]} ${form.formSl}`
    const target = `verb:${verbFormKey(requirement)}` as TargetContentKey
    return {
      id:`verb-${verb.verbId}-${form.person}-produce`, lesson:lessonId, type:'translate-de-sl', prompt:`Übersetze: ${form.translationDe}`, answer:primary,
      acceptedAnswers:Array.from(new Set([form.formSl,...pronouns.map(pronoun=>`${pronoun} ${form.formSl}`)])), skillTargets:['production'], requiredVerbForms:[requirement],
      evaluationMode:'acceptedVariants', generated:true, verbPractice:true, verbAnswerMode:'full-person-form', targetContentKeys:[target], learningPhase:'active-production',
    }
  })
}

export function allVerbFormsReady(progress: UserProgress, requirements: VerbFormRequirement[]) { return requirements.every(requirement => verbFormReadyForNormalPractice(progress, requirement)) }
