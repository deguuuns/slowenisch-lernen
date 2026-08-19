import { exercises } from '@/data/seed'
import { curriculumMetadataIssues, enrichExercises } from '@/lib/curriculum-metadata'

function assert(ok:boolean,message:string){if(!ok)throw new Error(`Curriculum metadata check failed: ${message}`)}

export function runCurriculumMetadataChecks(){
  const issues=curriculumMetadataIssues(exercises)
  assert(issues.length===0,issues.join('; '))
  const enriched=enrichExercises(exercises)
  const e08=enriched.find(e=>e.id==='e08')!
  const e09=enriched.find(e=>e.id==='e09')!
  const e22=enriched.find(e=>e.id==='e22')!
  const e32=enriched.find(e=>e.id==='e32')!
  assert(e08.grammarRuleIds?.includes('dual-masculine-numeral')===true,'e08 must train masculine dual')
  assert(e09.grammarRuleIds?.includes('accusative-feminine-a-o')===true,'e09 must train feminine accusative')
  assert(e22.grammarRuleIds?.includes('accusative-feminine-a-o')===true,'e22 must share transfer rule with e09')
  assert(e32.grammarRuleIds?.includes('direction-v-accusative')===true,'e32 must train direction')
  assert(enriched.every(e=>(e.vocabularyIds?.length||0)>0),'every curated exercise must reference vocabulary')
}
