import { Exercise, UserProgress, VerbFormRequirement, Vocabulary } from '@/types'

export type GrammarRuleDefinition={id:string;title:string;body:string;examples:string[];requires?:string[]}
export const GRAMMAR_RULES:Record<string,GrammarRuleDefinition>={
 'greeting-basic':{id:'greeting-basic',title:'Begrüßungen',body:'Begrüßungen lernst du als feste Wendungen. Achte darauf, wer angesprochen wird.',examples:['Živjo!','Dober dan!','Kako si?']},
 'location-static-v-locative':{id:'location-static-v-locative',title:'Wo? – v + Lokativ',body:'Wenn du sagst, wo du bist, steht nach v eine Ortsform.',examples:['Sem v Sloveniji.','Živim v Nemčiji.']},
 'direction-v-accusative':{id:'direction-v-accusative',title:'Wohin? – v + Akkusativ',body:'Bei einer Richtung verändert sich die Form nach v.',examples:['Grem v službo.','Grem v restavracijo.'],requires:['location-static-v-locative']},
 'source-iz-genitive':{id:'source-iz-genitive',title:'Woher? – iz',body:'Für Herkunft verwendest du iz mit der passenden Herkunftsform.',examples:['Sem iz Nemčije.']},
 'dual-masculine-numeral':{id:'dual-masculine-numeral',title:'Dual: zwei männliche Personen/Dinge',body:'Slowenisch hat für genau zwei eine eigene Zahlform. Bei männlichen Wörtern steht hier dva.',examples:['dva brata','dva sina'],requires:['number-basics']},
 'number-basics':{id:'number-basics',title:'Zahlen als Grammatiksignal',body:'Zahlen beeinflussen im Slowenischen die Form des folgenden Wortes.',examples:['en brat','dva brata','tri bratje']},
 'accusative-family':{id:'accusative-family',title:'Familienwörter als Objekt',body:'Nach imam stehen manche Familienwörter in einer veränderten Form.',examples:['Imam brata.','Imam sina.']},
 'accusative-feminine-a-o':{id:'accusative-feminine-a-o',title:'Akkusativ feminin: -a → -o',body:'Viele feminine Wörter auf -a ändern sich als direktes Objekt zu -o.',examples:['voda → vodo','pica → pico','kava → kavo']},
 'negation-imeti':{id:'negation-imeti',title:'imeti verneinen',body:'Die Verneinung von imam lautet nimam.',examples:['Imam čas.','Nimam časa.']},
 'genitive-after-negation':{id:'genitive-after-negation',title:'Nach Verneinung',body:'Nach einer Verneinung kann sich die Form des Nomens verändern.',examples:['Nimam časa.'],requires:['negation-imeti']},
 'age-expression':{id:'age-expression',title:'Alter sagen',body:'Das Alter wird mit star/stara + sem ausgedrückt.',examples:['Star sem 35 let.']},
 'time-ob-locative':{id:'time-ob-locative',title:'Uhrzeit mit ob',body:'Für „um ... Uhr“ verwendest du ob mit der passenden Zeitform.',examples:['ob osmih','ob desetih']},
 'direction-domov':{id:'direction-domov',title:'Nach Hause: domov',body:'Für die Richtung „nach Hause“ benutzt du domov.',examples:['Grem domov.']},
 'verb-first-person':{id:'verb-first-person',title:'Verbformen im Präsens',body:'Neue Verben lernst du zuerst im Singular: ich, du, er/sie/es. Erst danach werden weitere Personen freigeschaltet.',examples:['jaz imam · ti imaš · on/ona ima','jaz pijem · ti piješ · on/ona pije']},
 'politeness-prosim':{id:'politeness-prosim',title:'Höflich mit prosim',body:'prosim kann wie „bitte“ verwendet werden.',examples:['Kavo, prosim.','Prosim, počasi.']},
 'predicate-adjective':{id:'predicate-adjective',title:'Zustand beschreiben',body:'Adjektive können mit sem einen Zustand ausdrücken.',examples:['Lačen sem.','Žejen sem.']},
 'polite-request-lahko':{id:'polite-request-lahko',title:'Höfliche Bitte mit lahko',body:'Mit lahko kannst du höflich nach einer Möglichkeit fragen.',examples:['Lahko ponovite?']},
 'verbal-negation':{id:'verbal-negation',title:'Verben verneinen',body:'Viele Verben werden mit ne verneint.',examples:['Ne razumem.','Ne jem mesa.']},
 'restaurant-quantity':{id:'restaurant-quantity',title:'Mengen beim Bestellen',body:'Beim Bestellen ändern Mengenangaben manchmal die Form.',examples:['Še eno pivo, prosim.']}
}

const VERB_FORMS:Record<string,{verbId:string;person:1|2|3;number:'singular';form:string}>= {
 v011:{verbId:'biti',person:1,number:'singular',form:'sem'},v012:{verbId:'biti',person:2,number:'singular',form:'si'},v013:{verbId:'biti',person:3,number:'singular',form:'je'},
 v021:{verbId:'delati',person:1,number:'singular',form:'delam'},v022:{verbId:'delati',person:2,number:'singular',form:'delaš'},
 v024:{verbId:'iti',person:1,number:'singular',form:'grem'},v025:{verbId:'iti',person:2,number:'singular',form:'greš'},
 v032:{verbId:'imeti',person:1,number:'singular',form:'imam'},v033:{verbId:'imeti',person:2,number:'singular',form:'imaš'},v034:{verbId:'imeti',person:1,number:'singular',form:'nimam'},
 v050:{verbId:'živeti',person:1,number:'singular',form:'živim'},v051:{verbId:'živeti',person:2,number:'singular',form:'živiš'},
 v065:{verbId:'začeti',person:1,number:'singular',form:'začnem'},v067:{verbId:'končati',person:1,number:'singular',form:'končam'},
 v078:{verbId:'peljati-se',person:1,number:'singular',form:'peljem se'},v079:{verbId:'peljati-se',person:2,number:'singular',form:'pelješ se'},
 v082:{verbId:'jesti',person:1,number:'singular',form:'jem'},v083:{verbId:'jesti',person:2,number:'singular',form:'ješ'},
 v085:{verbId:'piti',person:1,number:'singular',form:'pijem'},v086:{verbId:'piti',person:2,number:'singular',form:'piješ'}
}

const THIRD_PERSON:Record<string,string>={biti:'je',delati:'dela',iti:'gre',imeti:'ima',živeti:'živi',začeti:'začne',končati:'konča','peljati-se':'pelje se',jesti:'je',piti:'pije'}
const FIRST_SECOND:Record<string,[string,string]>={biti:['sem','si'],delati:['delam','delaš'],iti:['grem','greš'],imeti:['imam','imaš'],živeti:['živim','živiš'],začeti:['začnem','začneš'],končati:['končam','končaš'],'peljati-se':['peljem se','pelješ se'],jesti:['jem','ješ'],piti:['pijem','piješ']}
export function verbFormKey(r:VerbFormRequirement){return `${r.verbId}:${r.number}:${r.person}`}
export function inferRequiredVerbForms(ex:Exercise):VerbFormRequirement[]{const forms=(ex.vocabularyIds||[]).map(id=>VERB_FORMS[id]).filter(Boolean);const seen=new Set<string>();return forms.filter(f=>{const k=verbFormKey(f);if(seen.has(k))return false;seen.add(k);return true}).map(({verbId,person,number})=>({verbId,person,number}))}
export function singularVerbIntroForVocabulary(ids:string[]){const verbIds=Array.from(new Set(ids.map(id=>VERB_FORMS[id]?.verbId).filter(Boolean))) as string[];return verbIds.map(verbId=>{const [first,second]=FIRST_SECOND[verbId]||['',''];return {verbId,title:`${verbId}: Präsens Singular`,forms:[`jaz ${first}`,`ti ${second}`,`on/ona ${THIRD_PERSON[verbId]||''}`],keys:[1,2,3].map(person=>verbFormKey({verbId,person:person as 1|2|3,number:'singular'}))}})}

export function grammarPrerequisitesMet(ruleId:string,progress:UserProgress,allowRules:string[]=[]){const introduced=new Set([...progress.introducedGrammarRules,...allowRules]);return (GRAMMAR_RULES[ruleId]?.requires||[]).every(r=>introduced.has(r))}
export function isExerciseEligible(ex:Exercise,progress:UserProgress,options:{allowVocabularyIds?:string[];allowGrammarRuleIds?:string[];allowVerbForms?:string[]}={}):boolean{
 const words=new Set([...progress.introducedWords,...(options.allowVocabularyIds||[])]),rules=new Set([...progress.introducedGrammarRules,...(options.allowGrammarRuleIds||[])]),forms=new Set([...progress.introducedVerbForms,...(options.allowVerbForms||[])])
 if((ex.vocabularyIds||[]).some(id=>!words.has(id)))return false
 for(const rule of ex.grammarRuleIds||[]){if(!rules.has(rule)||!grammarPrerequisitesMet(rule,progress,options.allowGrammarRuleIds||[]))return false}
 const required=ex.requiredVerbForms?.length?ex.requiredVerbForms:inferRequiredVerbForms(ex)
 if(required.some(r=>!forms.has(verbFormKey(r))))return false
 return true
}
export function pendingGrammarForExercises(exercises:Exercise[],progress:UserProgress){return Array.from(new Set(exercises.flatMap(e=>e.grammarRuleIds||[]))).filter(id=>!progress.introducedGrammarRules.includes(id)&&grammarPrerequisitesMet(id,progress))}
export function grammarDefinitions(ids:string[]){return ids.map(id=>GRAMMAR_RULES[id]||{id,title:id,body:'Diese Struktur wird jetzt kurz eingeführt, bevor du sie übst.',examples:[]})}
export function exerciseUsesOnlyKnownContent(ex:Exercise,progress:UserProgress){return isExerciseEligible(ex,progress)}
export function knownVocabularyIds(progress:UserProgress,vocabulary:Vocabulary[]){const known=new Set(progress.introducedWords);return vocabulary.filter(v=>known.has(v.id)).map(v=>v.id)}
