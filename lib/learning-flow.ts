import { Exercise, Vocabulary } from '@/types'

export const NEW_WORDS_PER_BLOCK = 3
export const EXERCISES_PER_BLOCK = 4

export type LearningBlock = {
  id: string
  words: Vocabulary[]
  exercises: Exercise[]
}

const exerciseVocabulary: Record<string, string[]> = {
  e01:['v001'], e02:['v011'], e03:['v015','v077'], e04:['v028'], e05:['v026'], e06:['v027'], e07:['v026','v011'],
  e08:['v032','v039','v055'], e09:['v032','v040','v054'], e10:['v050'], e11:['v034','v035'], e12:['v046','v039','v055'], e13:['v047','v060'],
  e14:['v014','v062'], e15:['v063','v024'], e16:['v075','v059'], e17:['v076','v053'], e18:['v068','v065'], e19:['v080','v005'],
  e20:['v082','v091'], e21:['v085','v088'], e22:['v085','v087'], e23:['v083','v082','v091'], e24:['v086','v085','v087'], e25:['v098'],
  e26:['v104','v005'], e27:['v005'], e28:['v005'], e29:['v007','v008'], e30:['v055','v005'], e31:['v088','v005'], e32:['v101']
}

export function withLearningMetadata(exercise: Exercise): Exercise {
  return {
    ...exercise,
    vocabularyIds: exercise.vocabularyIds ?? exerciseVocabulary[exercise.id] ?? [],
    evaluationMode: exercise.evaluationMode ?? (exercise.type === 'free' ? 'acceptedVariants' : 'exact')
  }
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
      .slice(0,Math.max(EXERCISES_PER_BLOCK,words.length*2))

    blocks.push({id:`lesson-${lessonId}-block-${blocks.length+1}`,words,exercises:selected})
  }

  return blocks
}

export function buildFinalReview(lessonId:number, exercises:Exercise[], max=8) {
  return exercises.filter(e=>e.lesson===lessonId).map(withLearningMetadata).slice(0,max)
}

export function lessonProgress(blockIndex:number,totalBlocks:number,exerciseIndex=0,exerciseCount=1) {
  if(totalBlocks<=0) return 100
  const within=Math.min(1,exerciseIndex/Math.max(1,exerciseCount))
  return Math.min(100,Math.round(((blockIndex+within)/totalBlocks)*100))
}
