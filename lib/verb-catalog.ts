export type VerbNumber = 'singular' | 'dual' | 'plural'
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

export const verbCatalog: VerbEntry[] = [
  { id:'biti', infinitive:'biti', translation:'sein', forms:[f(1,'singular','jaz','sem','ich bin'),f(2,'singular','ti','si','du bist'),f(3,'singular','on / ona / ono','je','er / sie / es ist'),f(1,'dual','midva / medve','sva','wir beide sind'),f(2,'dual','vidva / vedve','sta','ihr beide seid'),f(3,'dual','onadva / onidve','sta','die beiden sind'),f(1,'plural','mi / me','smo','wir sind'),f(2,'plural','vi / ve','ste','ihr seid'),f(3,'plural','oni / one / ona','so','sie sind')] },
  { id:'delati', infinitive:'delati', translation:'arbeiten / machen', forms:[f(1,'singular','jaz','delam','ich arbeite'),f(2,'singular','ti','delaš','du arbeitest'),f(3,'singular','on / ona / ono','dela','er / sie / es arbeitet'),f(1,'dual','midva / medve','delava','wir beide arbeiten'),f(2,'dual','vidva / vedve','delata','ihr beide arbeitet'),f(3,'dual','onadva / onidve','delata','die beiden arbeiten'),f(1,'plural','mi / me','delamo','wir arbeiten'),f(2,'plural','vi / ve','delate','ihr arbeitet'),f(3,'plural','oni / one / ona','delajo','sie arbeiten')] },
  { id:'iti', infinitive:'iti', translation:'gehen', forms:[f(1,'singular','jaz','grem','ich gehe'),f(2,'singular','ti','greš','du gehst'),f(3,'singular','on / ona / ono','gre','er / sie / es geht'),f(1,'dual','midva / medve','greva','wir beide gehen'),f(2,'dual','vidva / vedve','gresta','ihr beide geht'),f(3,'dual','onadva / onidve','gresta','die beiden gehen'),f(1,'plural','mi / me','gremo','wir gehen'),f(2,'plural','vi / ve','greste','ihr geht'),f(3,'plural','oni / one / ona','gredo','sie gehen')] },
  { id:'imeti', infinitive:'imeti', translation:'haben', forms:[f(1,'singular','jaz','imam','ich habe'),f(2,'singular','ti','imaš','du hast'),f(3,'singular','on / ona / ono','ima','er / sie / es hat'),f(1,'dual','midva / medve','imava','wir beide haben'),f(2,'dual','vidva / vedve','imata','ihr beide habt'),f(3,'dual','onadva / onidve','imata','die beiden haben'),f(1,'plural','mi / me','imamo','wir haben'),f(2,'plural','vi / ve','imate','ihr habt'),f(3,'plural','oni / one / ona','imajo','sie haben')] },
  { id:'živeti', infinitive:'živeti', translation:'leben / wohnen', forms:[f(1,'singular','jaz','živim','ich lebe'),f(2,'singular','ti','živiš','du lebst'),f(3,'singular','on / ona / ono','živi','er / sie / es lebt'),f(1,'dual','midva / medve','živiva','wir beide leben'),f(2,'dual','vidva / vedve','živita','ihr beide lebt'),f(3,'dual','onadva / onidve','živita','die beiden leben'),f(1,'plural','mi / me','živimo','wir leben'),f(2,'plural','vi / ve','živite','ihr lebt'),f(3,'plural','oni / one / ona','živijo','sie leben')] },
  { id:'peljati-se', infinitive:'peljati se', translation:'fahren', reflexive:true, forms:[f(1,'singular','jaz','peljem se','ich fahre'),f(2,'singular','ti','pelješ se','du fährst'),f(3,'singular','on / ona / ono','pelje se','er / sie / es fährt'),f(1,'dual','midva / medve','peljeva se','wir beide fahren'),f(2,'dual','vidva / vedve','peljeta se','ihr beide fahrt'),f(3,'dual','onadva / onidve','peljeta se','die beiden fahren'),f(1,'plural','mi / me','peljemo se','wir fahren'),f(2,'plural','vi / ve','peljete se','ihr fahrt'),f(3,'plural','oni / one / ona','peljejo se','sie fahren')] },
  { id:'jesti', infinitive:'jesti', translation:'essen', forms:[f(1,'singular','jaz','jem','ich esse'),f(2,'singular','ti','ješ','du isst'),f(3,'singular','on / ona / ono','je','er / sie / es isst'),f(1,'dual','midva / medve','jeva','wir beide essen'),f(2,'dual','vidva / vedve','jesta','ihr beide esst'),f(3,'dual','onadva / onidve','jesta','die beiden essen'),f(1,'plural','mi / me','jemo','wir essen'),f(2,'plural','vi / ve','jeste','ihr esst'),f(3,'plural','oni / one / ona','jedo','sie essen')] },
  { id:'piti', infinitive:'piti', translation:'trinken', forms:[f(1,'singular','jaz','pijem','ich trinke'),f(2,'singular','ti','piješ','du trinkst'),f(3,'singular','on / ona / ono','pije','er / sie / es trinkt'),f(1,'dual','midva / medve','pijeva','wir beide trinken'),f(2,'dual','vidva / vedve','pijeta','ihr beide trinkt'),f(3,'dual','onadva / onidve','pijeta','die beiden trinken'),f(1,'plural','mi / me','pijemo','wir trinken'),f(2,'plural','vi / ve','pijete','ihr trinkt'),f(3,'plural','oni / one / ona','pijejo','sie trinken')] },
]

export function verbByInfinitive(value:string) {
  const normalized=value.trim().toLowerCase()
  return verbCatalog.find(verb => verb.infinitive.toLowerCase() === normalized)
}

export function verbById(id:string) {
  return verbCatalog.find(verb => verb.id === id)
}
