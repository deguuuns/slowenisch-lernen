import type { Vocabulary, VocabularyPriority, VocabularyTopic } from '@/types'

const lemmaAliases: Record<string,string> = {
  sem:'biti', si:'biti', je:'biti', delam:'delati', delaš:'delati', grem:'iti', greš:'iti',
  imam:'imeti', imaš:'imeti', nimam:'imeti', živim:'živeti', živiš:'živeti',
  začnem:'začeti', končam:'končati', 'peljem se':'peljati se', 'pelješ se':'peljati se',
  jem:'jesti', ješ:'jesti', pijem:'piti', piješ:'piti', želim:'želeti',
}

function topicFor(word:Vocabulary):VocabularyTopic {
  const source=`${word.category} ${(word.tags||[]).join(' ')}`.toLowerCase()
  if(/begrü|höf|gespräch|frage/.test(source))return 'basics'
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

function priorityFor(word:Vocabulary):VocabularyPriority {
  const pos=word.partOfSpeech.toLowerCase()
  if(word.lesson<=2||/pronomen|fragewort|interjektion|partikel|konjunktion/.test(pos))return 1
  if(/verb/.test(pos)||word.lesson<=4)return 2
  if(word.lesson<=6)return 3
  return 4
}

function unitFor(word:Vocabulary){
  const topic=topicFor(word)
  const unit:Record<VocabularyTopic,string>={
    basics:'A1.1 Grundlagen',people:'A1.2 Personen und Herkunft',family:'A1.3 Familie und Beziehungen',
    'numbers-time':'A1.4 Zeit und Alltag','food-drink':'A1.5 Essen und Trinken',shopping:'A1.6 Einkaufen und Kleidung',
    travel:'A1.7 Unterwegs',home:'A1.8 Wohnen, Wetter und Hilfe',work:'A1.4 Zeit und Alltag',weather:'A1.8 Wohnen, Wetter und Hilfe',health:'A1.8 Wohnen, Wetter und Hilfe',
    clothing:'A1.6 Einkaufen und Kleidung','free-time':'A1.4 Zeit und Alltag','function-words':'A1.1 Grundlagen',other:'A1 Grundwortschatz',
  }
  return unit[topic]
}

function enrich(word:Vocabulary):Vocabulary {
  const lemma=word.lemma||lemmaAliases[word.sl]||(/verb/i.test(word.partOfSpeech)?word.sl:undefined)
  return {
    ...word,
    cefrLevel:word.cefrLevel||'A1',
    lemma,
    priority:word.priority||priorityFor(word),
    topic:word.topic||topicFor(word),
    curriculumUnit:word.curriculumUnit||unitFor(word),
    tags:Array.from(new Set([...(word.tags||[]),'a1-core'])),
  }
}

const add=(id:string,sl:string,de:string,partOfSpeech:string,category:string,example:string,exampleDe:string,lesson:number,extra:Partial<Vocabulary>={}):Vocabulary=>enrich({id,sl,de,partOfSpeech,category,example,exampleDe,lesson,...extra})

/** New high-frequency A1 material missing from the first curriculum generation. */
export const a1VocabularyV2Additions:Vocabulary[]=[
  add('v181','kako','wie','Fragewort','Fragewörter','Kako si?','Wie geht es dir?',1,{priority:1}),
  add('v182','kdo','wer','Fragewort','Fragewörter','Kdo je to?','Wer ist das?',1,{priority:1}),
  add('v183','zakaj','warum','Fragewort','Fragewörter','Zakaj ne?','Warum nicht?',1,{priority:2}),
  add('v184','ker','weil','Konjunktion','Gespräch','Ne grem, ker delam.','Ich gehe nicht, weil ich arbeite.',1,{priority:2}),
  add('v185','in','und','Konjunktion','Gespräch','Kava in voda, prosim.','Kaffee und Wasser, bitte.',1,{priority:1}),
  add('v186','tudi','auch','Adverb','Gespräch','Tudi jaz.','Ich auch.',1,{priority:1}),
  add('v187','zelo','sehr','Adverb','Gespräch','Zelo dobro.','Sehr gut.',1,{priority:1}),
  add('v188','malo','wenig / ein bisschen','Adverb','Gespräch','Govorim malo slovensko.','Ich spreche ein bisschen Slowenisch.',1,{priority:1}),
  add('v189','razumeti','verstehen','Verb','Gespräch','Razumem malo.','Ich verstehe ein bisschen.',1,{lemma:'razumeti',priority:1}),
  add('v190','govoriti','sprechen','Verb','Gespräch','Govorim slovensko.','Ich spreche Slowenisch.',1,{lemma:'govoriti',priority:1}),
  add('v191','slovensko','Slowenisch','Adverb','Sprachen','Govorite slovensko?','Sprechen Sie Slowenisch?',1,{priority:1}),
  add('v192','nemško','Deutsch','Adverb','Sprachen','Govorim nemško.','Ich spreche Deutsch.',1,{priority:2}),
  add('v193','Slovenija','Slowenien','Eigenname','Orte','Sem v Sloveniji.','Ich bin in Slowenien.',1,{priority:1}),
  add('v194','Nemčija','Deutschland','Eigenname','Orte','Sem iz Nemčije.','Ich komme aus Deutschland.',1,{priority:1}),
  add('v195','mama','Mutter','Substantiv','Familie','Moja mama živi tukaj.','Meine Mutter wohnt hier.',2,{gender:'feminine',priority:1}),
  add('v196','oče','Vater','Substantiv','Familie','Moj oče dela.','Mein Vater arbeitet.',2,{gender:'masculine',priority:1}),
  add('v197','moj','mein','Pronomen','Personen','Moj brat je tukaj.','Mein Bruder ist hier.',2,{priority:1}),
  add('v198','moja','meine','Pronomen','Personen','Moja sestra je doma.','Meine Schwester ist zu Hause.',2,{priority:1}),
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
  add('v210','rad','gern (m.)','Adverb','Freizeit','Rad pijem kavo.','Ich trinke gern Kaffee.',4,{priority:2}),
  add('v211','rada','gern (f.)','Adverb','Freizeit','Rada pijem čaj.','Ich trinke gern Tee.',4,{priority:2}),
  add('v212','sadje','Obst','Substantiv','Essen','Rad jem sadje.','Ich esse gern Obst.',4,{gender:'neuter',priority:2}),
  add('v213','zelenjava','Gemüse','Substantiv','Essen','Jem veliko zelenjave.','Ich esse viel Gemüse.',4,{gender:'feminine',priority:2}),
  add('v214','mleko','Milch','Substantiv','Getränke','Pijem mleko.','Ich trinke Milch.',4,{gender:'neuter',priority:2}),
  add('v215','račun','Rechnung','Substantiv','Restaurant','Račun, prosim.','Die Rechnung, bitte.',5,{gender:'masculine',priority:1}),
  add('v216','brez','ohne','Präposition','Restaurant','Kavo brez mleka, prosim.','Kaffee ohne Milch, bitte.',5,{priority:2}),
  add('v217','z','mit','Präposition','Restaurant','Čaj z limono, prosim.','Tee mit Zitrone, bitte.',5,{priority:1}),
  add('v218','majica','T-Shirt','Substantiv','Kleidung','Iščem majico.','Ich suche ein T-Shirt.',6,{gender:'feminine',topic:'clothing',priority:2}),
  add('v219','hlače','Hose','Substantiv','Kleidung','Te hlače so prevelike.','Diese Hose ist zu groß.',6,{gender:'feminine',topic:'clothing',priority:2}),
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
]

export const vocabularyV2Units=[
  {id:'A1.1',title:'Grundlagen',goal:'begrüßen, verstehen, einfache Fragen stellen',topics:['basics','function-words']},
  {id:'A1.2',title:'Personen und Herkunft',goal:'sich vorstellen und Herkunft nennen',topics:['people']},
  {id:'A1.3',title:'Familie',goal:'über Familie, Besitz und Mengen sprechen',topics:['family']},
  {id:'A1.4',title:'Zeit und Alltag',goal:'Tagesablauf, Arbeit und Termine ausdrücken',topics:['numbers-time','work','free-time']},
  {id:'A1.5',title:'Essen und Trinken',goal:'bestellen, Vorlieben und Bedürfnisse ausdrücken',topics:['food-drink']},
  {id:'A1.6',title:'Einkaufen und Kleidung',goal:'suchen, auswählen, Preise und Größen verstehen',topics:['shopping','clothing']},
  {id:'A1.7',title:'Unterwegs',goal:'Wege, Verkehrsmittel und Reiseinformationen verstehen',topics:['travel']},
  {id:'A1.8',title:'Wohnen, Wetter und Hilfe',goal:'Wohnung beschreiben und einfache Hilfe erbitten',topics:['home','weather','health']},
] as const

export function buildVocabularyV2(existing:Vocabulary[]):Vocabulary[]{
  const ids=new Set(existing.map(word=>word.id))
  return [...existing.map(enrich),...a1VocabularyV2Additions.filter(word=>!ids.has(word.id))]
}
