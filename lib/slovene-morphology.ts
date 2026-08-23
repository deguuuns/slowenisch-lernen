export type SloveneCase = 'nominative' | 'genitive' | 'dative' | 'accusative' | 'locative' | 'instrumental'
export type SloveneNumber = 'singular' | 'dual' | 'plural'

export type CaseContrast = {
  lemma:string
  locative?:string
  accusative?:string
  genitive?:string
}

/**
 * Curated morphology facts used by deterministic evaluation.
 * Keep this registry factual and explicit: it is not intended to guess
 * arbitrary Slovene morphology. New entries should be backed by tests.
 */
export const CASE_CONTRASTS:CaseContrast[] = [
  { lemma:'Slovenija', locative:'Sloveniji', accusative:'Slovenijo', genitive:'Slovenije' },
  { lemma:'Nemčija', locative:'Nemčiji', accusative:'Nemčijo', genitive:'Nemčije' },
  { lemma:'služba', locative:'službi', accusative:'službo', genitive:'službe' },
  { lemma:'restavracija', locative:'restavraciji', accusative:'restavracijo', genitive:'restavracije' },
]

export const NEGATION_GENITIVE:Record<string,string> = {
  čas:'časa',
}

export const DUAL_NUMERAL_GENDER:Record<string,{gender:'masculine'|'feminine'|'neuter'; counterpart:string}> = {
  dva:{gender:'masculine',counterpart:'dve'},
  dve:{gender:'feminine',counterpart:'dva'},
}

function normalized(value:string){return value.trim().toLocaleLowerCase('sl-SI')}

export function caseContrastForForm(form:string) {
  const value=normalized(form)
  for(const entry of CASE_CONTRASTS){
    if(entry.locative&&normalized(entry.locative)===value)return {...entry,case:'locative' as SloveneCase}
    if(entry.accusative&&normalized(entry.accusative)===value)return {...entry,case:'accusative' as SloveneCase}
    if(entry.genitive&&normalized(entry.genitive)===value)return {...entry,case:'genitive' as SloveneCase}
  }
  return undefined
}

export function isLocationVerb(token:string){
  return ['sem','si','je','smo','ste','so','živim','živiš','živi','živimo','živite','živijo'].includes(normalized(token))
}

export function isDirectionVerb(token:string){
  return ['grem','greš','gre','greva','gresta','gremo','greste','gredo','peljem','pelješ','pelje','peljeva','peljeta','peljemo','peljete','peljejo'].includes(normalized(token))
}
