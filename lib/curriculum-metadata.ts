import { inferRequiredVerbForms } from '@/lib/curriculum-access'
import { Exercise, SkillTarget } from '@/types'

export type ExerciseCurriculumMeta = Pick<
  Exercise,
  'vocabularyIds' | 'grammarRuleIds' | 'evaluationMode' | 'acceptedAnswers' | 'difficulty' | 'requiredVerbForms'
> & {
  lesson?: number
  skillTargets?: SkillTarget[]
}

const META: Record<string, ExerciseCurriculumMeta> = {
  e01:{vocabularyIds:['v001','v012'],grammarRuleIds:['greeting-basic','verb-first-person'],evaluationMode:'acceptedVariants',acceptedAnswers:['Živjo, kako si?'],difficulty:'easy'},
  e02:{vocabularyIds:['v011'],grammarRuleIds:['location-static-v-locative','verb-first-person'],evaluationMode:'acceptedVariants',acceptedAnswers:['Jaz sem v Sloveniji.'],difficulty:'easy'},
  e03:{lesson:3,vocabularyIds:['v015','v077'],grammarRuleIds:['direction-v-accusative'],evaluationMode:'acceptedVariants',acceptedAnswers:[],difficulty:'normal'},
  e04:{vocabularyIds:['v028'],grammarRuleIds:['source-iz-genitive'],evaluationMode:'exact',acceptedAnswers:[],difficulty:'easy'},
  e05:{vocabularyIds:['v026'],grammarRuleIds:['location-static-v-locative'],evaluationMode:'exact',acceptedAnswers:[],difficulty:'easy'},
  e06:{vocabularyIds:['v027','v024'],grammarRuleIds:['direction-v-accusative','verb-first-person'],evaluationMode:'exact',acceptedAnswers:[],difficulty:'normal'},
  e07:{vocabularyIds:['v026','v011'],grammarRuleIds:['location-static-v-locative','verb-first-person'],evaluationMode:'open',acceptedAnswers:['Zdaj sem v Sloveniji.','Sem doma.','Zdaj sem doma.','Sem tukaj.','Zdaj sem tukaj.'],difficulty:'normal'},
  e08:{vocabularyIds:['v032','v039','v055'],grammarRuleIds:['number-basics','dual-masculine-numeral','accusative-family','verb-first-person'],evaluationMode:'grammar',acceptedAnswers:[],difficulty:'challenge'},
  e09:{vocabularyIds:['v032','v040','v054'],grammarRuleIds:['accusative-feminine-a-o','verb-first-person'],evaluationMode:'grammar',acceptedAnswers:[],difficulty:'normal'},
  e10:{vocabularyIds:['v050'],grammarRuleIds:['location-static-v-locative','verb-first-person'],evaluationMode:'acceptedVariants',acceptedAnswers:['Jaz živim v Nemčiji.'],difficulty:'easy'},
  e11:{vocabularyIds:['v034','v035'],grammarRuleIds:['negation-imeti','genitive-after-negation'],evaluationMode:'grammar',acceptedAnswers:[],difficulty:'normal'},
  e12:{vocabularyIds:['v046','v032','v039','v055'],grammarRuleIds:['number-basics','dual-masculine-numeral','accusative-family','verb-first-person'],evaluationMode:'open',acceptedAnswers:['Nimam bratov.','Imam enega brata.','Imam tri brate.'],difficulty:'challenge'},
  e13:{vocabularyIds:['v047','v060','v048'],grammarRuleIds:['age-expression'],evaluationMode:'acceptedVariants',acceptedAnswers:['Jaz sem star petintrideset let.'],difficulty:'normal'},
  e14:{vocabularyIds:['v014','v062'],grammarRuleIds:['location-static-v-locative'],evaluationMode:'acceptedVariants',acceptedAnswers:['Danes sem na delu.'],difficulty:'easy'},
  e15:{vocabularyIds:['v063','v024'],grammarRuleIds:['direction-v-accusative','verb-first-person'],evaluationMode:'acceptedVariants',acceptedAnswers:[],difficulty:'normal'},
  e16:{vocabularyIds:['v075','v059','v069'],grammarRuleIds:['time-ob-locative'],evaluationMode:'acceptedVariants',acceptedAnswers:[],difficulty:'normal'},
  e17:{vocabularyIds:['v076','v053'],grammarRuleIds:['direction-domov'],evaluationMode:'exact',acceptedAnswers:[],difficulty:'easy'},
  e18:{vocabularyIds:['v068','v065','v069'],grammarRuleIds:['time-ob-locative','verb-first-person'],evaluationMode:'open',acceptedAnswers:['Začnem delati ob pol devetih.','Delati začnem ob osmih.','Začnem delati ob osmih.'],difficulty:'normal'},
  e19:{vocabularyIds:['v080','v005'],grammarRuleIds:['politeness-prosim'],evaluationMode:'acceptedVariants',acceptedAnswers:['Prosim, govori počasi.'],difficulty:'easy'},
  e20:{vocabularyIds:['v082','v091'],grammarRuleIds:['accusative-feminine-a-o','verb-first-person'],evaluationMode:'grammar',acceptedAnswers:[],difficulty:'normal'},
  e21:{vocabularyIds:['v085','v088'],grammarRuleIds:['verb-first-person'],evaluationMode:'acceptedVariants',acceptedAnswers:[],difficulty:'easy'},
  e22:{vocabularyIds:['v085','v087'],grammarRuleIds:['accusative-feminine-a-o','verb-first-person'],evaluationMode:'grammar',acceptedAnswers:[],difficulty:'normal'},
  e23:{vocabularyIds:['v083','v082','v091'],grammarRuleIds:['accusative-feminine-a-o','verb-first-person'],evaluationMode:'open',acceptedAnswers:['Jem pico.','Danes jem kruh.','Jem kruh.','Danes jem sir.','Jem sir.'],difficulty:'normal'},
  e24:{vocabularyIds:['v086','v085','v087'],grammarRuleIds:['accusative-feminine-a-o','verb-first-person'],evaluationMode:'open',acceptedAnswers:['Pijem kavo.','Pijem pivo.','Pijem čaj.'],difficulty:'normal'},
  e25:{vocabularyIds:['v098','v011'],grammarRuleIds:['predicate-adjective','verb-first-person'],evaluationMode:'acceptedVariants',acceptedAnswers:['Jaz sem lačen.'],difficulty:'normal'},
  e26:{vocabularyIds:['v104','v005'],grammarRuleIds:['politeness-prosim'],evaluationMode:'acceptedVariants',acceptedAnswers:['Prosim, meni.'],difficulty:'easy'},
  e27:{vocabularyIds:['v105','v005'],grammarRuleIds:['politeness-prosim'],evaluationMode:'acceptedVariants',acceptedAnswers:['Prosim, račun.'],difficulty:'easy'},
  e28:{vocabularyIds:['v108','v109'],grammarRuleIds:['polite-request-lahko'],evaluationMode:'acceptedVariants',acceptedAnswers:['Lahko prosim ponovite?'],difficulty:'normal'},
  e29:{vocabularyIds:['v008','v120'],grammarRuleIds:['verbal-negation'],evaluationMode:'acceptedVariants',acceptedAnswers:[],difficulty:'normal'},
  e30:{vocabularyIds:['v111','v112','v055','v005'],grammarRuleIds:['number-basics','dual-masculine-numeral','politeness-prosim'],evaluationMode:'acceptedVariants',acceptedAnswers:['Prosim, miza za dva.'],difficulty:'challenge'},
  e31:{vocabularyIds:['v118','v119','v088','v005'],grammarRuleIds:['restaurant-quantity','politeness-prosim'],evaluationMode:'acceptedVariants',acceptedAnswers:['Še eno pivo prosim.'],difficulty:'normal'},
  e32:{vocabularyIds:['v101','v024'],grammarRuleIds:['direction-v-accusative','accusative-feminine-a-o','verb-first-person'],evaluationMode:'grammar',acceptedAnswers:[],difficulty:'challenge'},
}

function inferSkills(exercise: Exercise): SkillTarget[] {
  if (exercise.type === 'choice') return ['recognition']
  if (exercise.type === 'translate-de-sl' || exercise.type === 'free') return ['production']
  if (exercise.type === 'fill' || exercise.type === 'ending') return ['production', 'grammar-application']
  return ['grammar-application']
}

export function enrichExercise(exercise: Exercise): Exercise {
  const meta = META[exercise.id]
  const base: Exercise = {
    ...exercise,
    lesson: meta?.lesson ?? exercise.lesson,
    vocabularyIds: exercise.vocabularyIds ?? meta?.vocabularyIds ?? [],
    grammarRuleIds: exercise.grammarRuleIds ?? meta?.grammarRuleIds ?? [],
    evaluationMode: exercise.evaluationMode ?? meta?.evaluationMode ?? (exercise.type === 'free' ? 'open' : 'exact'),
    acceptedAnswers: exercise.acceptedAnswers ?? meta?.acceptedAnswers ?? [],
    skillTargets: exercise.skillTargets ?? meta?.skillTargets ?? inferSkills(exercise),
    difficulty: exercise.difficulty ?? meta?.difficulty ?? (exercise.type === 'choice' ? 'easy' : 'normal'),
  }
  return {
    ...base,
    requiredVerbForms:
      exercise.requiredVerbForms ?? meta?.requiredVerbForms ?? inferRequiredVerbForms(base),
  }
}

export function enrichExercises(items: Exercise[]): Exercise[] {
  return items.map(enrichExercise)
}

export function curriculumMetadataIssues(items: Exercise[]) {
  return enrichExercises(items).flatMap(exercise => {
    const issues: string[] = []
    if (!exercise.vocabularyIds?.length) issues.push(`${exercise.id}: keine vocabularyIds`)
    if ((exercise.type === 'fill' || exercise.type === 'ending') && !exercise.grammarRuleIds?.length) issues.push(`${exercise.id}: Formübung ohne grammarRuleIds`)
    if (exercise.type === 'free' && exercise.evaluationMode !== 'open' && exercise.evaluationMode !== 'semantic') issues.push(`${exercise.id}: freie Antwort nicht als open/semantic markiert`)
    if (!exercise.skillTargets?.length) issues.push(`${exercise.id}: keine skillTargets`)
    if (!exercise.difficulty) issues.push(`${exercise.id}: keine difficulty`)
    return issues
  })
}

export const GRAMMAR_RULE_LABELS: Record<string, string> = {
  'greeting-basic':'Begrüßungen','location-static-v-locative':'Ort: v + Lokativ','direction-v-accusative':'Richtung: v + Akkusativ','source-iz-genitive':'Herkunft: iz + Genitiv','number-basics':'Zahlen und Formen','dual-masculine-numeral':'Dual männlich: dva','accusative-family':'Familienwörter im Akkusativ','accusative-feminine-a-o':'Akkusativ feminin: -a → -o','negation-imeti':'Verneinung von imeti','genitive-after-negation':'Genitiv nach Verneinung','age-expression':'Altersangaben','time-ob-locative':'Uhrzeit mit ob','direction-domov':'Richtung: domov','verb-first-person':'Verbformen Singular','politeness-prosim':'Höflichkeit mit prosim','predicate-adjective':'Prädikatives Adjektiv','polite-request-lahko':'Höfliche Bitte mit lahko','verbal-negation':'Verbverneinung mit ne','restaurant-quantity':'Mengenangaben beim Bestellen'
}
