export type GrammaticalNumber='singular'|'dual'|'plural'
export type GrammaticalCase='nominative'|'genitive'|'dative'|'accusative'|'locative'|'instrumental'
export type Gender='masculine'|'feminine'|'neuter'

export type InflectionTable=Partial<Record<GrammaticalNumber,Partial<Record<GrammaticalCase,string>>>>
export type NounEntry={id:string;lemma:string;translation:string;gender:Gender;forms:InflectionTable;notes?:string[]}
export type AdjectiveForm={gender:Gender;number:GrammaticalNumber;case:GrammaticalCase;form:string}
export type AdjectiveEntry={id:string;lemma:string;translation:string;forms:AdjectiveForm[]}

export const nounCatalog:NounEntry[]=[
 {id:'brat',lemma:'brat',translation:'Bruder',gender:'masculine',forms:{singular:{nominative:'brat',genitive:'brata',dative:'bratu',accusative:'brata',locative:'bratu',instrumental:'bratom'},dual:{nominative:'brata',genitive:'bratov',dative:'bratoma',accusative:'brata',locative:'bratih',instrumental:'bratoma'},plural:{nominative:'bratje',genitive:'bratov',dative:'bratom',accusative:'brate',locative:'bratih',instrumental:'brati'}}},
 {id:'sestra',lemma:'sestra',translation:'Schwester',gender:'feminine',forms:{singular:{nominative:'sestra',genitive:'sestre',dative:'sestri',accusative:'sestro',locative:'sestri',instrumental:'sestro'},dual:{nominative:'sestri',genitive:'sester',dative:'sestrama',accusative:'sestri',locative:'sestrah',instrumental:'sestrama'},plural:{nominative:'sestre',genitive:'sester',dative:'sestram',accusative:'sestre',locative:'sestrah',instrumental:'sestrami'}}},
 {id:'mesto',lemma:'mesto',translation:'Stadt / Ort',gender:'neuter',forms:{singular:{nominative:'mesto',genitive:'mesta',dative:'mestu',accusative:'mesto',locative:'mestu',instrumental:'mestom'},dual:{nominative:'mesti',genitive:'mest',dative:'mestoma',accusative:'mesti',locative:'mestih',instrumental:'mestoma'},plural:{nominative:'mesta',genitive:'mest',dative:'mestom',accusative:'mesta',locative:'mestih',instrumental:'mesti'}}},
 {id:'slovenija',lemma:'Slovenija',translation:'Slowenien',gender:'feminine',forms:{singular:{nominative:'Slovenija',genitive:'Slovenije',dative:'Sloveniji',accusative:'Slovenijo',locative:'Sloveniji',instrumental:'Slovenijo'}},notes:['Ortsangabe: v Sloveniji','Richtung: v Slovenijo']},
 {id:'nemcija',lemma:'Nemčija',translation:'Deutschland',gender:'feminine',forms:{singular:{nominative:'Nemčija',genitive:'Nemčije',dative:'Nemčiji',accusative:'Nemčijo',locative:'Nemčiji',instrumental:'Nemčijo'}},notes:['Ortsangabe: v Nemčiji','Richtung: v Nemčijo']},
]

const adjective=(gender:Gender,number:GrammaticalNumber,case_:GrammaticalCase,form:string):AdjectiveForm=>({gender,number,case:case_,form})
export const adjectiveCatalog:AdjectiveEntry[]=[
 {id:'dober',lemma:'dober',translation:'gut',forms:[
  adjective('masculine','singular','nominative','dober'),adjective('feminine','singular','nominative','dobra'),adjective('neuter','singular','nominative','dobro'),
  adjective('masculine','dual','nominative','dobra'),adjective('feminine','dual','nominative','dobri'),adjective('neuter','dual','nominative','dobri'),
  adjective('masculine','plural','nominative','dobri'),adjective('feminine','plural','nominative','dobre'),adjective('neuter','plural','nominative','dobra'),
  adjective('masculine','singular','accusative','dobrega'),adjective('feminine','singular','accusative','dobro'),adjective('neuter','singular','accusative','dobro')
 ]},
]

export function nounByLemma(lemma:string){const n=lemma.trim().toLowerCase();return nounCatalog.find(x=>x.lemma.toLowerCase()===n)}
export function nounForm(lemma:string,number:GrammaticalNumber,case_:GrammaticalCase){return nounByLemma(lemma)?.forms[number]?.[case_]}
export function adjectiveForm(lemma:string,gender:Gender,number:GrammaticalNumber,case_:GrammaticalCase){const n=lemma.trim().toLowerCase();return adjectiveCatalog.find(x=>x.lemma.toLowerCase()===n)?.forms.find(x=>x.gender===gender&&x.number===number&&x.case===case_)?.form}
export function numeralForTwo(gender:Gender){return gender==='feminine'?'dve':'dva'}
export function locationDirectionForms(lemma:string){return {location:nounForm(lemma,'singular','locative'),direction:nounForm(lemma,'singular','accusative')}}
export function auditMorphologyDatabase(){const errors:string[]=[];for(const noun of nounCatalog){if(!noun.forms.singular?.nominative)errors.push(`${noun.id}: missing nominative singular`);if(noun.forms.dual&&!noun.forms.dual.nominative)errors.push(`${noun.id}: incomplete dual`);if(noun.forms.plural&&!noun.forms.plural.nominative)errors.push(`${noun.id}: incomplete plural`)}return errors}
