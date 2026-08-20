import { Exercise, UserProgress } from '@/types'
import { buildAdaptiveReviewDeck } from '@/lib/adaptive-curriculum'
import { enrichExercises } from '@/lib/curriculum-metadata'

export type SessionPlan={total:number;review:number;transfer:number;weakGrammar:number;weakVocabulary:number;production:number;newContent:number;exerciseIds:string[]}

function targetSize(progress:UserProgress){const minutes=progress.preferences.dailyGoalMinutes;return minutes<=5?5:minutes<=10?8:minutes<=15?10:minutes<=20?12:15}
export function buildSessionPlan(progress:UserProgress,rawExercises:Exercise[],activeLesson:number):SessionPlan{
 const exercises=enrichExercises(rawExercises),total=targetSize(progress),due=progress.reviews.filter(r=>r.dueAt<=Date.now()).length,transfer=Math.min(progress.transferQueue?.length||0,2),weakGrammar=Object.values(progress.mastery||{}).filter(m=>m.kind==='grammar'&&m.attempts>=2&&m.score<.58).length,weakVocabulary=Object.values(progress.mastery||{}).filter(m=>m.kind==='vocabulary'&&m.attempts>=2&&m.score<.58).length
 const pace=progress.preferences.pace,newBudget=pace==='ruhig'?1:pace==='intensiv'?3:2
 const review=Math.min(total,Math.max(due,Math.ceil(total*.3))),grammar=Math.min(2,weakGrammar),vocab=Math.min(2,weakVocabulary),production=Math.min(2,Math.max(1,Math.round(total*.15)))
 const pressure=review+transfer+grammar+vocab
 const newContent=pressure>=Math.ceil(total*.7)?0:Math.min(newBudget,Math.max(0,total-pressure-production))
 const deck=buildAdaptiveReviewDeck(progress,exercises,Math.max(total-newContent,1)),newIds=exercises.filter(e=>e.lesson===activeLesson&&!deck.some(d=>d.id===e.id)).slice(0,newContent).map(e=>e.id)
 const exerciseIds=[...deck.map(e=>e.id),...newIds].slice(0,total)
 return {total:exerciseIds.length,review:Math.min(review,exerciseIds.length),transfer,weakGrammar:grammar,weakVocabulary:vocab,production,newContent,exerciseIds}
}

export function exercisesForPlan(plan:SessionPlan,rawExercises:Exercise[]){const enriched=enrichExercises(rawExercises);return plan.exerciseIds.map(id=>enriched.find(e=>e.id===id)).filter(Boolean) as Exercise[]}
