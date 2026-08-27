import { GRAMMAR_RULES } from '@/lib/curriculum-access'
import { exerciseSemanticFingerprint } from '@/lib/learning-targets'
import type { Exercise, Sentence, TargetContentKey, Vocabulary } from '@/types'

function normalized(value:string){return value.trim().toLocaleLowerCase('sl').normalize('NFKC')}
function vocabPrerequisiteId(key:TargetContentKey){return key.startsWith('vocab:')?key.slice(6):null}

export type ContentValidationInput={vocabulary:Vocabulary[];exercises:Exercise[];sentences:Sentence[]}

export function contentValidationIssues({vocabulary,exercises,sentences}:ContentValidationInput){
  const issues:string[]=[]
  const vocabIds=new Set<string>()
  const slLexemes=new Map<string,string>()
  const exerciseIds=new Set<string>()
  const sentenceIds=new Set<string>()

  for(const word of vocabulary){
    if(vocabIds.has(word.id))issues.push(`duplicate vocabulary id: ${word.id}`)
    vocabIds.add(word.id)
    if(!word.sl.trim()||!word.de.trim())issues.push(`${word.id}: missing translation`)
    if(!word.cefrLevel)issues.push(`${word.id}: missing CEFR level`)
    if(!word.contentType)issues.push(`${word.id}: missing contentType`)
    if(word.contentType==='form'&&!word.parentId)issues.push(`${word.id}: form without parentId`)
    if(word.parentId===word.id)issues.push(`${word.id}: cannot be its own parent`)
    const sl=normalized(word.sl)
    if(word.contentType==='lexeme'||word.contentType==='phrase'){
      const existing=slLexemes.get(sl)
      if(existing&&existing!==word.id)issues.push(`duplicate canonical Slovene content: ${existing} / ${word.id} = ${word.sl}`)
      else slLexemes.set(sl,word.id)
    }
  }

  for(const word of vocabulary){
    if(word.parentId&&!vocabIds.has(word.parentId))issues.push(`${word.id}: unknown parent ${word.parentId}`)
    for(const prerequisite of word.prerequisites||[]){
      if(prerequisite.startsWith('vocab:')&&!vocabIds.has(prerequisite.slice(6)))issues.push(`${word.id}: unknown prerequisite ${prerequisite}`)
      if(prerequisite.startsWith('grammar:')&&!GRAMMAR_RULES[prerequisite.slice(8)])issues.push(`${word.id}: unknown grammar prerequisite ${prerequisite}`)
    }
  }

  // Detect vocabulary prerequisite cycles.
  const graph=new Map(vocabulary.map(word=>[word.id,(word.prerequisites||[]).map(vocabPrerequisiteId).filter((id):id is string=>Boolean(id)&&vocabIds.has(id!))]))
  const visiting=new Set<string>(),visited=new Set<string>()
  function visit(id:string,path:string[]){
    if(visiting.has(id)){issues.push(`vocabulary prerequisite cycle: ${[...path,id].join(' -> ')}`);return}
    if(visited.has(id))return
    visiting.add(id)
    for(const next of graph.get(id)||[])visit(next,[...path,id])
    visiting.delete(id);visited.add(id)
  }
  vocabulary.forEach(word=>visit(word.id,[]))

  const semantic=new Map<string,string>()
  for(const exercise of exercises){
    if(exerciseIds.has(exercise.id))issues.push(`duplicate exercise id: ${exercise.id}`)
    exerciseIds.add(exercise.id)
    for(const id of exercise.vocabularyIds||[])if(!vocabIds.has(id))issues.push(`${exercise.id}: unknown vocabulary ${id}`)
    for(const prerequisite of exercise.prerequisites||[]){
      if(prerequisite.startsWith('vocab:')&&!vocabIds.has(prerequisite.slice(6)))issues.push(`${exercise.id}: unknown prerequisite ${prerequisite}`)
      if(prerequisite.startsWith('grammar:')&&!GRAMMAR_RULES[prerequisite.slice(8)])issues.push(`${exercise.id}: unknown grammar prerequisite ${prerequisite}`)
    }
    const fp=exerciseSemanticFingerprint(exercise)
    const duplicate=semantic.get(fp)
    if(duplicate&&!exercise.variantOfExerciseId)issues.push(`semantic duplicate exercise: ${duplicate} / ${exercise.id}`)
    else semantic.set(fp,exercise.id)
  }

  for(const sentence of sentences){
    if(sentenceIds.has(sentence.id))issues.push(`duplicate sentence id: ${sentence.id}`)
    sentenceIds.add(sentence.id)
    for(const id of sentence.vocabularyIds||[])if(!vocabIds.has(id))issues.push(`${sentence.id}: unknown vocabulary ${id}`)
    for(const prerequisite of sentence.prerequisites||[])if(prerequisite.startsWith('vocab:')&&!vocabIds.has(prerequisite.slice(6)))issues.push(`${sentence.id}: unknown prerequisite ${prerequisite}`)
  }

  return issues
}

export function atomicIntroductionIssues(vocabulary:Vocabulary[]){
  const issues:string[]=[]
  for(const word of vocabulary){
    // Example cards are opt-in. If enabled, prerequisites must be explicitly documented so
    // the UI can guarantee that context does not silently introduce multiple new atoms.
    if(word.introExample&&word.example&&!(word.prerequisites||[]).length){
      issues.push(`${word.id}: introExample requires explicit prerequisites`)
    }
  }
  return issues
}
