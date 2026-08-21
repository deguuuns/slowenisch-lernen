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

type VerbFormDefinition = {
  verbId: string
  person: 1 | 2 | 3
  number: 'singular'
  form: string
}

const VERB_FORMS: Record<string, VerbFormDefinition> = {
  v011:{verbId:'biti',person:1,number:'singular',form:'sem'}, v012:{verbId:'biti',person:2,number:'singular',form:'si'}, v013:{verbId:'biti',person:3,number:'singular',form:'je'},
  v021:{verbId:'delati',person:1,number:'singular',form:'delam'}, v022:{verbId:'delati',person:2,number:'singular',form:'delaš'},
  v024:{verbId:'iti',person:1,number:'singular',form:'grem'}, v025:{verbId:'iti',person:2,number:'singular',form:'greš'},
  v032:{verbId:'imeti',person:1,number:'singular',form:'imam'}, v033:{verbId:'imeti',person:2,number:'singular',form:'imaš'}, v034:{verbId:'imeti',person:1,number:'singular',form:'nimam'},
  v050:{verbId:'živeti',person:1,number:'singular',form:'živim'}, v051:{verbId:'živeti',person:2,number:'singular',form:'živiš'},
  v065:{verbId:'začeti',person:1,number:'singular',form:'začnem'}, v067:{verbId:'končati',person:1,number:'singular',form:'končam'},
  v078:{verbId:'peljati-se',person:1,number:'singular',form:'peljem se'}, v079:{verbId:'peljati-se',person:2,number:'singular',form:'pelješ se'},
  v082:{verbId:'jesti',person:1,number:'singular',form:'jem'}, v083:{verbId:'jesti',person:2,number:'singular',form:'ješ'},
  v085:{verbId:'piti',person:1,number:'singular',form:'pijem'}, v086:{verbId:'piti',person:2,number:'singular',form:'piješ'},
  v107:{verbId:'želeti',person:1,number:'singular',form:'želim'},
}

type VerbIntroForm = { person:1|2|3; pronounSl:string; formSl:string; translationDe:string }
type VerbIntroDefinition = { verbId:string; infinitiveSl:string; infinitiveDe:string; forms:VerbIntroForm[] }

const VERB_INTROS: Record<string, VerbIntroDefinition> = {
  biti:{verbId:'biti',infinitiveSl:'biti',infinitiveDe:'sein',forms:[{person:1,pronounSl:'jaz',formSl:'sem',translationDe:'ich bin'},{person:2,pronounSl:'ti',formSl:'si',translationDe:'du bist'},{person:3,pronounSl:'on / ona / ono',formSl:'je',translationDe:'er / sie / es ist'}]},
  delati:{verbId:'delati',infinitiveSl:'delati',infinitiveDe:'arbeiten / machen',forms:[{person:1,pronounSl:'jaz',formSl:'delam',translationDe:'ich arbeite / mache'},{person:2,pronounSl:'ti',formSl:'delaš',translationDe:'du arbeitest / machst'},{person:3,pronounSl:'on / ona / ono',formSl:'dela',translationDe:'er / sie / es arbeitet / macht'}]},
  iti:{verbId:'iti',infinitiveSl:'iti',infinitiveDe:'gehen',forms:[{person:1,pronounSl:'jaz',formSl:'grem',translationDe:'ich gehe'},{person:2,pronounSl:'ti',formSl:'greš',translationDe:'du gehst'},{person:3,pronounSl:'on / ona / ono',formSl:'gre',translationDe:'er / sie / es geht'}]},
  imeti:{verbId:'imeti',infinitiveSl:'imeti',infinitiveDe:'haben',forms:[{person:1,pronounSl:'jaz',formSl:'imam',translationDe:'ich habe'},{person:2,pronounSl:'ti',formSl:'imaš',translationDe:'du hast'},{person:3,pronounSl:'on / ona / ono',formSl:'ima',translationDe:'er / sie / es hat'}]},
  živeti:{verbId:'živeti',infinitiveSl:'živeti',infinitiveDe:'leben / wohnen',forms:[{person:1,pronounSl:'jaz',formSl:'živim',translationDe:'ich lebe / wohne'},{person:2,pronounSl:'ti',formSl:'živiš',translationDe:'du lebst / wohnst'},{person:3,pronounSl:'on / ona / ono',formSl:'živi',translationDe:'er / sie / es lebt / wohnt'}]},
  začeti:{verbId:'začeti',infinitiveSl:'začeti',infinitiveDe:'anfangen',forms:[{person:1,pronounSl:'jaz',formSl:'začnem',translationDe:'ich fange an'},{person:2,pronounSl:'ti',formSl:'začneš',translationDe:'du fängst an'},{person:3,pronounSl:'on / ona / ono',formSl:'začne',translationDe:'er / sie / es fängt an'}]},
  končati:{verbId:'končati',infinitiveSl:'končati',infinitiveDe:'beenden',forms:[{person:1,pronounSl:'jaz',formSl:'končam',translationDe:'ich beende / bin fertig'},{person:2,pronounSl:'ti',formSl:'končaš',translationDe:'du beendest / bist fertig'},{person:3,pronounSl:'on / ona / ono',formSl:'konča',translationDe:'er / sie / es beendet / ist fertig'}]},
  'peljati-se':{verbId:'peljati-se',infinitiveSl:'peljati se',infinitiveDe:'fahren',forms:[{person:1,pronounSl:'jaz',formSl:'peljem se',translationDe:'ich fahre'},{person:2,pronounSl:'ti',formSl:'pelješ se',translationDe:'du fährst'},{person:3,pronounSl:'on / ona / ono',formSl:'pelje se',translationDe:'er / sie / es fährt'}]},
  jesti:{verbId:'jesti',infinitiveSl:'jesti',infinitiveDe:'essen',forms:[{person:1,pronounSl:'jaz',formSl:'jem',translationDe:'ich esse'},{person:2,pronounSl:'ti',formSl:'ješ',translationDe:'du isst'},{person:3,pronounSl:'on / ona / ono',formSl:'je',translationDe:'er / sie / es isst'}]},
  piti:{verbId:'piti',infinitiveSl:'piti',infinitiveDe:'trinken',forms:[{person:1,pronounSl:'jaz',formSl:'pijem',translationDe:'ich trinke'},{person:2,pronounSl:'ti',formSl:'piješ',translationDe:'du trinkst'},{person:3,pronounSl:'on / ona / ono',formSl:'pije',translationDe:'er / sie / es trinkt'}]},
  želeti:{verbId:'želeti',infinitiveSl:'želeti',infinitiveDe:'wollen / wünschen',forms:[{person:1,pronounSl:'jaz',formSl:'želim',translationDe:'ich möchte / wünsche'},{person:2,pronounSl:'ti',formSl:'želiš',translationDe:'du möchtest / wünschst'},{person:3,pronounSl:'on / ona / ono',formSl:'želi',translationDe:'er / sie / es möchte / wünscht'}]},
}

export function verbFormKey(requirement: VerbFormRequirement) {
  return `${requirement.verbId}:${requirement.number}:${requirement.person}`
}

export function isVerbFormVocabularyId(id: string) {
  return Boolean(VERB_FORMS[id])
}

export function inferRequiredVerbForms(exercise: Exercise): VerbFormRequirement[] {
  const forms = (exercise.vocabularyIds || []).map(id => VERB_FORMS[id]).filter(Boolean)
  const seen = new Set<string>()
  return forms
    .filter(form => {
      const key = verbFormKey(form)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map(({ verbId, person, number }) => ({ verbId, person, number }))
}

export function singularVerbIntroForVocabulary(ids: string[]) {
  const verbIds = Array.from(new Set(ids.map(id => VERB_FORMS[id]?.verbId).filter(Boolean))) as string[]
  return verbIds
    .map(verbId => {
      const definition = VERB_INTROS[verbId]
      if (!definition) return null
      return {
        ...definition,
        title: `${definition.infinitiveSl} – ${definition.infinitiveDe}`,
        keys: definition.forms.map(form =>
          verbFormKey({ verbId, person: form.person, number: 'singular' }),
        ),
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
