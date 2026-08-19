import { enrichExercise } from '@/lib/curriculum-metadata'
import { Exercise, TransferItem } from '@/types'

export function buildTransferExercise(item:TransferItem,exercises:Exercise[],attemptCount:number):Exercise|null{
  if(attemptCount<item.dueAfter) return null
  const enriched=exercises.map(enrichExercise)
  const candidates=enriched.filter(ex=>ex.id!==item.sourceExerciseId&&ex.grammarRuleIds?.includes(item.grammarRuleId))
  if(!candidates.length) return null
  const productive=candidates.filter(ex=>ex.type==='translate-de-sl'||ex.type==='free'||ex.type==='fill'||ex.type==='ending')
  const pool=productive.length?productive:candidates
  const selected=pool[Math.abs(hash(`${item.sourceExerciseId}:${item.grammarRuleId}:${attemptCount}`))%pool.length]
  return {...selected,transferSourceExerciseId:item.sourceExerciseId,transferRuleId:item.grammarRuleId}
}

export function injectDueTransfer(base:Exercise[],queue:TransferItem[],exercises:Exercise[],attemptCount:number){
  const due=queue.map(item=>({item,exercise:buildTransferExercise(item,exercises,attemptCount)})).find(x=>x.exercise)
  if(!due?.exercise) return {exercises:base,consumed:null as TransferItem|null}
  const withoutDuplicate=base.filter(ex=>ex.id!==due.exercise!.id)
  const insertAt=Math.min(2,withoutDuplicate.length)
  return {exercises:[...withoutDuplicate.slice(0,insertAt),due.exercise,...withoutDuplicate.slice(insertAt)],consumed:due.item}
}

function hash(value:string){let h=0;for(let i=0;i<value.length;i++)h=((h<<5)-h)+value.charCodeAt(i)|0;return h}
