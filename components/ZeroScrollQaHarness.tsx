'use client'

import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import ExerciseDeck from '@/components/ExerciseDeck'
import ListeningPractice from '@/components/ListeningPractice'
import SpeechPractice from '@/components/SpeechPractice'
import VocabWorkspace from '@/components/VocabWorkspace'
import { releasedVocabulary } from '@/data/curriculum'
import { createExerciseSession } from '@/lib/exercise-session'
import { defaultProgress } from '@/lib/storage'
import { verbCatalog } from '@/lib/verb-catalog'
import type { Exercise } from '@/types'

const longGerman='Ich habe heute leider keine Zeit, weil ich am Nachmittag arbeiten muss und danach direkt nach Hause fahre.'
const longSlovene='Danes žal nimam časa, ker moram popoldne delati in se potem peljem naravnost domov.'
const dualRule='dual-masculine-numeral'

const cases:Record<string,Exercise[]>={
  'choice-long':[{id:'qa-choice-long',lesson:2,type:'choice',prompt:'Welche Antwort passt am besten zu dieser Situation?',answer:'Ich habe heute leider keine Zeit und komme deshalb erst morgen.',alternatives:['Ich habe heute sehr viel Zeit und kann sofort kommen.','Ich bin heute unterwegs, aber am Nachmittag wieder zu Hause.','Ich arbeite heute lange und fahre danach mit dem Bus ins Zentrum.'],skillTargets:['recognition'],learningPhase:'recognize'}],
  'input-long':[{id:'qa-input-long',lesson:3,type:'free',prompt:`Übersetze ins Slowenische: ${longGerman}`,answer:longSlovene,skillTargets:['production'],learningPhase:'active-production'}],
  'wordbank':[{id:'qa-wordbank',lesson:2,type:'free',prompt:'Baue den Satz: Ich habe zwei Brüder.',answer:'Imam dva brata.',wordBank:['Imam','dva','brata.'],skillTargets:['production','grammar-application'],grammarRuleIds:[dualRule],learningPhase:'guided-production'}],
  'conjugation':[{id:'qa-conjugation',lesson:2,type:'free',prompt:'Setze govoriti für „wir beide“ ein: Midva ___ slovensko.',answer:'govoriva',acceptedAnswers:['govoriva'],skillTargets:['production','grammar-application'],grammarRuleIds:[dualRule,'verb-first-person'],learningPhase:'variation'}],
  'dual':[{id:'qa-dual',lesson:2,type:'free',prompt:'Übersetze: Ich habe zwei Brüder.',answer:'Imam dva brata.',skillTargets:['production','grammar-application'],grammarRuleIds:[dualRule],learningPhase:'variation',explanation:'Bei zwei männlichen Personen verwendet Slowenisch den Dual. Deshalb steht nach dva die Dualform brata.'}],
  'long-feedback':[{id:'qa-long-feedback',lesson:2,type:'free',prompt:'Übersetze: Ich habe zwei Brüder.',answer:'Imam dva brata.',skillTargets:['production','grammar-application'],grammarRuleIds:[dualRule],learningPhase:'variation',explanation:'Die Zahl dva wird mit männlichen Substantiven verwendet. Bei genau zwei Personen steht brat im Dual als brata; dve gehört hier nicht zu brat.'}],
  'error-review':[
    {id:'qa-error-a',lesson:2,type:'free',prompt:'Übersetze: Ich habe zwei Brüder.',answer:'Imam dva brata.',skillTargets:['production','grammar-application'],grammarRuleIds:[dualRule],learningPhase:'variation'},
    {id:'qa-error-b',lesson:2,type:'choice',prompt:'Welche Form gehört zu zwei Schwestern?',answer:'dve sestri',alternatives:['dva sestri','dve sestre','dva sestre'],skillTargets:['recognition','grammar-application'],grammarRuleIds:[dualRule],learningPhase:'recognize'},
  ],
}

export default function ZeroScrollQaHarness(){
  const params=useSearchParams()
  const kind=params.get('case')||'input-long'
  const dark=params.get('theme')==='dark'
  const progress=useMemo(()=>({...defaultProgress,introducedWords:releasedVocabulary.map(word=>word.id),wordsLearned:releasedVocabulary.map(word=>word.id),introducedVerbForms:verbCatalog.flatMap(verb=>verb.forms.map(form=>`${verb.id}:${form.number}:${form.person}`))}),[])
  const session=useMemo(()=>createExerciseSession('learning-block',cases[kind]||cases['input-long'],`qa:${kind}`),[kind])

  useEffect(()=>{
    if(dark)document.documentElement.dataset.theme='dark'
    else delete document.documentElement.dataset.theme
    return()=>{delete document.documentElement.dataset.theme;delete document.documentElement.dataset.keyboardFocus}
  },[dark])

  if(kind==='listening')return <ListeningPractice vocabulary={releasedVocabulary} progress={progress} onResult={()=>{}} focusMode/>
  if(kind==='speaking')return <SpeechPractice prompt="Povej po slovensko: Danes nimam časa, ker moram popoldne delati." expected="Danes nimam časa, ker moram popoldne delati." onResult={()=>{}} focusMode/>
  if(kind==='vocab-workspace')return <VocabWorkspace vocabulary={releasedVocabulary} progress={progress} onResult={()=>{}}/>

  return <ExerciseDeck session={session} onResult={()=>{}} focusMode/>
}
