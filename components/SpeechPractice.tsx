'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, Keyboard, Mic, MicOff, XCircle } from 'lucide-react'
import AudioButton from './AudioButton'
import LearningFocusPortal from './LearningFocusPortal'
import { evaluateAnswer, EvaluationResult } from '@/lib/answer-evaluation'
import { buildSpeechFeedback, SpeechFeedback } from '@/lib/speech-feedback'

type RecognitionAlternative={transcript:string;confidence?:number}
type RecognitionResultEvent={results:{[index:number]:{[index:number]:RecognitionAlternative}}}
type RecognitionInstance={lang:string;interimResults:boolean;continuous:boolean;start:()=>void;stop:()=>void;onresult:(event:RecognitionResultEvent)=>void;onend:()=>void;onerror:()=>void}
declare global{interface Window{webkitSpeechRecognition?:new()=>RecognitionInstance}}

export type SpeechResultMeta={responseMs:number;replays:number;usedSlowAudio:boolean;inputMode:'speech'|'text'}

export default function SpeechPractice({prompt,expected,onResult,onComplete,focusMode=true}:{prompt:string;expected:string;onResult?:(correct:boolean,actual:string,meta:SpeechResultMeta)=>void;onComplete?:()=>void;focusMode?:boolean}){
  const [listening,setListening]=useState(false)
  const [answer,setAnswer]=useState('')
  const [checked,setChecked]=useState(false)
  const [evaluation,setEvaluation]=useState<EvaluationResult|null>(null)
  const [speechFeedback,setSpeechFeedback]=useState<SpeechFeedback|null>(null)
  const [recognitionConfidence,setRecognitionConfidence]=useState<number|undefined>()
  const [replays,setReplays]=useState(0)
  const [usedSlow,setUsedSlow]=useState(false)
  const [inputMode,setInputMode]=useState<'speech'|'text'>('speech')
  const [showTyping,setShowTyping]=useState(false)
  const recognition=useRef<RecognitionInstance|null>(null)
  const startedAt=useRef(Date.now())
  const supported=typeof window!=='undefined'&&Boolean(window.webkitSpeechRecognition)

  function resetFeedback(){setChecked(false);setEvaluation(null);setSpeechFeedback(null)}
  function start(){
    if(!supported||!window.webkitSpeechRecognition)return
    const instance=new window.webkitSpeechRecognition();recognition.current=instance;instance.lang='sl-SI';instance.interimResults=false;instance.continuous=false
    instance.onresult=event=>{const alternative=event.results[0][0];setAnswer(alternative.transcript);setRecognitionConfidence(alternative.confidence);setInputMode('speech');resetFeedback()}
    instance.onend=()=>setListening(false);instance.onerror=()=>setListening(false);setListening(true);setInputMode('speech');startedAt.current=Date.now();instance.start()
  }
  function check(){if(!answer.trim())return;const result=evaluateAnswer({input:answer,expected});setEvaluation(result);setChecked(true);setSpeechFeedback(inputMode==='speech'?buildSpeechFeedback({actual:answer,expected,evaluation:result,recognitionConfidence}):null);onResult?.(result.isCorrect,answer,{responseMs:Math.max(250,Date.now()-startedAt.current),replays,usedSlowAudio:usedSlow,inputMode})}
  function retry(){setChecked(false);setAnswer('');setEvaluation(null);setSpeechFeedback(null);setRecognitionConfidence(undefined);startedAt.current=Date.now()}

  const correct=checked&&(evaluation?.isCorrect??false)
  const body=<div className="exercise-shell">
    <div className="flex items-center justify-between gap-3 text-[11px] font-bold"><span className="text-lime-700">Sprechen</span><AudioButton text={prompt} compact onPlay={slow=>{setReplays(value=>value+1);if(slow)setUsedSlow(true)}}/></div>
    {!checked?<div className="exercise-content">
      <h2 className={`exercise-prompt text-center ${prompt.length>72?'exercise-prompt-long':''}`}>{prompt}</h2>
      {!showTyping&&supported?<div className="mt-5 text-center"><button type="button" onClick={()=>listening?recognition.current?.stop():start()} className={`mx-auto grid h-20 w-20 place-items-center rounded-full transition active:scale-95 ${listening?'bg-red-100 text-red-700 ring-8 ring-red-50':'bg-lime-300 text-slate-950 ring-8 ring-lime-50'}`} aria-label={listening?'Aufnahme stoppen':'Aufnahme starten'}>{listening?<MicOff size={32}/>:<Mic size={32}/>}</button><div className="mt-3 text-sm font-bold">{listening?'Ich höre zu …':answer?'Noch einmal sprechen':'Tippe und sprich'}</div>{answer&&<div className="mx-auto mt-2 max-w-sm truncate rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold">{answer}</div>}</div>:<div className="mt-4"><input value={answer} onFocus={()=>document.documentElement.dataset.keyboardFocus='true'} onBlur={()=>delete document.documentElement.dataset.keyboardFocus} onChange={event=>{setAnswer(event.target.value);setInputMode('text');setRecognitionConfidence(undefined);resetFeedback()}} onKeyDown={event=>{if(event.key==='Enter')check()}} placeholder="Antwort auf Slowenisch …" className="exercise-input w-full border border-slate-200 bg-white outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"/></div>}
      <button type="button" onClick={()=>{setShowTyping(value=>!value);setInputMode(showTyping?'speech':'text')}} className="btn-quiet mx-auto mt-3"><Keyboard size={16}/>{showTyping?'Mit Mikrofon':'Stattdessen tippen'}</button>
    </div>:<div className="exercise-content exercise-feedback" role="status" aria-live="polite">{correct?<CheckCircle2 className="mx-auto text-lime-700" size={38}/>:<XCircle className="mx-auto text-amber-700" size={38}/>}<div className="mt-2 text-2xl font-black">{correct?(speechFeedback?.title||'Richtig'):(evaluation?.classification==='GRAMMAR_ERROR'?'Grammatik':'Noch nicht')}</div><div className="mx-auto mt-3 max-w-md text-sm font-semibold leading-snug">{inputMode==='speech'&&speechFeedback?speechFeedback.detail:correct?'Die Form stimmt.':evaluation?.explanation||`Richtig wäre: ${expected}`}</div>{!correct&&<div className="mt-2 text-sm text-slate-500">Richtig: <b>{expected}</b></div>}</div>}
    <div className="exercise-actions">{!checked&&<button onClick={check} disabled={!answer.trim()} className="btn-primary w-full">Prüfen</button>}{checked&&(correct&&onComplete?<button type="button" onClick={onComplete} className="btn-primary w-full">Weiter</button>:<button type="button" onClick={retry} className="btn-primary w-full">Noch einmal</button>)}</div>
  </div>
  return <LearningFocusPortal enabled={focusMode} label="Sprechübung">{body}</LearningFocusPortal>
}
