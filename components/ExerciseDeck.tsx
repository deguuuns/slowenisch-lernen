'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { evaluateAnswer, EvaluationResult } from '@/lib/answer-evaluation'
import { ExerciseSession, ExerciseSessionResult, SessionExercise, sessionSummary, validateCompletedSession } from '@/lib/exercise-session'
import { Exercise } from '@/types'

export type ExerciseResultMeta = { responseMs: number; hintsUsed: number }

export default function ExerciseDeck({ session, onResult, onComplete }: {
  session: ExerciseSession
  onResult: (exercise: Exercise, correct: boolean, meta: ExerciseResultMeta) => void
  onComplete?: () => void
}) {
  const [index, setIndex] = useState(0)
  const [retryIndex, setRetryIndex] = useState(0)
  const [retryQueue, setRetryQueue] = useState<SessionExercise[]>([])
  const [inRetry, setInRetry] = useState(false)
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState(false)
  const [finished, setFinished] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [results, setResults] = useState<ExerciseSessionResult[]>([])
  const resultsRef = useRef<ExerciseSessionResult[]>([])
  const startedAt = useRef(Date.now())
  const inputRef = useRef<HTMLInputElement | null>(null)

  const item = inRetry ? retryQueue[retryIndex] : session.exercises[index]
  const exercise = item?.exercise

  useEffect(() => {
    setIndex(0);setRetryIndex(0);setRetryQueue([]);setInRetry(false);setValue('');setChecked(false);setFinished(false);setShowHint(false);setEvaluation(null);setResults([])
    resultsRef.current=[]
    startedAt.current=Date.now()
  }, [session.sessionId])

  useEffect(() => {
    startedAt.current=Date.now();setValue('');setChecked(false);setShowHint(false);setEvaluation(null)
  }, [item?.id, inRetry])

  if (!session.exercises.length) return <div className="surface p-5 text-center text-sm text-slate-500">Für diese Sitzung sind noch keine Übungen vorhanden.</div>

  if (finished) {
    const issues=validateCompletedSession(session,results)
    if(issues.length)return <div className="surface border-red-200 bg-red-50 p-5"><h3 className="text-lg font-black">Sitzung nicht vollständig ausgewertet</h3><p className="mt-1 text-sm leading-6 text-slate-600">Deine beantworteten Aufgaben wurden gespeichert. Die Abschlussstatistik wird wegen einer inkonsistenten Zählung nicht angezeigt.</p></div>
    const summary=sessionSummary(session,results)
    const average=Math.round(results.reduce((sum,result)=>sum+result.responseMs,0)/results.length/1000)
    return <div className="surface p-5 text-center sm:p-6" aria-live="polite"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-lime-100 text-lime-800"><CheckCircle2 size={25}/></div><h3 className="mt-4 text-2xl font-black">Runde geschafft</h3><div className="mx-auto mt-4 grid max-w-md grid-cols-3 divide-x divide-slate-200 rounded-2xl bg-slate-50 py-3"><Summary value={summary.correct} label="richtig"/><Summary value={summary.wrong} label="Fehler"/><Summary value={`${average}s`} label="Ø Zeit"/></div>{onComplete&&<button onClick={onComplete} className="btn-primary mt-5 w-full sm:w-auto sm:min-w-48">Weiter</button>}</div>
  }

  function evaluate(answer:string):EvaluationResult{
    if(exercise.type==='choice'){
      const selected=item.options.find(option=>option.text===answer)
      const correct=Boolean(selected?.correct)
      return {classification:correct?'CORRECT':'WRONG_MEANING',isCorrect:correct,normalizedInput:answer,normalizedExpected:exercise.answer,issues:[],explanation:correct?undefined:`Richtig ist: ${exercise.answer}`}
    }
    return evaluateAnswer({input:answer,expected:exercise.answer,alternatives:exercise.acceptedAnswers})
  }

  function submit(answer=value){
    if(!exercise||!answer.trim()||checked)return
    const result=evaluate(answer)
    const responseMs=Math.max(250,Date.now()-startedAt.current)
    const hintsUsed=showHint?1:0
    if(!inRetry){
      const nextResult:ExerciseSessionResult={sessionExerciseId:item.id,sourceExerciseId:item.sourceExerciseId,correct:result.isCorrect,responseMs,vocabularyIds:exercise.vocabularyIds||[],grammarRuleIds:exercise.grammarRuleIds||[]}
      const previous=resultsRef.current
      if(previous.some(row=>row.sessionExerciseId===item.id))return
      const nextResults=[...previous,nextResult]
      if(nextResults.length>session.exercises.length)throw new Error(`Session ${session.sessionId} received too many results`)
      resultsRef.current=nextResults;setResults(nextResults)
    }
    setValue(answer);setEvaluation(result);setChecked(true);onResult(exercise,result.isCorrect,{responseMs,hintsUsed})
  }

  function beginRetryOrFinish(){
    const failedIds=new Set(resultsRef.current.filter(result=>!result.correct).map(result=>result.sessionExerciseId))
    const failed=session.exercises.filter(candidate=>failedIds.has(candidate.id))
    if(failed.length&&session.kind!=='error-review'){
      setRetryQueue([...failed]);setRetryIndex(0);setInRetry(true);setChecked(false);setValue('');setEvaluation(null);setShowHint(false);startedAt.current=Date.now();return
    }
    setFinished(true)
  }

  function next(){
    if(!checked)return
    if(inRetry){if(retryIndex>=retryQueue.length-1){setInRetry(false);setFinished(true);return}setRetryIndex(current=>current+1);return}
    if(index>=session.exercises.length-1){const issues=validateCompletedSession(session,resultsRef.current);if(issues.length)setResults([...resultsRef.current]);beginRetryOrFinish();return}
    setIndex(current=>current+1)
    window.scrollTo({top:0,behavior:'smooth'})
  }

  function addWord(word:string){if(checked)return;setValue(current=>current?`${current} ${word}`:word);requestAnimationFrame(()=>inputRef.current?.focus({preventScroll:true}))}

  const correct=evaluation?.isCorrect??false
  const progressValue=inRetry?Math.round(((retryIndex+(checked?1:0))/Math.max(1,retryQueue.length))*100):Math.round(((index+(checked?1:0))/session.exercises.length)*100)
  const nextLabel=inRetry?(retryIndex===retryQueue.length-1?'Sitzung abschließen':'Nächster Fehler'):index===session.exercises.length-1?(resultsRef.current.some(result=>!result.correct)?'Fehler wiederholen':'Sitzung abschließen'):'Weiter'
  const classificationLabel=evaluation?.classification==='ACCEPTABLE_VARIANT'?'Auch richtig':evaluation?.classification==='MINOR_TYPO'?'Fast richtig':evaluation?.classification==='GRAMMAR_ERROR'?'Grammatik':evaluation?.classification==='INCOMPLETE'?'Noch unvollständig':'Noch nicht'
  const progressLabel=inRetry?`Fehler wiederholen, ${retryIndex+1} von ${retryQueue.length}`:`Aufgabe ${index+1} von ${session.exercises.length}`

  return <div className="exercise-shell">
    <div aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs font-bold"><span className={inRetry?'text-amber-700':'text-slate-500'}>{inRetry?<span className="inline-flex items-center gap-1.5"><RotateCcw size={14}/>Fehler {retryIndex+1} von {retryQueue.length}</span>:`Aufgabe ${index+1} von ${session.exercises.length}`}</span><span className="text-slate-400">{progressValue}%</span></div>
      <div className="progress-track mt-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressValue} aria-label={progressLabel}><div className="progress-fill" style={{width:`${progressValue}%`}}/></div>
    </div>

    <div className="exercise-content">
      <h2 className="break-words text-2xl font-black leading-tight tracking-tight sm:text-3xl [overflow-wrap:anywhere]">{exercise.prompt}</h2>
      {exercise.hint&&!checked&&<button type="button" onClick={()=>setShowHint(true)} className="btn-quiet mt-2 -ml-3 justify-start">{showHint?`Hinweis: ${exercise.hint}`:'Hinweis anzeigen'}</button>}

      {exercise.type==='choice'?<div className="mt-5 grid gap-2.5">{item.options.map((option,optionIndex)=><button key={option.id} disabled={checked} onClick={()=>submit(option.text)} className={`surface-interactive min-h-14 w-full whitespace-normal break-words rounded-2xl border px-4 py-3.5 text-left font-bold [overflow-wrap:anywhere] ${checked&&option.correct?'border-lime-500 bg-lime-50':checked&&value===option.text?'border-amber-400 bg-amber-50':'border-slate-200 bg-white'}`}><span className="mr-3 inline-grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-xs text-slate-500">{String.fromCharCode(65+optionIndex)}</span>{option.text}</button>)}</div>:<div className="mt-5">
        {exercise.wordBank?.length?<div className="mb-3 flex flex-wrap gap-2" aria-label="Wortbausteine">{exercise.wordBank.map((word,wordIndex)=><button key={`${word}:${wordIndex}`} type="button" disabled={checked} onClick={()=>addWord(word)} className="surface-interactive min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold">{word}</button>)}</div>:null}
        <input ref={inputRef} value={value} disabled={checked} onChange={event=>setValue(event.target.value)} onKeyDown={event=>{if(event.key==='Enter')submit()}} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base outline-none transition focus:border-lime-500 focus:ring-2 focus:ring-lime-100" placeholder={exercise.wordBank?.length?'Satz zusammensetzen …':'Deine Antwort …'} aria-label="Deine Antwort" autoComplete="off"/>
        <div className="mt-2 flex flex-wrap items-center gap-2">{['č','š','ž'].map(character=><button key={character} type="button" disabled={checked} onClick={()=>{setValue(current=>current+character);requestAnimationFrame(()=>inputRef.current?.focus({preventScroll:true}))}} className="tap-target rounded-xl border border-slate-200 bg-white px-4 py-2 font-black">{character.toUpperCase()}</button>)}{exercise.wordBank?.length&&value&&!checked?<button type="button" onClick={()=>{setValue('');inputRef.current?.focus({preventScroll:true})}} className="btn-quiet">Zurücksetzen</button>:null}</div>
      </div>}
    </div>

    <div className="exercise-actions">
      {!checked&&exercise.type!=='choice'&&<button onClick={()=>submit()} disabled={!value.trim()} className="btn-primary w-full">Prüfen</button>}
      {checked&&<div className={`rounded-2xl p-4 ${correct?'bg-lime-50':'bg-amber-50'}`} role="status" aria-live="polite"><div className="flex items-start gap-3">{correct?<CheckCircle2 className="mt-0.5 shrink-0 text-lime-700" size={22}/>:<XCircle className="mt-0.5 shrink-0 text-amber-700" size={22}/>}<div className="min-w-0 flex-1"><div className="font-black">{correct?(evaluation?.classification==='ACCEPTABLE_VARIANT'?'Auch richtig':'Richtig'):classificationLabel}</div>{!correct&&<div className="mt-1 break-words text-sm leading-6 [overflow-wrap:anywhere]">{evaluation?.explanation??`Richtig wäre: ${exercise.answer}`}</div>}{!correct&&exercise.explanation&&evaluation?.classification!=='GRAMMAR_ERROR'&&<details className="mt-2 text-sm"><summary className="cursor-pointer font-bold">Erklärung anzeigen</summary><div className="mt-1 leading-6 text-slate-600">{exercise.explanation}</div></details>}</div></div><button onClick={next} className="btn-primary mt-4 w-full">{nextLabel}</button></div>}
    </div>
  </div>
}

function Summary({value,label}:{value:string|number;label:string}){return <div className="px-2"><div className="text-xl font-black">{value}</div><div className="text-[11px] text-slate-500">{label}</div></div>}
