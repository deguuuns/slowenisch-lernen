import { VerbFormRequirement, VerbNumber } from '@/types'

export type VerbPerson = 1 | 2 | 3

export type VerbForm = {
  person: VerbPerson
  number: VerbNumber
  pronoun: string
  form: string
  translation: string
}

export type VerbEntry = {
  id: string
  infinitive: string
  translation: string
  reflexive?: boolean
  forms: VerbForm[]
}

const f = (person:VerbPerson, number:VerbNumber, pronoun:string, form:string, translation:string):VerbForm => ({ person, number, pronoun, form, translation })

/** Canonical morphology source. UI and exercises must not define parallel verb tables. */
export const verbCatalog: VerbEntry[] = [
  { id:'biti', infinitive:'biti', translation:'sein', forms:[f(1,'singular','jaz','sem','ich bin'),f(2,'singular','ti','si','du bist'),f(3,'singular','on / ona / ono','je','er / sie / es ist'),f(1,'dual','midva / medve','sva','wir beide sind'),f(2,'dual','vidva / vedve','sta','ihr beide seid'),f(3,'dual','onadva / onidve','sta','die beiden sind'),f(1,'plural','mi / me','smo','wir sind'),f(2,'plural','vi / ve','ste','ihr seid'),f(3,'plural','oni / one / ona','so','sie sind')] },
  { id:'delati', infinitive:'delati', translation:'arbeiten / machen', forms:[f(1,'singular','jaz','delam','ich arbeite / mache'),f(2,'singular','ti','delaš','du arbeitest / machst'),f(3,'singular','on / ona / ono','dela','er / sie / es arbeitet / macht'),f(1,'dual','midva / medve','delava','wir beide arbeiten'),f(2,'dual','vidva / vedve','delata','ihr beide arbeitet'),f(3,'dual','onadva / onidve','delata','die beiden arbeiten'),f(1,'plural','mi / me','delamo','wir arbeiten'),f(2,'plural','vi / ve','delate','ihr arbeitet'),f(3,'plural','oni / one / ona','delajo','sie arbeiten')] },
  { id:'iti', infinitive:'iti', translation:'gehen', forms:[f(1,'singular','jaz','grem','ich gehe'),f(2,'singular','ti','greš','du gehst'),f(3,'singular','on / ona / ono','gre','er / sie / es geht'),f(1,'dual','midva / medve','greva','wir beide gehen'),f(2,'dual','vidva / vedve','gresta','ihr beide geht'),f(3,'dual','onadva / onidve','gresta','die beiden gehen'),f(1,'plural','mi / me','gremo','wir gehen'),f(2,'plural','vi / ve','greste','ihr geht'),f(3,'plural','oni / one / ona','gredo','sie gehen')] },
  { id:'imeti', infinitive:'imeti', translation:'haben', forms:[f(1,'singular','jaz','imam','ich habe'),f(2,'singular','ti','imaš','du hast'),f(3,'singular','on / ona / ono','ima','er / sie / es hat'),f(1,'dual','midva / medve','imava','wir beide haben'),f(2,'dual','vidva / vedve','imata','ihr beide habt'),f(3,'dual','onadva / onidve','imata','die beiden haben'),f(1,'plural','mi / me','imamo','wir haben'),f(2,'plural','vi / ve','imate','ihr habt'),f(3,'plural','oni / one / ona','imajo','sie haben')] },
  { id:'živeti', infinitive:'živeti', translation:'leben / wohnen', forms:[f(1,'singular','jaz','živim','ich lebe / wohne'),f(2,'singular','ti','živiš','du lebst / wohnst'),f(3,'singular','on / ona / ono','živi','er / sie / es lebt / wohnt'),f(1,'dual','midva / medve','živiva','wir beide leben'),f(2,'dual','vidva / vedve','živita','ihr beide lebt'),f(3,'dual','onadva / onidve','živita','die beiden leben'),f(1,'plural','mi / me','živimo','wir leben'),f(2,'plural','vi / ve','živite','ihr lebt'),f(3,'plural','oni / one / ona','živijo','sie leben')] },
  { id:'začeti', infinitive:'začeti', translation:'anfangen', forms:[f(1,'singular','jaz','začnem','ich fange an'),f(2,'singular','ti','začneš','du fängst an'),f(3,'singular','on / ona / ono','začne','er / sie / es fängt an'),f(1,'dual','midva / medve','začneva','wir beide fangen an'),f(2,'dual','vidva / vedve','začneta','ihr beide fangt an'),f(3,'dual','onadva / onidve','začneta','die beiden fangen an'),f(1,'plural','mi / me','začnemo','wir fangen an'),f(2,'plural','vi / ve','začnete','ihr fangt an'),f(3,'plural','oni / one / ona','začnejo','sie fangen an')] },
  { id:'končati', infinitive:'končati', translation:'beenden', forms:[f(1,'singular','jaz','končam','ich beende / bin fertig'),f(2,'singular','ti','končaš','du beendest / bist fertig'),f(3,'singular','on / ona / ono','konča','er / sie / es beendet / ist fertig'),f(1,'dual','midva / medve','končava','wir beide beenden'),f(2,'dual','vidva / vedve','končata','ihr beide beendet'),f(3,'dual','onadva / onidve','končata','die beiden beenden'),f(1,'plural','mi / me','končamo','wir beenden'),f(2,'plural','vi / ve','končate','ihr beendet'),f(3,'plural','oni / one / ona','končajo','sie beenden')] },
  { id:'peljati-se', infinitive:'peljati se', translation:'fahren', reflexive:true, forms:[f(1,'singular','jaz','peljem se','ich fahre'),f(2,'singular','ti','pelješ se','du fährst'),f(3,'singular','on / ona / ono','pelje se','er / sie / es fährt'),f(1,'dual','midva / medve','peljeva se','wir beide fahren'),f(2,'dual','vidva / vedve','peljeta se','ihr beide fahrt'),f(3,'dual','onadva / onidve','peljeta se','die beiden fahren'),f(1,'plural','mi / me','peljemo se','wir fahren'),f(2,'plural','vi / ve','peljete se','ihr fahrt'),f(3,'plural','oni / one / ona','peljejo se','sie fahren')] },
  { id:'jesti', infinitive:'jesti', translation:'essen', forms:[f(1,'singular','jaz','jem','ich esse'),f(2,'singular','ti','ješ','du isst'),f(3,'singular','on / ona / ono','je','er / sie / es isst'),f(1,'dual','midva / medve','jeva','wir beide essen'),f(2,'dual','vidva / vedve','jesta','ihr beide esst'),f(3,'dual','onadva / onidve','jesta','die beiden essen'),f(1,'plural','mi / me','jemo','wir essen'),f(2,'plural','vi / ve','jeste','ihr esst'),f(3,'plural','oni / one / ona','jedo','sie essen')] },
  { id:'piti', infinitive:'piti', translation:'trinken', forms:[f(1,'singular','jaz','pijem','ich trinke'),f(2,'singular','ti','piješ','du trinkst'),f(3,'singular','on / ona / ono','pije','er / sie / es trinkt'),f(1,'dual','midva / medve','pijeva','wir beide trinken'),f(2,'dual','vidva / vedve','pijeta','ihr beide trinkt'),f(3,'dual','onadva / onidve','pijeta','die beiden trinken'),f(1,'plural','mi / me','pijemo','wir trinken'),f(2,'plural','vi / ve','pijete','ihr trinkt'),f(3,'plural','oni / one / ona','pijejo','sie trinken')] },
  { id:'želeti', infinitive:'želeti', translation:'wünschen / möchten', forms:[f(1,'singular','jaz','želim','ich möchte / wünsche'),f(2,'singular','ti','želiš','du möchtest / wünschst'),f(3,'singular','on / ona / ono','želi','er / sie / es möchte / wünscht'),f(1,'dual','midva / medve','želiva','wir beide möchten'),f(2,'dual','vidva / vedve','želita','ihr beide möchtet'),f(3,'dual','onadva / onidve','želita','die beiden möchten'),f(1,'plural','mi / me','želimo','wir möchten'),f(2,'plural','vi / ve','želite','ihr möchtet'),f(3,'plural','oni / one / ona','želijo','sie möchten')] },
  { id:'govoriti', infinitive:'govoriti', translation:'sprechen', forms:[f(1,'singular','jaz','govorim','ich spreche'),f(2,'singular','ti','govoriš','du sprichst'),f(3,'singular','on / ona / ono','govori','er / sie / es spricht'),f(1,'dual','midva / medve','govoriva','wir beide sprechen'),f(2,'dual','vidva / vedve','govorita','ihr beide sprecht'),f(3,'dual','onadva / onidve','govorita','die beiden sprechen'),f(1,'plural','mi / me','govorimo','wir sprechen'),f(2,'plural','vi / ve','govorite','ihr sprecht'),f(3,'plural','oni / one / ona','govorijo','sie sprechen')] },
  { id:'razumeti', infinitive:'razumeti', translation:'verstehen', forms:[f(1,'singular','jaz','razumem','ich verstehe'),f(2,'singular','ti','razumeš','du verstehst'),f(3,'singular','on / ona / ono','razume','er / sie / es versteht'),f(1,'dual','midva / medve','razumeva','wir beide verstehen'),f(2,'dual','vidva / vedve','razumeta','ihr beide versteht'),f(3,'dual','onadva / onidve','razumeta','die beiden verstehen'),f(1,'plural','mi / me','razumemo','wir verstehen'),f(2,'plural','vi / ve','razumete','ihr versteht'),f(3,'plural','oni / one / ona','razumejo','sie verstehen')] },
]

export const vocabularyVerbFormRequirements: Record<string, VerbFormRequirement> = {
  v011:{verbId:'biti',person:1,number:'singular'}, v012:{verbId:'biti',person:2,number:'singular'}, v013:{verbId:'biti',person:3,number:'singular'},
  v021:{verbId:'delati',person:1,number:'singular'}, v022:{verbId:'delati',person:2,number:'singular'},
  v024:{verbId:'iti',person:1,number:'singular'}, v025:{verbId:'iti',person:2,number:'singular'},
  v032:{verbId:'imeti',person:1,number:'singular'}, v033:{verbId:'imeti',person:2,number:'singular'}, v034:{verbId:'imeti',person:1,number:'singular'},
  v050:{verbId:'živeti',person:1,number:'singular'}, v051:{verbId:'živeti',person:2,number:'singular'},
  v065:{verbId:'začeti',person:1,number:'singular'}, v067:{verbId:'končati',person:1,number:'singular'},
  v078:{verbId:'peljati-se',person:1,number:'singular'}, v079:{verbId:'peljati-se',person:2,number:'singular'},
  v082:{verbId:'jesti',person:1,number:'singular'}, v083:{verbId:'jesti',person:2,number:'singular'},
  v085:{verbId:'piti',person:1,number:'singular'}, v086:{verbId:'piti',person:2,number:'singular'},
  v107:{verbId:'želeti',person:1,number:'singular'}, v234:{verbId:'razumeti',person:1,number:'singular'},
}

export function verbByInfinitive(value:string) {
  const normalized=value.trim().toLowerCase()
  return verbCatalog.find(verb => verb.infinitive.toLowerCase() === normalized)
}

export function verbById(id:string) { return verbCatalog.find(verb => verb.id === id) }
export function verbFormFor(requirement: VerbFormRequirement) { return verbById(requirement.verbId)?.forms.find(form => form.person === requirement.person && form.number === requirement.number) }
export function verbRequirementForVocabularyId(id:string) { return vocabularyVerbFormRequirements[id] }
export function isRegisteredVerbFormVocabularyId(id:string) { return Boolean(vocabularyVerbFormRequirements[id]) }

export function singularVerbIntroFromRegistry(verbId:string) {
  const verb=verbById(verbId)
  if(!verb)return null
  return {
    verbId:verb.id,
    infinitiveSl:verb.infinitive,
    infinitiveDe:verb.translation,
    forms:verb.forms.filter(form=>form.number==='singular').map(form=>({person:form.person,pronounSl:form.pronoun,formSl:form.form,translationDe:form.translation})),
  }
}
