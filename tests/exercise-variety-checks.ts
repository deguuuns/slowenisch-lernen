import assert from 'node:assert/strict'
import { createExerciseSession } from '../lib/exercise-session'
import { expandExerciseVariety, exerciseVarietyCounts } from '../lib/exercise-variety'
import { buildPracticeDeck } from '../lib/practice-engine'
import { defaultProgress } from '../lib/storage'
import type { Exercise, UserProgress } from '../types'

const base:Exercise[]=[
  {id:'variety-1',lesson:1,type:'translate-de-sl',prompt:'Ich wohne in Deutschland.',answer:'Živim v Nemčiji.',skillTargets:['production']},
  {id:'variety-2',lesson:1,type:'fill',prompt:'Ergänze: Jaz ___ vodo.',answer:'pijem vodo danes',skillTargets:['production'],grammarRuleIds:[]},
  {id:'variety-3',lesson:1,type:'choice',prompt:'Was heißt „Haus“?',answer:'hiša',alternatives:['voda','mesto','kruh'],skillTargets:['recognition']},
  {id:'variety-4',lesson:1,type:'translate-de-sl',prompt:'Guten Morgen.',answer:'Dobro jutro.',skillTargets:['production']},
  {id:'variety-5',lesson:1,type:'free',prompt:'Persönlich antworten',answer:'Sem doma.',responseScope:'personal-open',evaluationMode:'open',skillTargets:['production']},
  {id:'variety-6',lesson:1,type:'fill',prompt:'Was hörst du?',answer:'Dober dan.',skillTargets:['listening']},
]

const expanded=expandExerciseVariety(base)
const counts=exerciseVarietyCounts(expanded)
assert.equal(counts.standard,base.length)
assert.ok(counts.reorder>=2,'multi-word production exercises should gain reorder variants')
assert.ok(counts['recognition-choice']>=2,'assessable non-choice exercises should gain recognition variants')
assert.equal(counts['active-recall'],1,'choice exercises should gain active-recall variants')

const reorder=expanded.find(item=>item.presentationVariant==='reorder')
assert.ok(reorder)
assert.equal(reorder?.generated,true)
assert.ok(reorder?.variantOfExerciseId)
assert.ok((reorder?.wordBank?.length||0)>=3)
assert.match(reorder?.prompt||'',/Wörter:/)
assert.ok(reorder?.skillTargets?.includes('grammar-application'))

const recognition=expanded.find(item=>item.presentationVariant==='recognition-choice')
assert.ok(recognition)
assert.equal(recognition?.type,'choice')
assert.ok((recognition?.alternatives?.length||0)>=2)
assert.ok(!(recognition?.alternatives||[]).some(value=>value.toLocaleLowerCase('sl')===recognition?.answer.toLocaleLowerCase('sl')))

const recall=expanded.find(item=>item.presentationVariant==='active-recall')
assert.ok(recall)
assert.equal(recall?.type,'free')
assert.ok(recall?.skillTargets?.includes('production'))
assert.equal(recall?.alternatives,undefined)

assert.equal(expanded.filter(item=>item.variantOfExerciseId==='variety-5').length,0,'personal-open exercises must not be auto-varied')
assert.equal(expanded.filter(item=>item.variantOfExerciseId==='variety-6').length,0,'listening exercises must keep their dedicated format')

const generated=expanded.filter(item=>item.generated)
const session=createExerciseSession('review',generated.slice(0,Math.min(6,generated.length)),'phase15-variety')
assert.equal(session.exercises.length,Math.min(6,generated.length))
for(const item of session.exercises){
  assert.equal(item.sourceExerciseId,item.exercise.variantOfExerciseId)
  if(item.exercise.type==='choice')assert.ok(item.options.length>=3)
}

const progress:UserProgress={...defaultProgress,recentAttempts:[],mastery:{...defaultProgress.mastery,'skill:recognition':{key:'skill:recognition',kind:'skill',score:.45,attempts:3,correct:1,lastSeen:1},'skill:production':{key:'skill:production',kind:'skill',score:.25,attempts:3,correct:1,lastSeen:1}}}
const adaptive=buildPracticeDeck(progress,base.filter(item=>item.responseScope!=='personal-open'&&!item.skillTargets?.includes('listening')),4,Date.now())
assert.ok(adaptive.some(item=>item.generated),'adaptive practice should be able to select generated presentation variants')
assert.equal(new Set(adaptive.map(item=>item.id)).size,adaptive.length)

console.log('Exercise variety checks passed')
