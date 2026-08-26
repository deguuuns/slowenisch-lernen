'use client'

import { useRef, useState } from 'react'
import { Keyboard, Mic, MicOff } from 'lucide-react'
import AudioButton from './AudioButton'
import { evaluateAnswer, EvaluationResult } from '@/lib/answer-evaluation'
import { buildSpeechFeedback, SpeechFeedback } from '@/lib/speech-feedback'

type RecognitionAlternative={transcript:string;confidence?:number}
type RecognitionResultEvent={results:{[index:number]:{[index:number]:RecognitionAlternative}}}
type RecognitionInstance={lang:string;interimResults:boolean;continuous:boolean;start:()=>void;stop:()=>void;onresult:(event:RecognitionResultEvent)=>void;onend:()=>void;onerror:()=>void}
declare global{interface Window{webkitSpeechRecognition?:new()=>RecognitionInstance}}

export type SpeechResultMeta={responseMs:number;replays:number;usedSlowAudio:boolean;inputMode:'speech'|'text'}

export default function SpeechPractice({prompt,expected,onResult,onComplete}:{prompt:string;expected:string;onResult?:(correct:boolean,actual:string,meta:SpeechResultMeta)=>void;onComplete?:()=>void}){
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

  const correct=checked&&(evaluation?.isCorrect??false)
  return <div className="surface p-4 sm:p-5">
    <div className="eyebrow">Sprechen</div>
    <div className="mt-3 flex items-start justify-between gap-3"><h2 className="max-w-2xl break-words text-2xl font-black leading-tight sm:text-3xl [overflow-wrap:anywhere]">{prompt}</h2><AudioButton text={prompt} compact onPlay={slow=>{setReplays(value=>value+1);if(slow)setUsedSlow(true)}}/></div>

    <div className="mt-6 text-center">
      {supported?<><button type="button" onClick={()=>listening?recognition.current?.stop():start()} className={`mx-auto grid h-20 w-20 place-items-center rounded-full transition active:scale-95 ${listening?'bg-red-100 text-red-700 ring-8 ring-red-50':'bg-lime-300 text-slate-950 ring-8 ring-lime-50'}`} aria-label={listening?'Aufnahme stoppen':'Aufnahme starten'}>{listening?<MicOff size={32}/>:<Mic size={32}/>}</button><div className="mt-3 text-sm font-bold">{listening?'Ich höre zu …':answer&&inputMode==='speech'?'Noch einmal sprechen':'Tippe und sprich'}</div><div className="mt-1 text-xs text-slate-500">Slowenisch · Mikrofon</div></>:<div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Spracherkennung ist in diesem Browser nicht verfügbar. Du kannst die Antwort weiterhin tippen.</div>}
    </div>

    {answer&&inputMode==='speech'&&<div className="mt-5 rounded-2xl bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-wide text-slate-400">Erkannt</div><div className="mt-1 break-words text-lg font-bold">{answer}</div></div>}

    <button type="button" onClick={()=>{setShowTyping(value=>!value);if(!showTyping)setInputMode('text')}} className="btn-secondary mt-5 w-full"><Keyboard size={17}/>{showTyping?'Tippen ausblenden':'Stattdessen tippen'}</button>
    {(showTyping||!supported)&&<div className="mt-3"><input value={answer} onChange={event=>{setAnswer(event.target.value);setInputMode('text');setRecognitionConfidence(undefined);resetFeedback()}} onKeyDown={event=>{if(event.key==='Enter')check()}} placeholder="Antwort auf Slowenisch …" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"/></div>}

    <button onClick={check} disabled={!answer.trim()} className="btn-primary mt-4 w-full">Prüfen</button>

    {checked&&<div className={`mt-4 rounded-2xl p-4 ${correct?'bg-lime-50':'bg-amber-50'}`} role="status" aria-live="polite">
      {inputMode==='speech'&&speechFeedback?<><div className="font-black">{speechFeedback.title}</div><div className="mt-1 text-sm leading-6">{speechFeedback.detail}</div><div className="mt-3 flex flex-wrap gap-2 text-xs font-bold"><span className="pill">Inhalt: {speechFeedback.contentCorrect?'richtig':'korrigieren'}</span><span className="pill">Erkennung: {speechFeedback.deliveryBand==='strong'?'klar':speechFeedback.deliveryBand==='developing'?'teilweise klar':'unsicher'}</span></div></>:correct?<><div className="font-black">Richtig</div><div className="mt-1 text-sm text-slate-600">Die getippte Form stimmt. Für Aussprachefeedback nutze das Mikrofon.</div></>:<><div className="font-black">{evaluation?.classification==='GRAMMAR_ERROR'?'Grammatik noch unsicher':'Noch nicht'}</div><div className="mt-1 text-sm leading-6">{evaluation?.explanation||`Richtig wäre: ${expected}`}</div></>}
      {correct&&onComplete&&<button type="button" onClick={onComplete} className="btn-primary mt-4 w-full">Weiter</button>}
    </div>}
  </div>
}
