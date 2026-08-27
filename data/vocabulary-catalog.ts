import { vocabulary as seedVocabulary } from '@/data/seed'
import { laterLessonVocabulary } from '@/data/vocabulary-lessons-6-8'
import type { ContentType, TargetContentKey, Vocabulary, VocabularyPriority, VocabularyTopic } from '@/types'

export const CONTENT_VERSION = 3

/** IDs that existed briefly in the V2 branch but duplicated an older canonical lexeme. */
export const legacyProgressVocabularyMap:Record<string,string>={
  v189:'v120', // razumeti
  v214:'v115', // mleko
  v215:'v105', // račun
  v216:'v113', // brez
  v217:'v116', // z
}

const lemmaAliases:Record<string,string>={
  sem:'biti',si:'biti',je:'biti',delam:'delati',delaš:'delati',grem:'iti',greš:'iti',
  imam:'imeti',imaš:'imeti',nimam:'imeti',živim:'živeti',živiš:'živeti',
  začnem:'začeti',končam:'končati','peljem se':'peljati se','pelješ se':'peljati se',
  jem:'jesti',ješ:'jesti',pijem:'piti',piješ:'piti',želim:'želeti',razumem:'razumeti',govorim:'govoriti',
}

const parentById:Record<string,string>={
  v011:'v231',v012:'v231',v013:'v231',
  v021:'v020',v022:'v020',v024:'v023',v025:'v023',v032:'v031',v033:'v031',v034:'v031',
  v050:'v049',v051:'v049',v065:'v064',v067:'v066',v078:'v077',v079:'v077',
  v082:'v081',v083:'v081',v085:'v084',v086:'v084',v107:'v233',v234:'v120',
}

const explicitPrerequisites:Record<string,TargetContentKey[]>={
  v181:['vocab:v001'],
  v231:['vocab:v181'],
  v010:['vocab:v231'],
  v012:['vocab:v231','vocab:v010'],
  v009:['vocab:v231'],
  v011:['vocab:v231','vocab:v009'],
  v013:['vocab:v231'],
  v182:['vocab:v013'],
  v026:['vocab:v012'],
  v027:['vocab:v023'],
  v028:['vocab:v012'],
  v190:['vocab:v120'],
  v191:['vocab:v190'],
  v192:['vocab:v190'],
  v232:['vocab:v171'],
  v234:['vocab:v120'],
}

const lessonOneSequence:Record<string,number>={
  v001:10,v181:20,v231:30,v010:40,v012:50,v009:60,v011:70,v013:80,
  v002:90,v003:100,v004:110,v006:120,v005:130,v007:140,v008:150,
  v182:160,v026:170,v028:180,v023:190,v024:200,v027:210,v014:220,v015:230,
  v016:240,v018:250,v019:260,v020:270,v021:280,v022:290,v030:300,
  v120:310,v234:320,v190:330,v191:340,v192:350,v193:360,v194:370,v183:380,v184:390,v185:400,v186:410,v187:420,v188:430,
}

function topicFor(word:Vocabulary):VocabularyTopic{
  const source=`${word.category} ${(word.tags||[]).join(' ')}`.toLowerCase()
  if(/begrü|höf|gespräch|frage|sprache/.test(source))return 'basics'
  if(/famil/.test(source))return 'family'
  if(/person/.test(source))return 'people'
  if(/zahl|zeit|tagesablauf/.test(source))return 'numbers-time'
  if(/essen|getränk|restaurant/.test(source))return 'food-drink'
  if(/einkauf|shopping|farbe|clothing|kleidung/.test(source))return 'shopping'
  if(/unterwegs|reise|verkehr|travel/.test(source))return 'travel'
  if(/zuhause|home/.test(source))return 'home'
  if(/arbeit/.test(source))return 'work'
  if(/wetter/.test(source))return 'weather'
  if(/hilfe|gesund|health/.test(source))return 'health'
  if(/freizeit|hobby/.test(source))return 'free-time'
  if(/pronomen|präposition|konjunktion|partikel/.test(word.partOfSpeech.toLowerCase()))return 'function-words'
  return 'other'
}

function priorityFor(word:Vocabulary):VocabularyPriority{
  if(word.sequence&&word.sequence<=150)return 1
  const pos=word.partOfSpeech.toLowerCase()
  if(word.lesson<=2||/pronomen|fragewort|interjektion|partikel|konjunktion/.test(pos))return 1
  if(/verb/.test(pos)||word.lesson<=4)return 2
  if(word.lesson<=6)return 3
  return 4
}

function unitFor(topic:VocabularyTopic){
  const units:Record<VocabularyTopic,string>={
    basics:'A1.1 Grundlagen',people:'A1.2 Personen und Herkunft',family:'A1.3 Familie und Beziehungen',
    'numbers-time':'A1.4 Zeit und Alltag','food-drink':'A1.5 Essen und Trinken',shopping:'A1.6 Einkaufen und Kleidung',
    travel:'A1.7 Unterwegs',home:'A1.8 Wohnen, Wetter und Hilfe',work:'A1.4 Zeit und Alltag',weather:'A1.8 Wohnen, Wetter und Hilfe',health:'A1.8 Wohnen, Wetter und Hilfe',
    clothing:'A1.6 Einkaufen und Kleidung','free-time':'A1.4 Zeit und Alltag','function-words':'A1.1 Grundlagen',other:'A1 Grundwortschatz',
  }
  return units[topic]
}

function contentTypeFor(word:Vocabulary):ContentType{
  if(parentById[word.id])return 'form'
  if(/phrase|grußformel/i.test(word.partOfSpeech))return 'phrase'
  return 'lexeme'
}

function enrich(word:Vocabulary):Vocabulary{
  const topic=word.topic||topicFor(word)
  return {
    ...word,
    cefrLevel:word.cefrLevel||'A1',
    lemma:word.lemma||lemmaAliases[word.sl]||(/verb/i.test(word.partOfSpeech)&&!parentById[word.id]?word.sl:undefined),
    priority:word.priority||priorityFor({...word,sequence:word.sequence||lessonOneSequence[word.id]}),
    topic,
    curriculumUnit:word.curriculumUnit||unitFor(topic),
    tags:Array.from(new Set([...(word.tags||[]),'a1-core'])),
    contentType:word.contentType||contentTypeFor(word),
    parentId:word.parentId||parentById[word.id],
    prerequisites:word.prerequisites||explicitPrerequisites[word.id]||[],
    sequence:word.sequence||lessonOneSequence[word.id],
    introExample:word.introExample??false,
  }
}

const add=(id:string,sl:string,de:string,partOfSpeech:string,category:string,example:string,exampleDe:string,lesson:number,extra:Partial<Vocabulary>={}):Vocabulary=>enrich({id,sl,de,partOfSpeech,category,example,exampleDe,lesson,...extra})

/** Non-overlapping additions that close important A1 gaps. */
const coreAdditions:Vocabulary[]=[
  add('v181','kako','wie','Fragewort','Fragewörter','Kako si?','Wie geht es dir?',1,{priority:1,sequence:20,usageNote:'kako fragt nach der Art und Weise: „wie?“. In „Kako si?“ ist die natürliche deutsche Bedeutung „Wie geht es dir?“.',literalMeaningDe:'wie'}),
  add('v182','kdo','wer','Fragewort','Fragewörter','Kdo je to?','Wer ist das?',1,{priority:1}),
  add('v183','zakaj','warum','Fragewort','Fragewörter','Zakaj ne?','Warum nicht?',1,{priority:2}),
  add('v184','ker','weil','Konjunktion','Gespräch','Ne grem, ker delam.','Ich gehe nicht, weil ich arbeite.',1,{priority:2}),
  add('v185','in','und','Konjunktion','Gespräch','Kava in voda, prosim.','Kaffee und Wasser, bitte.',1,{priority:1}),
  add('v186','tudi','auch','Adverb','Gespräch','Tudi jaz.','Ich auch.',1,{priority:1}),
  add('v187','zelo','sehr','Adverb','Gespräch','Zelo dobro.','Sehr gut.',1,{priority:1}),
  add('v188','malo','wenig / ein bisschen','Adverb','Gespräch','Govorim malo slovensko.','Ich spreche ein bisschen Slowenisch.',1,{priority:1}),
  add('v190','govoriti','sprechen','Verb','Gespräch','Govorim slovensko.','Ich spreche Slowenisch.',1,{lemma:'govoriti',priority:1}),
  add('v191','slovensko','Slowenisch','Adverb','Sprachen','Govorim slovensko.','Ich spreche Slowenisch.',1,{priority:1}),
  add('v192','nemško','Deutsch','Adverb','Sprachen','Govorim nemško.','Ich spreche Deutsch.',1,{priority:2}),
  add('v193','Slovenija','Slowenien','Eigenname','Orte','Sem v Sloveniji.','Ich bin in Slowenien.',1,{priority:1}),
  add('v194','Nemčija','Deutschland','Eigenname','Orte','Sem iz Nemčije.','Ich komme aus Deutschland.',1,{priority:1}),
  add('v195','mama','Mutter','Substantiv','Familie','Moja mama živi tukaj.','Meine Mutter wohnt hier.',2,{gender:'feminine',priority:1}),
  add('v196','oče','Vater','Substantiv','Familie','Moj oče dela.','Mein Vater arbeitet.',2,{gender:'masculine',priority:1}),
  add('v197','moj','mein','Pronomen','Personen','Moj brat je tukaj.','Mein Bruder ist hier.',2,{priority:1}),
  add('v198','moja','meine','Pronomen','Personen','Moja sestra je doma.','Meine Schwester ist zu Hause.',2,{priority:1,parentId:'v197',contentType:'form'}),
  add('v199','prijatelj','Freund','Substantiv','Personen','Moj prijatelj je iz Slovenije.','Mein Freund kommt aus Slowenien.',2,{gender:'masculine',priority:2}),
  add('v200','prijateljica','Freundin','Substantiv','Personen','Moja prijateljica živi tukaj.','Meine Freundin wohnt hier.',2,{gender:'feminine',priority:2}),
  add('v201','ponedeljek','Montag','Substantiv','Zeit','V ponedeljek delam.','Am Montag arbeite ich.',3,{gender:'masculine',priority:2}),
  add('v202','torek','Dienstag','Substantiv','Zeit','V torek sem doma.','Am Dienstag bin ich zu Hause.',3,{gender:'masculine',priority:3}),
  add('v203','sreda','Mittwoch','Substantiv','Zeit','V sredo ne delam.','Am Mittwoch arbeite ich nicht.',3,{gender:'feminine',priority:3}),
  add('v204','četrtek','Donnerstag','Substantiv','Zeit','V četrtek začnem zgodaj.','Am Donnerstag fange ich früh an.',3,{gender:'masculine',priority:3}),
  add('v205','petek','Freitag','Substantiv','Zeit','V petek grem domov.','Am Freitag gehe ich nach Hause.',3,{gender:'masculine',priority:2}),
  add('v206','sobota','Samstag','Substantiv','Zeit','V soboto imam čas.','Am Samstag habe ich Zeit.',3,{gender:'feminine',priority:2}),
  add('v207','nedelja','Sonntag','Substantiv','Zeit','V nedeljo sem doma.','Am Sonntag bin ich zu Hause.',3,{gender:'feminine',priority:2}),
  add('v208','zgodaj','früh','Adverb','Tagesablauf','Zjutraj vstanem zgodaj.','Morgens stehe ich früh auf.',3,{priority:2}),
  add('v209','pozno','spät','Adverb','Tagesablauf','Danes grem pozno spat.','Heute gehe ich spät schlafen.',3,{priority:2}),
  add('v210','rad','gern (m.)','Adverb','Freizeit','Rad pijem kavo.','Ich trinke gern Kaffee.',4,{priority:2,usageNote:'rad wird bei einem männlichen Sprecher verwendet; bei einer weiblichen Sprecherin steht rada.'}),
  add('v211','rada','gern (f.)','Adverb','Freizeit','Rada pijem čaj.','Ich trinke gern Tee.',4,{priority:2,parentId:'v210',contentType:'form'}),
  add('v212','sadje','Obst','Substantiv','Essen','Rad jem sadje.','Ich esse gern Obst.',4,{gender:'neuter',priority:2}),
  add('v213','zelenjava','Gemüse','Substantiv','Essen','Jem veliko zelenjave.','Ich esse viel Gemüse.',4,{gender:'feminine',priority:2}),
  add('v218','majica','T-Shirt','Substantiv','Kleidung','Iščem majico.','Ich suche ein T-Shirt.',6,{gender:'feminine',topic:'clothing',priority:2}),
  add('v219','hlače','Hose / Hosen','Substantiv','Kleidung','Te hlače so prevelike.','Diese Hose ist zu groß.',6,{gender:'feminine',topic:'clothing',priority:2,usageNote:'hlače wird im Slowenischen normalerweise im Plural gebraucht.'}),
  add('v220','jakna','Jacke','Substantiv','Kleidung','Potrebujem jakno.','Ich brauche eine Jacke.',6,{gender:'feminine',topic:'clothing',priority:2}),
  add('v221','čevlji','Schuhe','Substantiv','Kleidung','Iščem črne čevlje.','Ich suche schwarze Schuhe.',6,{gender:'masculine',topic:'clothing',priority:2}),
  add('v222','center','Zentrum','Substantiv','Unterwegs','Kako pridem v center?','Wie komme ich ins Zentrum?',7,{gender:'masculine',priority:1}),
  add('v223','hotel','Hotel','Substantiv','Unterwegs','Kje je hotel?','Wo ist das Hotel?',7,{gender:'masculine',priority:1}),
  add('v224','rezervacija','Reservierung','Substantiv','Unterwegs','Imam rezervacijo.','Ich habe eine Reservierung.',7,{gender:'feminine',priority:2}),
  add('v225','glava','Kopf','Substantiv','Gesundheit','Boli me glava.','Mein Kopf tut weh.',8,{gender:'feminine',topic:'health',priority:2}),
  add('v226','roka','Hand / Arm','Substantiv','Gesundheit','Boli me roka.','Mein Arm tut weh.',8,{gender:'feminine',topic:'health',priority:3}),
  add('v227','noga','Bein / Fuß','Substantiv','Gesundheit','Boli me noga.','Mein Bein tut weh.',8,{gender:'feminine',topic:'health',priority:3}),
  add('v228','boleti','wehtun','Verb','Gesundheit','Boli me glava.','Mein Kopf tut weh.',8,{lemma:'boleti',topic:'health',priority:2}),
  add('v229','odprt','offen','Adjektiv','Zuhause','Okno je odprto.','Das Fenster ist offen.',8,{priority:2}),
  add('v230','zaprt','geschlossen','Adjektiv','Zuhause','Vrata so zaprta.','Die Tür ist geschlossen.',8,{priority:2}),
  add('v231','biti','sein','Verb','Verben','Biti pomeni „sein“.','biti bedeutet „sein“.',1,{lemma:'biti',priority:1,sequence:30,usageNote:'biti ist der Infinitiv „sein“. Die Formen sem, si und je werden danach einzeln eingeführt.'}),
  add('v232','kakšen','was für ein / welcher','Fragewort','Fragewörter','Kakšno je vreme?','Wie ist das Wetter?',8,{priority:2,usageNote:'kakšen wird wie ein Adjektiv angepasst: z. B. kakšna (f.), kakšno (n.). Es ist nicht dasselbe wie kako „wie“.',introExample:false}),
  add('v233','želeti','wünschen / möchten','Verb','Restaurant','Želim kavo.','Ich möchte einen Kaffee.',5,{lemma:'želeti',priority:2}),
  add('v234','razumem','ich verstehe','Verb','Gespräch','Razumem.','Ich verstehe.',1,{lemma:'razumeti',parentId:'v120',contentType:'form',priority:1}),
]

const baseIds=new Set([...seedVocabulary,...laterLessonVocabulary].map(word=>word.id))
const baseSl=new Set([...seedVocabulary,...laterLessonVocabulary].map(word=>word.sl.trim().toLocaleLowerCase('sl')))
const additions=coreAdditions.filter(word=>!baseIds.has(word.id)&&!baseSl.has(word.sl.trim().toLocaleLowerCase('sl')))

export const vocabulary:Vocabulary[]=[...seedVocabulary,...laterLessonVocabulary,...additions].map(enrich)

export const vocabularyUnits=[
  {id:'A1.1',title:'Grundlagen',goal:'begrüßen, verstehen und erste einfache Fragen bilden',topics:['basics','function-words']},
  {id:'A1.2',title:'Personen und Herkunft',goal:'sich vorstellen und Herkunft nennen',topics:['people']},
  {id:'A1.3',title:'Familie',goal:'über Familie, Besitz und Mengen sprechen',topics:['family']},
  {id:'A1.4',title:'Zeit und Alltag',goal:'Tagesablauf, Arbeit und Termine ausdrücken',topics:['numbers-time','work','free-time']},
  {id:'A1.5',title:'Essen und Trinken',goal:'bestellen, Vorlieben und Bedürfnisse ausdrücken',topics:['food-drink']},
  {id:'A1.6',title:'Einkaufen und Kleidung',goal:'suchen, auswählen, Preise und Größen verstehen',topics:['shopping','clothing']},
  {id:'A1.7',title:'Unterwegs',goal:'Wege, Verkehrsmittel und Reiseinformationen verstehen',topics:['travel']},
  {id:'A1.8',title:'Wohnen, Wetter und Hilfe',goal:'Wohnung beschreiben und einfache Hilfe erbitten',topics:['home','weather','health']},
] as const
