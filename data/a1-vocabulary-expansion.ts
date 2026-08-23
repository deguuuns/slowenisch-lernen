import { Vocabulary } from '@/types'

export type CurriculumVocabularyUnit = {
  lesson: number
  title: string
  goal: string
  vocabularyIds: string[]
}

const word = (
  id:string,
  sl:string,
  de:string,
  partOfSpeech:string,
  category:string,
  example:string,
  exampleDe:string,
  lesson:number,
  options:Partial<Pick<Vocabulary,'lemma'|'gender'|'tags'>> = {},
):Vocabulary => ({ id, sl, de, partOfSpeech, category, example, exampleDe, lesson, cefrLevel:'A1', ...options })

/**
 * Phase 16: curated A1 vocabulary prepared for future lesson integration.
 * These entries are curriculum-bound but deliberately not auto-introduced into UserProgress.
 * Stable ids continue after the existing v001-v120 seed catalog.
 */
export const a1VocabularyExpansion: Vocabulary[] = [
  // Lesson 6 – Einkaufen
  word('v121','trgovina','Geschäft / Laden','Substantiv','Einkaufen','Trgovina je blizu.','Das Geschäft ist in der Nähe.',6,{gender:'feminine',tags:['shopping','place']}),
  word('v122','kupiti','kaufen','Verb','Einkaufen','Želim kupiti kruh.','Ich möchte Brot kaufen.',6,{lemma:'kupiti',tags:['shopping','action']}),
  word('v123','iskati','suchen','Verb','Einkaufen','Iščem majico.','Ich suche ein T-Shirt.',6,{lemma:'iskati',tags:['shopping','action']}),
  word('v124','potrebovati','brauchen','Verb','Einkaufen','Potrebujem vodo.','Ich brauche Wasser.',6,{lemma:'potrebovati',tags:['shopping','action']}),
  word('v125','cena','Preis','Substantiv','Einkaufen','Cena je dobra.','Der Preis ist gut.',6,{gender:'feminine',tags:['shopping','money']}),
  word('v126','evro','Euro','Substantiv','Einkaufen','Stane deset evrov.','Es kostet zehn Euro.',6,{gender:'masculine',tags:['shopping','money']}),
  word('v127','poceni','günstig','Adjektiv','Einkaufen','To je poceni.','Das ist günstig.',6,{tags:['shopping','description']}),
  word('v128','drag','teuer','Adjektiv','Einkaufen','To je predrago.','Das ist zu teuer.',6,{tags:['shopping','description']}),
  word('v129','velik','groß','Adjektiv','Eigenschaften','Potrebujem veliko torbo.','Ich brauche eine große Tasche.',6,{tags:['shopping','description']}),
  word('v130','majhen','klein','Adjektiv','Eigenschaften','Imate manjšo številko?','Haben Sie eine kleinere Größe?',6,{tags:['shopping','description']}),
  word('v131','rdeč','rot','Adjektiv','Farben','Želim rdečo majico.','Ich möchte ein rotes T-Shirt.',6,{tags:['shopping','color']}),
  word('v132','moder','blau','Adjektiv','Farben','Moder pulover je lep.','Der blaue Pullover ist schön.',6,{tags:['shopping','color']}),
  word('v133','zelen','grün','Adjektiv','Farben','Imate zeleno?','Haben Sie es in Grün?',6,{tags:['shopping','color']}),
  word('v134','črn','schwarz','Adjektiv','Farben','Črna jakna mi je všeč.','Die schwarze Jacke gefällt mir.',6,{tags:['shopping','color']}),
  word('v135','bel','weiß','Adjektiv','Farben','Bela srajca je tukaj.','Das weiße Hemd ist hier.',6,{tags:['shopping','color']}),
  word('v136','številka','Größe / Nummer','Substantiv','Einkaufen','Katero številko potrebujete?','Welche Größe brauchen Sie?',6,{gender:'feminine',tags:['shopping','clothing']}),
  word('v137','denarnica','Geldbörse','Substantiv','Einkaufen','Denarnica je v torbi.','Die Geldbörse ist in der Tasche.',6,{gender:'feminine',tags:['shopping','money']}),
  word('v138','kartica','Karte','Substantiv','Einkaufen','Plačam s kartico.','Ich bezahle mit Karte.',6,{gender:'feminine',tags:['shopping','money']}),
  word('v139','gotovina','Bargeld','Substantiv','Einkaufen','Imam samo gotovino.','Ich habe nur Bargeld.',6,{gender:'feminine',tags:['shopping','money']}),
  word('v140','plačati','bezahlen','Verb','Einkaufen','Kje lahko plačam?','Wo kann ich bezahlen?',6,{lemma:'plačati',tags:['shopping','action']}),

  // Lesson 7 – Unterwegs und Reisen
  word('v141','postaja','Haltestelle / Bahnhof','Substantiv','Unterwegs','Avtobusna postaja je tam.','Die Bushaltestelle ist dort.',7,{gender:'feminine',tags:['travel','place']}),
  word('v142','avtobus','Bus','Substantiv','Unterwegs','Grem z avtobusom.','Ich fahre mit dem Bus.',7,{gender:'masculine',tags:['travel','transport']}),
  word('v143','vlak','Zug','Substantiv','Unterwegs','Vlak pride ob osmih.','Der Zug kommt um acht.',7,{gender:'masculine',tags:['travel','transport']}),
  word('v144','vozovnica','Fahrkarte','Substantiv','Unterwegs','Eno vozovnico, prosim.','Eine Fahrkarte, bitte.',7,{gender:'feminine',tags:['travel','ticket']}),
  word('v145','letališče','Flughafen','Substantiv','Unterwegs','Letališče je daleč.','Der Flughafen ist weit weg.',7,{gender:'neuter',tags:['travel','place']}),
  word('v146','cesta','Straße','Substantiv','Unterwegs','Ta cesta gre v center.','Diese Straße führt ins Zentrum.',7,{gender:'feminine',tags:['travel','direction']}),
  word('v147','ulica','Straße / Gasse','Substantiv','Unterwegs','Katera ulica je to?','Welche Straße ist das?',7,{gender:'feminine',tags:['travel','direction']}),
  word('v148','levo','links','Adverb','Unterwegs','Pojdite levo.','Gehen Sie nach links.',7,{tags:['travel','direction']}),
  word('v149','desno','rechts','Adverb','Unterwegs','Potem zavijte desno.','Dann biegen Sie rechts ab.',7,{tags:['travel','direction']}),
  word('v150','naravnost','geradeaus','Adverb','Unterwegs','Pojdite naravnost.','Gehen Sie geradeaus.',7,{tags:['travel','direction']}),
  word('v151','blizu','nah / in der Nähe','Adverb','Unterwegs','Hotel je blizu.','Das Hotel ist in der Nähe.',7,{tags:['travel','distance']}),
  word('v152','daleč','weit','Adverb','Unterwegs','Je postaja daleč?','Ist die Haltestelle weit?',7,{tags:['travel','distance']}),
  word('v153','priti','kommen / ankommen','Verb','Unterwegs','Vlak pride ob devetih.','Der Zug kommt um neun.',7,{lemma:'priti',tags:['travel','action']}),
  word('v154','oditi','weggehen / abfahren','Verb','Unterwegs','Avtobus odide ob desetih.','Der Bus fährt um zehn ab.',7,{lemma:'oditi',tags:['travel','action']}),
  word('v155','čakati','warten','Verb','Unterwegs','Čakam na vlak.','Ich warte auf den Zug.',7,{lemma:'čakati',tags:['travel','action']}),
  word('v156','zamuda','Verspätung','Substantiv','Unterwegs','Vlak ima zamudo.','Der Zug hat Verspätung.',7,{gender:'feminine',tags:['travel','schedule']}),
  word('v157','odhod','Abfahrt / Abflug','Substantiv','Unterwegs','Odhod je ob sedmih.','Die Abfahrt ist um sieben.',7,{gender:'masculine',tags:['travel','schedule']}),
  word('v158','prihod','Ankunft','Substantiv','Unterwegs','Prihod je ob osmih.','Die Ankunft ist um acht.',7,{gender:'masculine',tags:['travel','schedule']}),
  word('v159','zemljevid','Karte / Landkarte','Substantiv','Unterwegs','Imate zemljevid mesta?','Haben Sie einen Stadtplan?',7,{gender:'masculine',tags:['travel','direction']}),
  word('v160','pot','Weg / Reise','Substantiv','Unterwegs','Srečno pot!','Gute Reise!',7,{gender:'feminine',tags:['travel','direction']}),

  // Lesson 8 – Zuhause, Wetter und Hilfe
  word('v161','hiša','Haus','Substantiv','Zuhause','Moja hiša je majhna.','Mein Haus ist klein.',8,{gender:'feminine',tags:['home']}),
  word('v162','stanovanje','Wohnung','Substantiv','Zuhause','Živim v stanovanju.','Ich wohne in einer Wohnung.',8,{gender:'neuter',tags:['home']}),
  word('v163','soba','Zimmer','Substantiv','Zuhause','Soba je velika.','Das Zimmer ist groß.',8,{gender:'feminine',tags:['home']}),
  word('v164','kuhinja','Küche','Substantiv','Zuhause','Kuhinja je tukaj.','Die Küche ist hier.',8,{gender:'feminine',tags:['home']}),
  word('v165','kopalnica','Badezimmer','Substantiv','Zuhause','Kje je kopalnica?','Wo ist das Badezimmer?',8,{gender:'feminine',tags:['home']}),
  word('v166','vrata','Tür','Substantiv','Zuhause','Vrata so odprta.','Die Tür ist offen.',8,{gender:'neuter',tags:['home']}),
  word('v167','okno','Fenster','Substantiv','Zuhause','Okno je odprto.','Das Fenster ist offen.',8,{gender:'neuter',tags:['home']}),
  word('v168','ključ','Schlüssel','Substantiv','Zuhause','Kje je ključ?','Wo ist der Schlüssel?',8,{gender:'masculine',tags:['home']}),
  word('v169','postelja','Bett','Substantiv','Zuhause','Postelja je v sobi.','Das Bett ist im Zimmer.',8,{gender:'feminine',tags:['home']}),
  word('v170','stol','Stuhl','Substantiv','Zuhause','Stol je ob mizi.','Der Stuhl steht am Tisch.',8,{gender:'masculine',tags:['home']}),
  word('v171','vreme','Wetter','Substantiv','Wetter','Kakšno je vreme?','Wie ist das Wetter?',8,{gender:'neuter',tags:['weather']}),
  word('v172','sonce','Sonne','Substantiv','Wetter','Danes je sonce.','Heute ist es sonnig.',8,{gender:'neuter',tags:['weather']}),
  word('v173','dež','Regen','Substantiv','Wetter','Danes je dež.','Heute regnet es.',8,{gender:'masculine',tags:['weather']}),
  word('v174','hladno','kalt','Adjektiv','Wetter','Danes je hladno.','Heute ist es kalt.',8,{tags:['weather','description']}),
  word('v175','toplo','warm','Adjektiv','Wetter','Zunaj je toplo.','Draußen ist es warm.',8,{tags:['weather','description']}),
  word('v176','pomoč','Hilfe','Substantiv','Hilfe','Potrebujem pomoč.','Ich brauche Hilfe.',8,{gender:'feminine',tags:['help']}),
  word('v177','zdravnik','Arzt','Substantiv','Hilfe','Potrebujem zdravnika.','Ich brauche einen Arzt.',8,{gender:'masculine',tags:['help','health']}),
  word('v178','lekarna','Apotheke','Substantiv','Hilfe','Kje je lekarna?','Wo ist die Apotheke?',8,{gender:'feminine',tags:['help','health','place']}),
  word('v179','bolan','krank','Adjektiv','Hilfe','Danes sem bolan.','Heute bin ich krank.',8,{tags:['help','health']}),
  word('v180','utrujen','müde','Adjektiv','Gefühle','Zvečer sem utrujen.','Abends bin ich müde.',8,{tags:['daily-life','description']}),
]

export const curriculumVocabularyUnits: CurriculumVocabularyUnit[] = [
  { lesson:6, title:'Nakupovanje', goal:'Preise, Farben, Größen und Bezahlen beim Einkaufen', vocabularyIds:a1VocabularyExpansion.filter(item=>item.lesson===6).map(item=>item.id) },
  { lesson:7, title:'Na poti', goal:'Verkehrsmittel, Fahrkarten, Wege und Reisezeiten', vocabularyIds:a1VocabularyExpansion.filter(item=>item.lesson===7).map(item=>item.id) },
  { lesson:8, title:'Doma in pomoč', goal:'Zuhause, einfaches Wetter und grundlegende Hilfe', vocabularyIds:a1VocabularyExpansion.filter(item=>item.lesson===8).map(item=>item.id) },
]

export function vocabularyExpansionForLesson(lesson:number) {
  return a1VocabularyExpansion.filter(item=>item.lesson===lesson)
}

export function curriculumUnitForVocabularyId(id:string) {
  return curriculumVocabularyUnits.find(unit=>unit.vocabularyIds.includes(id))
}
