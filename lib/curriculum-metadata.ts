import { Exercise } from '@/types'

export type ExerciseCurriculumMeta = Pick<Exercise, 'vocabularyIds' | 'grammarRuleIds' | 'evaluationMode'>

const META: Record<string, ExerciseCurriculumMeta> = {
  e01:{vocabularyIds:['v001','v012'],grammarRuleIds:['greeting-basic'],evaluationMode:'acceptedVariants'},
  e02:{vocabularyIds:['v011'],grammarRuleIds:['location-static-v-locative'],evaluationMode:'acceptedVariants'},
  e03:{vocabularyIds:['v015','v077'],grammarRuleIds:['direction-v-accusative'],evaluationMode:'acceptedVariants'},
  e04:{vocabularyIds:['v028'],grammarRuleIds:['source-iz-genitive'],evaluationMode:'exact'},
  e05:{vocabularyIds:['v026'],grammarRuleIds:['location-static-v-locative'],evaluationMode:'exact'},
  e06:{vocabularyIds:['v027','v024'],grammarRuleIds:['direction-v-accusative'],evaluationMode:'exact'},
  e07:{vocabularyIds:['v026','v011'],grammarRuleIds:['location-static-v-locative'],evaluationMode:'open'},

  e08:{vocabularyIds:['v032','v039','v055'],grammarRuleIds:['dual-masculine-numeral','accusative-family'],evaluationMode:'grammar'},
  e09:{vocabularyIds:['v032','v040','v054'],grammarRuleIds:['accusative-feminine-a-o'],evaluationMode:'grammar'},
  e10:{vocabularyIds:['v050'],grammarRuleIds:['location-static-v-locative'],evaluationMode:'acceptedVariants'},
  e11:{vocabularyIds:['v034','v035'],grammarRuleIds:['negation-imeti','genitive-after-negation'],evaluationMode:'grammar'},
  e12:{vocabularyIds:['v046','v032','v039','v055'],grammarRuleIds:['dual-masculine-numeral','accusative-family'],evaluationMode:'open'},
  e13:{vocabularyIds:['v047','v060','v048'],grammarRuleIds:['age-expression'],evaluationMode:'acceptedVariants'},

  e14:{vocabularyIds:['v014','v062'],grammarRuleIds:['location-static-v-locative'],evaluationMode:'acceptedVariants'},
  e15:{vocabularyIds:['v063','v024'],grammarRuleIds:['direction-v-accusative'],evaluationMode:'acceptedVariants'},
  e16:{vocabularyIds:['v075','v059','v069'],grammarRuleIds:['time-ob-locative'],evaluationMode:'acceptedVariants'},
  e17:{vocabularyIds:['v076','v053'],grammarRuleIds:['direction-domov'],evaluationMode:'exact'},
  e18:{vocabularyIds:['v068','v065','v069'],grammarRuleIds:['time-ob-locative','verb-first-person'],evaluationMode:'open'},
  e19:{vocabularyIds:['v080','v005'],grammarRuleIds:['politeness-prosim'],evaluationMode:'acceptedVariants'},

  e20:{vocabularyIds:['v082','v091'],grammarRuleIds:['accusative-feminine-a-o'],evaluationMode:'grammar'},
  e21:{vocabularyIds:['v085','v088'],grammarRuleIds:['verb-first-person'],evaluationMode:'acceptedVariants'},
  e22:{vocabularyIds:['v085','v087'],grammarRuleIds:['accusative-feminine-a-o'],evaluationMode:'grammar'},
  e23:{vocabularyIds:['v083','v082','v091'],grammarRuleIds:['accusative-feminine-a-o','verb-first-person'],evaluationMode:'open'},
  e24:{vocabularyIds:['v086','v085','v087'],grammarRuleIds:['accusative-feminine-a-o','verb-first-person'],evaluationMode:'open'},
  e25:{vocabularyIds:['v098','v011'],grammarRuleIds:['predicate-adjective'],evaluationMode:'acceptedVariants'},

  e26:{vocabularyIds:['v104','v005'],grammarRuleIds:['politeness-prosim'],evaluationMode:'acceptedVariants'},
  e27:{vocabularyIds:['v105','v005'],grammarRuleIds:['politeness-prosim'],evaluationMode:'acceptedVariants'},
  e28:{vocabularyIds:['v108','v109'],grammarRuleIds:['polite-request-lahko'],evaluationMode:'acceptedVariants'},
  e29:{vocabularyIds:['v008','v120'],grammarRuleIds:['verbal-negation'],evaluationMode:'acceptedVariants'},
  e30:{vocabularyIds:['v111','v112','v055','v005'],grammarRuleIds:['dual-masculine-numeral','politeness-prosim'],evaluationMode:'acceptedVariants'},
  e31:{vocabularyIds:['v118','v119','v088','v005'],grammarRuleIds:['restaurant-quantity','politeness-prosim'],evaluationMode:'acceptedVariants'},
  e32:{vocabularyIds:['v101','v024'],grammarRuleIds:['direction-v-accusative','accusative-feminine-a-o'],evaluationMode:'grammar'},
}

export function enrichExercise(exercise:Exercise):Exercise {
  const meta=META[exercise.id]
  return {
    ...exercise,
    vocabularyIds:exercise.vocabularyIds??meta?.vocabularyIds??[],
    grammarRuleIds:exercise.grammarRuleIds??meta?.grammarRuleIds??[],
    evaluationMode:exercise.evaluationMode??meta?.evaluationMode??(exercise.type==='free'?'open':'exact')
  }
}

export function enrichExercises(exercises:Exercise[]):Exercise[]{ return exercises.map(enrichExercise) }

export function curriculumMetadataIssues(exercises:Exercise[]){
  const enriched=enrichExercises(exercises)
  return enriched.flatMap(ex=>{
    const issues:string[]=[]
    if(!ex.vocabularyIds?.length) issues.push(`${ex.id}: keine vocabularyIds`)
    if((ex.type==='fill'||ex.type==='ending')&&!ex.grammarRuleIds?.length) issues.push(`${ex.id}: Formübung ohne grammarRuleIds`)
    if(ex.type==='free'&&ex.evaluationMode!=='open'&&ex.evaluationMode!=='semantic') issues.push(`${ex.id}: freie Antwort nicht als open/semantic markiert`)
    return issues
  })
}

export const GRAMMAR_RULE_LABELS:Record<string,string>={
  'greeting-basic':'Begrüßungen',
  'location-static-v-locative':'Ort: v + Lokativ',
  'direction-v-accusative':'Richtung: v + Akkusativ',
  'source-iz-genitive':'Herkunft: iz + Genitiv',
  'dual-masculine-numeral':'Dual männlich: dva',
  'accusative-family':'Familienwörter im Akkusativ',
  'accusative-feminine-a-o':'Akkusativ feminin: -a → -o',
  'negation-imeti':'Verneinung von imeti',
  'genitive-after-negation':'Genitiv nach Verneinung',
  'age-expression':'Altersangaben',
  'time-ob-locative':'Uhrzeit mit ob',
  'direction-domov':'Richtung: domov',
  'verb-first-person':'Verbform 1. Person Singular',
  'politeness-prosim':'Höflichkeit mit prosim',
  'predicate-adjective':'Prädikatives Adjektiv',
  'polite-request-lahko':'Höfliche Bitte mit lahko',
  'verbal-negation':'Verbverneinung mit ne',
  'restaurant-quantity':'Mengenangaben beim Bestellen'
}
