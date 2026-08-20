import { Exercise, UserProgress } from '@/types'
import { buildAdaptiveReviewDeck } from '@/lib/adaptive-curriculum'
import { enrichExercises } from '@/lib/curriculum-metadata'
import { isExerciseEligible } from '@/lib/curriculum-access'

export type SessionPlan={total:number;review:number;transfer:number;weakGrammar:number;weakVocabulary:number;production:number;newContent:number;exerciseIds:string[]}
function targetSize(progress:UserProgress){const minutes=progress.preferences.dailyGoalMinutes;return minutes<=5?5:minutes<=10?8:minutes<=15?10:minutes<=20?12:15}
function signature(ex:Exercise){return `${ex.type}|${(ex.vocabularyIds||[]).slice().sort().join(',')}|${(ex.grammarRuleIds||[]).slice().sort().join(',')}`}
function diversify(exercises:Exercise[],recentIds:Set<string>,limit:number){const out:Exercise[]=[],used=new Set<string>();for(const ex of exercises){const sig=signature(ex);if(recentIds.has(ex.id)||used.has(sig))continue;out.push(ex);used.add(sig);if(out.length>=limit)break}if(out.length<limit)for(const ex of exercises){if(out.some(x=>x.id===ex.id)||recentIds.has(ex.id))continue;out.push(ex);if(out.length>=limit)break}return out}
export function buildSessionPlan(progress:UserProgress,rawExercises:Exercise[],activeLesson:number):SessionPlan{
 const exercises=enrichExercises(rawExercises).filter(e=>isExerciseEligible(e,progress)),total=targetSize(progress),due=progress.reviews.filter(r=>r.dueAt<=Date.now()).length,transfer=Math.min((progress.transferQueue||[]).filter(t=>progress.introducedGrammarRules.includes(t.grammarRuleId)).length,2),weakGrammar=Object.values(progress.mastery||{}).filter(m=>m.kind==='grammar'&&m.attempts>=2&&m.score<.58&&progress.introducedGrammarRules.includes(m.key.replace('grammar:',''))).length,weakVocabulary=Object.values(progress.mastery||{}).filter(m=>m.kind==='vocabulary'&&m.attempts>=2&&m.score<.58&&progress.introducedWords.includes(m.key.replace('vocab:',''))).length
 const review=Math.min(total,Math.max(due,Math.ceil(total*.3))),grammar=Math.min(2,weakGrammar),vocab=Math.min(2,weakVocabulary),production=Math.min(2,Math.max(1,Math.round(total*.15)))
 const deck=buildAdaptiveReviewDeck(progress,exercises,total),recentIds=new Set((progress.recentAttempts||[]).slice(-6).map(a=>a.exerciseId)),selected=diversify(deck,recentIds,total)
 return {total:selected.length,review:Math.min(review,selected.length),transfer,weakGrammar:grammar,weakVocabulary:vocab,production,newContent:0,exerciseIds:selected.map(e=>e.id)}
}
export function exercisesForPlan(plan:SessionPlan,rawExercises:Exercise[]){const enriched=enrichExercises(rawExercises);return plan.exerciseIds.map(id=>enriched.find(e=>e.id===id)).filter(Boolean) as Exercise[]}
