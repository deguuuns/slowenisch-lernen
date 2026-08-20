import { buildLearningBlocks, NEW_WORDS_PER_BLOCK } from '@/lib/learning-flow'
import { Exercise, Vocabulary } from '@/types'

function assert(condition:boolean,message:string) {
  if(!condition) throw new Error(`Learning-flow regression: ${message}`)
}

export function runLearningFlowChecks() {
  const words:Vocabulary[]=[
    {id:'a',sl:'a',de:'A',partOfSpeech:'Substantiv',category:'Test',example:'a',exampleDe:'A',lesson:1},
    {id:'b',sl:'b',de:'B',partOfSpeech:'Substantiv',category:'Test',example:'b',exampleDe:'B',lesson:1},
    {id:'c',sl:'c',de:'C',partOfSpeech:'Substantiv',category:'Test',example:'c',exampleDe:'C',lesson:1},
    {id:'d',sl:'d',de:'D',partOfSpeech:'Substantiv',category:'Test',example:'d',exampleDe:'D',lesson:1}
  ]
  const exercises:Exercise[]=[
    {id:'custom',lesson:1,type:'translate-de-sl',prompt:'A + B',answer:'a b',vocabularyIds:['a','b']}
  ]

  const blocks=buildLearningBlocks(1,words,exercises,[])
  assert(blocks.length===2,'four words should create two learning blocks')
  assert(blocks.every(b=>b.words.length<=NEW_WORDS_PER_BLOCK),'a block introduced more than the configured maximum')
  assert(blocks[0].exercises.some(e=>e.id==='custom'),'matching curated exercise was not attached to the first block')
  assert(blocks[0].words.every(w=>blocks[0].exercises.some(e=>e.vocabularyIds?.includes(w.id))),'every introduced word needs timely practice')

  const first=blocks[0].exercises[0]
  assert(!first.id.startsWith('gen-recognize-'),'a fresh block must not begin with a direct meaning-recognition question')
  const firstRecognition=blocks[0].exercises.findIndex(e=>e.id.startsWith('gen-recognize-'))
  assert(firstRecognition!==0,'direct recognition must be delayed behind contextual/productive work')

  const second=blocks[1]
  assert(second.exercises[0].id==='custom'||second.exercises[0].id.startsWith('gen-recognize-'),'later blocks should use known material as a buffer when available')
  const dRecognition=second.exercises.findIndex(e=>e.id==='gen-recognize-d')
  const dProduction=second.exercises.findIndex(e=>e.id==='gen-produce-d')
  assert(dRecognition<0||dProduction<dRecognition,'active production should precede direct recognition for a freshly introduced word')

  const resumed=buildLearningBlocks(1,words,exercises,['a','b','c'])
  assert(resumed.length===1&&resumed[0].words[0].id==='d','already introduced words were presented again')

  const generatedIds=blocks.flatMap(b=>b.exercises.filter(e=>e.generated).map(e=>e.id))
  assert(generatedIds.includes('gen-recognize-a')&&generatedIds.includes('gen-produce-a'),'recognition and active production should both remain available')

  return true
}
