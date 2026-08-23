import { tokenizeNormalizedAnswer } from './normalizer'
import { GrammarIssue } from './types'
import { caseContrastForForm, DUAL_NUMERAL_GENDER, isDirectionVerb, isLocationVerb, NEGATION_GENITIVE } from '@/lib/slovene-morphology'
import { verbCatalog } from '@/lib/verb-catalog'

function normalized(value:string){return value.trim().toLocaleLowerCase('sl-SI')}

function verbFormInfo(form:string){
  const value=normalized(form)
  for(const verb of verbCatalog){
    const match=verb.forms.find(item=>normalized(item.form)===value)
    if(match)return {verb,form:match}
  }
  return undefined
}

function reflexiveBase(value:string){return normalized(value).replace(/\s+se$/,'')}

/**
 * Deterministic Slovene rule layer.
 * Rules are deliberately explicit: only distinctions that can be explained
 * reliably and are covered by regression tests belong here.
 */
export function detectSloveneGrammarIssues(input: string, expected: string): GrammarIssue[] {
  const inputTokens = tokenizeNormalizedAnswer(input)
  const expectedTokens = tokenizeNormalizedAnswer(expected)
  const issues: GrammarIssue[] = []
  const length = Math.min(inputTokens.length, expectedTokens.length)

  for (let i = 0; i < length; i += 1) {
    const actual = inputTokens[i]
    const wanted = expectedTokens[i]
    if (actual === wanted) continue

    const wantedNumeral=DUAL_NUMERAL_GENDER[wanted]
    if(wantedNumeral?.counterpart===actual){
      issues.push({feature:'numeral',token:actual,expected:wanted,message:wanted==='dva'?"Hier wird für ein männliches Bezugswort 'dva' benötigt.":"Hier wird für ein weibliches bzw. neutrales Bezugswort 'dve' benötigt."})
      continue
    }

    const actualCase=caseContrastForForm(actual)
    const wantedCase=caseContrastForForm(wanted)
    if(actualCase&&wantedCase&&actualCase.lemma===wantedCase.lemma&&actualCase.case!==wantedCase.case){
      const before=expectedTokens.slice(0,i)
      const location=before.some(isLocationVerb)
      const direction=before.some(isDirectionVerb)
      const reason=location&&wantedCase.case==='locative'?'Bei einer Ortsangabe mit „v“ brauchst du hier den Lokativ.':direction&&wantedCase.case==='accusative'?'Bei einer Richtungsangabe mit „v“ brauchst du hier den Akkusativ.':`Hier wird der ${wantedCase.case} benötigt.`
      issues.push({feature:'case',token:actual,expected:wanted,message:reason})
      continue
    }

    if(expectedTokens.includes('nimam')&&NEGATION_GENITIVE[actual]===wanted){
      issues.push({feature:'case',token:actual,expected:wanted,message:'Nach der Verneinung mit „nimam“ steht dieses Nomen hier im Genitiv.'})
      continue
    }

    const actualVerb=verbFormInfo(actual)
    const wantedVerb=verbFormInfo(wanted)
    if(actualVerb&&wantedVerb&&actualVerb.verb.id===wantedVerb.verb.id){
      if(actualVerb.form.number!==wantedVerb.form.number){
        issues.push({feature:'number',token:actual,expected:wanted,message:`Du hast die ${actualVerb.form.number}-Form verwendet; hier wird ${wantedVerb.form.number} benötigt.`})
      }else if(actualVerb.form.person!==wantedVerb.form.person){
        issues.push({feature:'person',token:actual,expected:wanted,message:`Du hast die Form für eine andere Person verwendet. Hier passt „${wanted}“.`})
      }else{
        issues.push({feature:'conjugation',token:actual,expected:wanted,message:`Die Verbform passt hier nicht. Erwartet wird „${wanted}“.`})
      }
      continue
    }
  }

  const normalizedInput=normalized(input)
  const normalizedExpected=normalized(expected)
  if(normalizedExpected.endsWith(' se')&&!normalizedInput.endsWith(' se')&&reflexiveBase(normalizedExpected)===normalizedInput){
    issues.push({feature:'pronoun',token:normalizedInput,expected:normalizedExpected,message:'Bei diesem reflexiven Verb fehlt „se“.'})
  }

  return issues
}
