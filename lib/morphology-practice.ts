import { CASE_CONTRASTS, DUAL_NUMERAL_GENDER, morphologyForLemma, type SloveneCase } from '@/lib/slovene-morphology'

export type MorphologyPracticeKind = 'case-location' | 'case-direction' | 'dual-numeral' | 'noun-form'

export type MorphologyPracticeItem = {
  id:string
  kind:MorphologyPracticeKind
  lemma:string
  prompt:string
  expected:string
  explanation:string
  targetKey:string
}

export function buildCaseContrastPractice(lemma:string, mode:'location'|'direction'):MorphologyPracticeItem | undefined {
  const entry=CASE_CONTRASTS.find(item=>item.lemma.toLocaleLowerCase('sl-SI')===lemma.toLocaleLowerCase('sl-SI'))
  if(!entry)return undefined
  const expected=mode==='location'?entry.locative:entry.accusative
  if(!expected)return undefined
  return {
    id:`morph:${lemma}:${mode}`,
    kind:mode==='location'?'case-location':'case-direction',
    lemma,
    prompt:mode==='location'?`Sem v ___. (${lemma})`:`Grem v ___. (${lemma})`,
    expected,
    explanation:mode==='location'?'Ort mit v verlangt hier den Lokativ.':'Richtung mit v verlangt hier den Akkusativ.',
    targetKey:`grammar:case:${mode==='location'?'locative':'accusative'}`,
  }
}

export function buildDualNumeralPractice(lemma:string):MorphologyPracticeItem | undefined {
  const noun=morphologyForLemma(lemma)
  if(!noun?.gender)return undefined
  const numeral=noun.gender==='masculine'?'dva':'dve'
  const expectedForm=noun.forms?.dual?.nominative
  if(!expectedForm)return undefined
  return {
    id:`morph:${lemma}:dual-numeral`,kind:'dual-numeral',lemma,
    prompt:`___ ${expectedForm}`,
    expected:numeral,
    explanation:`${numeral} passt zum Genus von „${lemma}“ im Dual.`,
    targetKey:'grammar:dual',
  }
}

export function buildNounFormPractice(lemma:string, number:'singular'|'dual'|'plural', sloveneCase:SloveneCase):MorphologyPracticeItem | undefined {
  const noun=morphologyForLemma(lemma)
  const expected=noun?.forms?.[number]?.[sloveneCase]
  if(!expected)return undefined
  return {
    id:`morph:${lemma}:${number}:${sloveneCase}`,kind:'noun-form',lemma,
    prompt:`${lemma}: ${number}, ${sloveneCase}`,
    expected,
    explanation:`Gesucht ist ${sloveneCase} ${number} von „${lemma}“.`,
    targetKey:`grammar:case:${sloveneCase}`,
  }
}

export function buildCoreMorphologyPractice() {
  const items:MorphologyPracticeItem[]=[]
  for(const entry of CASE_CONTRASTS){
    const location=buildCaseContrastPractice(entry.lemma,'location')
    const direction=buildCaseContrastPractice(entry.lemma,'direction')
    if(location)items.push(location)
    if(direction)items.push(direction)
  }
  for(const lemma of ['brat','sestra']){
    const dual=buildDualNumeralPractice(lemma)
    if(dual)items.push(dual)
  }
  return items
}
