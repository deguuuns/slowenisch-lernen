import {
  isRegisteredVerbFormVocabularyId,
  singularVerbIntroFromRegistry,
  verbRequirementForVocabularyId,
} from '@/lib/content-registry'
import { VERB_UNLOCK_THRESHOLDS } from '@/lib/learning-config'
import { Exercise, UserProgress, VerbFormRequirement, Vocabulary } from '@/types'

export type GrammarRuleDefinition = {
  id: string
  title: string
  body: string
  examples: string[]
  requires?: string[]
}

export const GRAMMAR_RULES: Record<string, GrammarRuleDefinition> = {
  'greeting-basic': { id:'greeting-basic', title:'Begrüßungen', body:'Begrüßungen lernst du als feste Wendungen. Achte darauf, wer angesprochen wird.', examples:['Živjo!','Dober dan!','Kako si?'] },
  'location-static-v-locative': { id:'location-static-v-locative', title:'Wo? – v + Lokativ', body:'Wenn du sagst, wo du bist, steht nach v eine Ortsform.', examples:['Sem v Sloveniji.','Živim v Nemčiji.'] },
  'direction-v-accusative': { id:'direction-v-accusative', title:'Wohin? – v + Akkusativ', body:'Bei einer Richtung verändert sich die Form nach v.', examples:['Grem v službo.','Grem v restavracijo.'], requires:['location-static-v-locative'] },
  'source-iz-genitive': { id:'source-iz-genitive', title:'Woher? – iz', body:'Für Herkunft verwendest du iz mit der passenden Herkunftsform.', examples:['Sem iz Nemčije.'] },
  'dual-masculine-numeral': { id:'dual-masculine-numeral', title:'Dual: zwei männliche Personen/Dinge', body:'Slowenisch hat für genau zwei eine eigene Zahlform. Bei männlichen Wörtern steht hier dva.', examples:['dva brata','dva sina'], requires:['number-basics'] },
  'number-basics': { id:'number-basics', title:'Zahlen als Grammatiksignal', body:'Zahlen beeinflussen im Slowenischen die Form des folgenden Wortes.', examples:['en brat','dva brata','tri bratje'] },
  'accusative-family': { id:'accusative-family', title:'Familienwörter als Objekt', body:'Nach imam stehen manche Familienwörter in einer veränderten Form.', examples:['Imam brata.','Imam sina.'] },
  'accusative-feminine-a-o': { id:'accusative-feminine-a-o', title:'Akkusativ feminin: -a → -o', body:'Viele feminine Wörter auf -a ändern sich als direktes Objekt zu -o.', examples:['voda → vodo','pica → pico','kava → kavo'] },
  'negation-imeti': { id:'negation-imeti', title:'imeti verneinen', body:'Die Verneinung von imam lautet nimam.', examples:['Imam čas.','Nimam časa.'] },
  'genitive-after-negation': { id:'genitive-after-negation', title:'Nach Verneinung', body:'Nach einer Verneinung kann sich die Form des Nomens verändern.', examples:['Nimam časa.'], requires:['negation-imeti'] },
  'age-expression': { id:'age-expression', title:'Alter sagen', body:'Das Alter wird mit star/stara + sem ausgedrückt.', examples:['Star sem šest let.'] },
  'time-ob-locative': { id:'time-ob-locative', title:'Uhrzeit mit ob', body:'Für „um ... Uhr“ verwendest du ob mit der passenden Zeitform.', examples:['ob osmih','ob desetih'] },
  'direction-domov': { id:'direction-domov', title:'Nach Hause: domov', body:'Für die Richtung „nach Hause“ benutzt du domov.', examples:['Grem domov.'] },
  'verb-first-person': { id:'verb-first-person', title:'Verbformen im Präsens', body:'Neue Verben lernst du zuerst im Singular: ich, du, er/sie/es. Erst danach werden weitere Personen freigeschaltet.', examples:['jaz imam · ti imaš · on/ona ima','jaz pijem · ti piješ · on/ona pije'] },
  'politeness-prosim': { id:'politeness-prosim', title:'Höflich mit prosim', body:'prosim kann wie „bitte“ verwendet werden.', examples:['Kavo, prosim.','Prosim, počasi.'] },
  'predicate-adjective': { id:'predicate-adjective', title:'Zustand beschreiben', body:'Adjektive können mit sem einen Zustand ausdrücken.', examples:['Lačen sem.','Žejen sem.'] },
  'polite-request-lahko': { id:'polite-request-lahko', title:'Höfliche Bitte mit lahko', body:'Mit lahko kannst du höflich nach einer Möglichkeit fragen.', examples:['Lahko ponovite?'] },
  'verbal-negation': { id:'verbal-negation', title:'Verben verneinen', body:'Viele Verben werden mit ne verneint.', examples:['Ne razumem.','Ne jem mesa.'] },
  'restaurant-quantity': { id:'restaurant-quantity', title:'Mengen beim Bestellen', body:'Beim Bestellen ändern Mengenangaben manchmal die Form.', examples:['Še eno pivo, prosim.'] },
}

export function verbFormKey(requirement: VerbFormRequirement) {
  return `${requirement.verbId}:${requirement.number}:${requirement.person}`
}

export function isVerbFormVocabularyId(id: string) {
  return isRegisteredVerbFormVocabularyId(id)
}

export function inferRequiredVerbForms(exercise: Exercise): VerbFormRequirement[] {
  const forms = (exercise.vocabularyIds || [])
    .map(id => verbRequirementForVocabularyId(id))
    .filter((value): value is VerbFormRequirement => Boolean(value))
  const seen = new Set<string>()
  return forms.filter(form => {
    const key = verbFormKey(form)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function singularVerbIntroForVocabulary(ids: string[]) {
  const verbIds = Array.from(new Set(
    ids.map(id => verbRequirementForVocabularyId(id)?.verbId).filter((value): value is string => Boolean(value)),
  ))
  return verbIds
    .map(verbId => {
      const definition = singularVerbIntroFromRegistry(verbId)
      if (!definition) return null
      return {
        ...definition,
        title: `${definition.infinitiveSl} – ${definition.infinitiveDe}`,
        keys: definition.forms.map(form => verbFormKey({ verbId, person:form.person, number:'singular' })),
      }
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
}

export function grammarPrerequisitesMet(
  ruleId: string,
  progress: UserProgress,
  allowRules: string[] = [],
) {
  const introduced = new Set([...progress.introducedGrammarRules, ...allowRules])
  return (GRAMMAR_RULES[ruleId]?.requires || []).every(rule => introduced.has(rule))
}

function normalVerbFormReady(progress: UserProgress, requirement: VerbFormRequirement) {
  const key = verbFormKey(requirement)
  const mastery = progress.mastery?.[`verb:${key}`]
  return Boolean(
    progress.introducedVerbForms.includes(key) &&
    mastery &&
    mastery.attempts >= VERB_UNLOCK_THRESHOLDS.minAttemptsPerForm &&
    (mastery.activeCorrect || 0) >= VERB_UNLOCK_THRESHOLDS.minActiveCorrectPerForm &&
    mastery.score >= VERB_UNLOCK_THRESHOLDS.minimumScore,
  )
}

export function isExerciseEligible(
  exercise: Exercise,
  progress: UserProgress,
  options: {
    allowVocabularyIds?: string[]
    allowGrammarRuleIds?: string[]
    allowVerbForms?: string[]
  } = {},
): boolean {
  const words = new Set([...progress.introducedWords, ...(options.allowVocabularyIds || [])])
  const rules = new Set([...progress.introducedGrammarRules, ...(options.allowGrammarRuleIds || [])])
  const forms = new Set([...progress.introducedVerbForms, ...(options.allowVerbForms || [])])

  if ((exercise.vocabularyIds || []).some(id => !words.has(id))) return false
  for (const rule of exercise.grammarRuleIds || []) {
    if (!rules.has(rule) || !grammarPrerequisitesMet(rule, progress, options.allowGrammarRuleIds || [])) return false
  }

  const required = exercise.requiredVerbForms?.length
    ? exercise.requiredVerbForms
    : inferRequiredVerbForms(exercise)
  if (exercise.verbPractice) return required.every(requirement => forms.has(verbFormKey(requirement)))
  return !required.some(requirement => !normalVerbFormReady(progress, requirement))
}

export function pendingGrammarForExercises(exercises: Exercise[], progress: UserProgress) {
  return Array.from(new Set(exercises.flatMap(exercise => exercise.grammarRuleIds || [])))
    .filter(id => !progress.introducedGrammarRules.includes(id) && grammarPrerequisitesMet(id, progress))
}

export function grammarDefinitions(ids: string[]) {
  return ids.map(id => GRAMMAR_RULES[id] || {
    id,
    title: id,
    body: 'Diese Struktur wird jetzt kurz eingeführt, bevor du sie übst.',
    examples: [],
  })
}

export function exerciseUsesOnlyKnownContent(exercise: Exercise, progress: UserProgress) {
  return isExerciseEligible(exercise, progress)
}

export function knownVocabularyIds(progress: UserProgress, vocabulary: Vocabulary[]) {
  const known = new Set(progress.introducedWords)
  return vocabulary.filter(word => known.has(word.id)).map(word => word.id)
}
