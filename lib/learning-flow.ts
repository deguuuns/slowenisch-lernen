import { enrichExercise } from '@/lib/curriculum-metadata'
import { Exercise, Vocabulary } from '@/types'

export const NEW_WORDS_PER_BLOCK = 3
export const EXERCISES_PER_BLOCK = 4

export type LearningBlock = {
  id: string
  words: Vocabulary[]
  exercises: Exercise[]
}

export function withLearningMetadata(exercise: Exercise): Exercise {
  return enrichExercise(exercise)
}

function unique<T>(items:T[]) { return Array.from(new Set(items)) }

function distractors(word:Vocabulary, lessonWords:Vocabulary[]) {
  return lessonWords
    .filter(v=>v.id!==word.id && v.partOfSpeech===word.partOfSpeech)
    .concat(lessonWords.filter(v=>v.id!==word.id))
    .map(v=>v.de)
    .filter(v=>v!==word.de)
    .filter((v,i,a)=>a.indexOf(v)===i)
    .slice(0,3)
}

export function generatedExercisesForWord(word:Vocabulary, lessonWords:Vocabulary[]): Exercise[] {
  const choices = distractors(word, lessonWords)
  return [
    {
      id:`gen-recognize-${word.id}`,
      lesson:word.lesson,
      type:'choice',
      prompt:`Was bedeutet „${word.sl}“?`,
      answer:word.de,
      alternatives:choices,
      vocabularyIds:[word.id],
      grammarRuleIds:[],
      evaluationMode:'exact',
      generated:true
    },
    {
      id:`gen-produce-${word.id}`,
      lesson:word.lesson,
      type:'translate-de-sl',
      prompt:`Übersetze: ${word.de}`,
      answer:word.sl,
      vocabularyIds:[word.id],
      grammarRuleIds:[],
      evaluationMode:'acceptedVariants',
      generated:true
    }
  ]
}

export function buildLearningBlocks(
  lessonId:number,
  vocabulary:Vocabulary[],
  exercises:Exercise[],
  introducedWordIds:string[],
  size=NEW_WORDS_PER_BLOCK
): LearningBlock[] {
  const lessonWords=vocabulary.filter(v=>v.lesson===lessonId)
  const unseen=lessonWords.filter(v=>!introducedWordIds.includes(v.id))
  const curated=exercises.filter(e=>e.lesson===lessonId).map(withLearningMetadata)
  const blocks:LearningBlock[]=[]
  const available=new Set(introducedWordIds)

  for(let start=0; start<unseen.length; start+=size) {
    const words=unseen.slice(start,start+size)
    words.forEach(w=>available.add(w.id))
    const currentIds=new Set(words.map(w=>w.id))

    const matching=curated.filter(ex=>{
      const ids=ex.vocabularyIds ?? []
      return ids.length>0 && ids.every(id=>available.has(id)) && ids.some(id=>currentIds.has(id))
    })

    const generated=words.flatMap(w=>generatedExercisesForWord(w,lessonWords))
    const selected=unique([...matching,...generated].map(e=>e.id))
      .map(id=>[...matching,...generated].find(e=>e.id===id)!)
      .sort((a,b)=>Number(a.generated)-Number(b.generated))
      .slice(0,Math.max(EXERCISES_PER_BLOCK,words.length*2))

    blocks.push({id:`lesson-${lessonId}-block-${blocks.length+1}`,words,exercises:selected})
  }

  return blocks
}

export function buildFinalReview(lessonId:number, exercises:Exercise[], max=8) {
  const lessonExercises=exercises.filter(e=>e.lesson===lessonId).map(withLearningMetadata)
  const productive=lessonExercises.filter(e=>e.type!=='choice')
  const recognition=lessonExercises.filter(e=>e.type==='choice')
  return [...productive,...recognition].slice(0,max)
}

export function lessonProgress(blockIndex:number,totalBlocks:number,exerciseIndex=0,exerciseCount=1) {
  if(totalBlocks<=0) return 100
  const within=Math.min(1,exerciseIndex/Math.max(1,exerciseCount))
  return Math.min(100,Math.round(((blockIndex+within)/totalBlocks)*100))
}
