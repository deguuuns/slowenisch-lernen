'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import LearningFocusPortal from '@/components/LearningFocusPortal'
import { evaluateAnswer, EvaluationResult } from '@/lib/answer-evaluation'
import { ExerciseSession, ExerciseSessionResult, SessionExercise, sessionSummary, validateCompletedSession } from '@/lib/exercise-session'
import { Exercise } from '@/types'

export type ExerciseResultMeta = { responseMs: number; hintsUsed: number }

export default function ExerciseDeck({ session, onResult, onComplete, focusMode = true }: {
  session: ExerciseSession
  onResult: (exercise: Exercise, correct: boolean, meta: ExerciseResultMeta) => void
  onComplete?: () => void
  focusMode?: boolean
}) {
  const [index, setIndex] = useState(0)
  const [retryIndex, setRetryIndex] = useState(0)
  const [retryQueue, setRetryQueue] = useState<SessionExercise[]>([])
  const [inRetry, setInRetry] = useState(false)
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState(false)
  const [finished, setFinished] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [results, setResults] = useState<ExerciseSessionResult[]>([])
  const resultsRef = useRef<ExerciseSessionResult[]>([])
  const startedAt = useRef(Date.now())
  const inputRef = useRef<HTMLInputElement | null>(null)

  const item = inRetry ? retryQueue[retryIndex] : session.exercises[index]
  const exercise = item?.exercise

  useEffect(() => {
    setIndex(0);setRetryIndex(0);setRetryQueue([]);setInRetry(false);setValue('');setChecked(false);setFinished(false);setShowHint(false);setShowExplanation(false);setEvaluation(null);setResults([])
    resultsRef.current=[]
    startedAt.current=Date.now()
  }, [session.sessionId])

  useEffect(() => {
    startedAt.current=Date.now();setValue('');setChecked(false);setShowHint(false);setShowExplanation(false);setEvaluation(null)
  }, [item?.id, inRetry])

  if (!session.exercises.length) {
    return <LearningFocusPortal enabled={focusMode}><div className="exercise-shell"><div/><div className="exercise-feedback"><h2 className="text-xl font-black">Keine Aufgabe offen</h2><p className="mt-2 text-sm text-slate-500">Für diese Runde ist aktuell nichts fällig.</p></div><div>{onComplete&&<button className="btn-primary w-full" onClick={onComplete}>Weiter</button>}</div></div></LearningFocusPortal>
  }

  if (!exercise) return null

  function evaluate(answer:string):EvaluationResult{
    if(exercise.type==='choice'){
      const selected=item.options.find(option=>option.text===answer)
      const correct=Boolean(selected?.correct)
      return {classification:correct?'CORRECT':'WRONG_MEANING',isCorrect:correct,normalizedInput:answer,normalizedExpected:exercise.answer,issues:[],explanation:correct?undefined:`Richtig ist: ${exercise.answer}`}
    }
    return evaluateAnswer({input:answer,expected:exercise.answer,alternatives:exercise.acceptedAnswers})
  }

  function submit(answer=value){
    if(!answer.trim()||checked)return
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
      setRetryQueue([...failed]);setRetryIndex(0);setInRetry(true);setChecked(false);setValue('');setEvaluation(null);setShowHint(false);setShowExplanation(false);startedAt.current=Date.now();return
    }
    setFinished(true)
  }

  function next(){
    if(!checked)return
    if(inRetry){if(retryIndex>=retryQueue.length-1){setInRetry(false);setFinished(true);return}setRetryIndex(current=>current+1);return}
    if(index>=session.exercises.length-1){const issues=validateCompletedSession(session,resultsRef.current);if(issues.length)setResults([...resultsRef.current]);beginRetryOrFinish();return}
    setIndex(current=>current+1)
  }

  function addWord(word:string){if(checked)return;setValue(current=>current?`${current} ${word}`:word);requestAnimationFrame(()=>inputRef.current?.focus({preventScroll:true}))}

  const correct=evaluation?.isCorrect??false
  const progressValue=inRetry?Math.round(((retryIndex+(checked?1:0))/Math.max(1,retryQueue.length))*100):Math.round(((index+(checked?1:0))/session.exercises.length)*100)
  const nextLabel=inRetry?(retryIndex===retryQueue.length-1?'Sitzung abschließen':'Nächster Fehler'):index===session.exercises.length-1?(resultsRef.current.some(result=>!result.correct)?'Fehler wiederholen':'Sitzung abschließen'):'Weiter'
  const classificationLabel=evaluation?.classification==='ACCEPTABLE_VARIANT'?'Auch richtig':evaluation?.classification==='MINOR_TYPO'?'Fast richtig':evaluation?.classification==='GRAMMAR_ERROR'?'Grammatik':evaluation?.classification==='INCOMPLETE'?'Noch unvollständig':'Noch nicht'
  const progressLabel=inRetry?`Fehler wiederholen, ${retryIndex+1} von ${retryQueue.length}`:`Aufgabe ${index+1} von ${session.exercises.length}`
  const promptLong=exercise.prompt.length>72

  if(finished){
    const issues=validateCompletedSession(session,results)
    const body=issues.length?<div className="exercise-shell"><div/><div className="exercise-feedback"><XCircle className="mx-auto text-amber-700" size={34}/><h3 className="mt-3 text-xl font-black">Runde gespeichert</h3><p className="mt-2 text-sm text-slate-500">Die Abschlussstatistik konnte nicht vollständig berechnet werden.</p></div><div>{onComplete&&<button onClick={onComplete} className="btn-primary w-full">Weiter</button>}</div></div>:(()=>{const summary=sessionSummary(session,results);return <div className="exercise-shell"><div/><div className="exercise-feedback"><CheckCircle2 className="mx-auto text-lime-700" size={36}/><h3 className="mt-3 text-2xl font-black">Runde geschafft</h3><div className="mx-auto mt-4 grid w-full max-w-sm grid-cols-2 gap-2"><div className="rounded-xl bg-slate-50 p-3"><div className="text-2xl font-black">{summary.correct}</div><div className="text-xs text-slate-500">richtig</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-2xl font-black">{summary.wrong}</div><div className="text-xs text-slate-500">Fehler</div></div></div></div><div>{onComplete&&<button onClick={onComplete} className="btn-primary w-full">Weiter</button>}</div></div>})()
    return <LearningFocusPortal enabled={focusMode}>{body}</LearningFocusPortal>
  }

  const body=<div className="exercise-shell">
    <div aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-[11px] font-bold"><span className={inRetry?'text-amber-700':'text-slate-500'}>{inRetry?<span className="inline-flex items-center gap-1"><RotateCcw size={12}/>Fehler {retryIndex+1}/{retryQueue.length}</span>:`${index+1} / ${session.exercises.length}`}</span><span className="text-slate-400">{progressValue}%</span></div>
      <div className="progress-track mt-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressValue} aria-label={progressLabel}><div className="progress-fill" style={{width:`${progressValue}%`}}/></div>
    </div>

    {!checked?<div className="exercise-content">
      <h2 className={`exercise-prompt ${promptLong?'exercise-prompt-long':''}`}>{exercise.prompt}</h2>
      {exercise.hint&&<button type="button" onClick={()=>setShowHint(true)} className="btn-quiet mt-1 self-start -ml-2">Hinweis</button>}

      {exercise.type==='choice'?<div className="exercise-choice-grid mt-3">{item.options.map((option,optionIndex)=><button key={option.id} disabled={checked} onClick={()=>submit(option.text)} className="exercise-choice surface-interactive w-full whitespace-normal break-words border border-slate-200 bg-white text-left font-bold [overflow-wrap:anywhere]"><span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-[10px] text-slate-500">{String.fromCharCode(65+optionIndex)}</span>{option.text}</button>)}</div>:<div className="mt-3 min-h-0">
        {exercise.wordBank?.length?<div className="exercise-wordbank mb-2" aria-label="Wortbausteine">{exercise.wordBank.map((word,wordIndex)=><button key={`${word}:${wordIndex}`} type="button" onClick={()=>addWord(word)} className="surface-interactive border border-slate-200 bg-white font-bold">{word}</button>)}</div>:null}
        <input ref={inputRef} value={value} onFocus={()=>document.documentElement.dataset.keyboardFocus='true'} onBlur={()=>delete document.documentElement.dataset.keyboardFocus} onChange={event=>setValue(event.target.value)} onKeyDown={event=>{if(event.key==='Enter')submit()}} className="exercise-input w-full border border-slate-200 bg-white text-base outline-none transition focus:border-lime-500 focus:ring-2 focus:ring-lime-100" placeholder={exercise.wordBank?.length?'Satz zusammensetzen …':'Deine Antwort …'} aria-label="Deine Antwort" autoComplete="off"/>
        <div className="mt-1.5 flex items-center gap-1.5">{['č','š','ž'].map(character=><button key={character} type="button" onClick={()=>{setValue(current=>current+character);requestAnimationFrame(()=>inputRef.current?.focus({preventScroll:true}))}} className="grid h-9 min-w-9 place-items-center rounded-lg border border-slate-200 bg-white text-sm font-black">{character.toUpperCase()}</button>)}{exercise.wordBank?.length&&value?<button type="button" onClick={()=>{setValue('');inputRef.current?.focus({preventScroll:true})}} className="btn-quiet ml-auto">Zurücksetzen</button>:null}</div>
      </div>}
    </div>:<div className="exercise-content exercise-feedback" role="status" aria-live="polite">
      {correct?<CheckCircle2 className="mx-auto text-lime-700" size={36}/>:<XCircle className="mx-auto text-amber-700" size={36}/>}<div className="mt-2 text-2xl font-black">{correct?(evaluation?.classification==='ACCEPTABLE_VARIANT'?'Auch richtig':'Richtig'):classificationLabel}</div>
      {!correct&&<div className="exercise-feedback-answer mt-3 text-base font-bold leading-snug">{evaluation?.explanation??`Richtig wäre: ${exercise.answer}`}</div>}
      {!correct&&exercise.explanation&&<button type="button" onClick={()=>setShowExplanation(true)} className="btn-quiet mx-auto mt-2">Warum?</button>}
    </div>}

    <div className="exercise-actions">
      {!checked&&exercise.type!=='choice'&&<button onClick={()=>submit()} disabled={!value.trim()} className="btn-primary w-full">Prüfen</button>}
      {checked&&<button onClick={next} className="btn-primary w-full">{nextLabel}</button>}
    </div>

    {showHint&&<div className="exercise-overlay" role="dialog" aria-label="Hinweis"><div className="text-xs font-black uppercase tracking-wider text-lime-700">Hinweis</div><div className="mt-3 text-lg font-bold leading-snug">{exercise.hint}</div><button className="btn-primary mt-5 w-full" onClick={()=>setShowHint(false)}>Zur Aufgabe</button></div>}
    {showExplanation&&<div className="exercise-overlay" role="dialog" aria-label="Erklärung"><div className="text-xs font-black uppercase tracking-wider text-lime-700">Erklärung</div><div className="mt-3 text-sm leading-6 text-slate-600">{exercise.explanation}</div><button className="btn-primary mt-5 w-full" onClick={()=>setShowExplanation(false)}>Verstanden</button></div>}
  </div>

  return <LearningFocusPortal enabled={focusMode}>{body}</LearningFocusPortal>
}
