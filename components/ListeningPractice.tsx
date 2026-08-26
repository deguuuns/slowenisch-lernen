'use client'
import {useMemo,useRef,useState} from 'react'
import {CheckCircle2,Headphones,XCircle} from 'lucide-react'
import AudioButton from './AudioButton'
import LearningFocusPortal from './LearningFocusPortal'
import {LISTENING_CURRICULUM,recommendedListeningItems,type ListeningItem} from '@/lib/listening-curriculum'
import {Exercise,UserProgress,Vocabulary} from '@/types'

type ResultMeta={responseMs:number;hintsUsed:number}
type Props={vocabulary:Vocabulary[];progress:UserProgress;onResult:(exercise:Exercise,correct:boolean,meta:ResultMeta)=>void;onComplete?:()=>void;focusMode?:boolean}

export default function ListeningPractice({vocabulary,progress,onResult,onComplete,focusMode=true}:Props){
 const known=useMemo(()=>new Set(vocabulary.filter(word=>progress.wordsLearned.includes(word.id)||(progress.mastery?.[`vocab:${word.id}`]?.score??0)>=.5).flatMap(word=>[word.sl,word.lemma||'']).filter(Boolean).map(x=>x.toLocaleLowerCase('sl-SI'))),[vocabulary,progress.wordsLearned,progress.mastery])
 const listeningScore=progress.mastery?.['skill:listening']?.score??.25
 const ranked=useMemo(()=>recommendedListeningItems(known,listeningScore),[known,listeningScore])
 const [itemIndex,setItemIndex]=useState(0),[questionIndex,setQuestionIndex]=useState(0),[showText,setShowText]=useState(false),[showTranslation,setShowTranslation]=useState(false),[answerValue,setAnswerValue]=useState<string|null>(null)
 const startedAt=useRef(Date.now())
 const item:ListeningItem=ranked[itemIndex%Math.max(1,ranked.length)]||LISTENING_CURRICULUM[0]
 const question=item.prompts[Math.min(questionIndex,Math.max(0,item.prompts.length-1))]
 const correct=Boolean(question&&answerValue===question.answer)

 function answer(option:string){if(answerValue||!question)return;setAnswerValue(option);const isCorrect=option===question.answer;const exercise:Exercise={id:`listening:${item.id}:${questionIndex}`,lesson:1,type:'choice',prompt:question.question,answer:question.answer,evaluationMode:'exact',skillTargets:['listening'],targetContentKeys:item.targetKeys,learningPhase:'recognize'};onResult(exercise,isCorrect,{responseMs:Math.max(250,Date.now()-startedAt.current),hintsUsed:(showText?1:0)+(showTranslation?1:0)})}
 function advance(){if(questionIndex<item.prompts.length-1){setQuestionIndex(index=>index+1);setAnswerValue(null);setShowText(false);setShowTranslation(false);startedAt.current=Date.now();return}if(onComplete){onComplete();return}setItemIndex(index=>(index+1)%Math.max(1,ranked.length));setQuestionIndex(0);setAnswerValue(null);setShowText(false);setShowTranslation(false);startedAt.current=Date.now()}

 if(!question)return <LearningFocusPortal enabled={focusMode}><div className="exercise-shell"><div/><div className="exercise-feedback"><Headphones className="mx-auto text-lime-700" size={36}/><h2 className="mt-3 text-xl font-black">Noch keine Hörfrage verfügbar</h2></div><div>{onComplete&&<button onClick={onComplete} className="btn-primary w-full">Weiter</button>}</div></div></LearningFocusPortal>

 const body=<div className="exercise-shell">
   <div><div className="flex items-center justify-between gap-3 text-[11px] font-bold"><span className="inline-flex items-center gap-1.5 text-lime-700"><Headphones size={13}/>Hören</span><span className="text-slate-400">{questionIndex+1}/{item.prompts.length}</span></div><div className="progress-track mt-1.5"><div className="progress-fill" style={{width:`${Math.round(((questionIndex+(answerValue?1:0))/Math.max(1,item.prompts.length))*100)}%`}}/></div></div>
   {!answerValue?<div className="exercise-content">
     <div className="flex items-center justify-center gap-3 text-center"><AudioButton text={item.text} compact/><h2 className="text-lg font-black leading-tight">{item.title}</h2></div>
     {(showText||showTranslation)&&<div className="mt-2 rounded-xl bg-slate-50 p-2 text-center"><div className="text-sm font-semibold leading-snug">{showText?item.text:item.translation}</div></div>}
     <div className="mt-2 text-lg font-black leading-tight">{question.question}</div>
     <div className="exercise-choice-grid mt-2">{question.options.map(option=><button key={option} onClick={()=>answer(option)} className="exercise-choice surface-interactive w-full border border-slate-200 bg-white text-left font-bold">{option}</button>)}</div>
     <div className="mt-1.5 flex gap-1.5"><button className="btn-quiet flex-1" onClick={()=>{setShowText(value=>!value);setShowTranslation(false)}}>{showText?'Text aus':'Text'}</button><button className="btn-quiet flex-1" onClick={()=>{setShowTranslation(value=>!value);setShowText(false)}}>{showTranslation?'Deutsch aus':'Deutsch'}</button></div>
   </div>:<div className="exercise-content exercise-feedback" role="status" aria-live="polite">{correct?<CheckCircle2 className="mx-auto text-lime-700" size={38}/>:<XCircle className="mx-auto text-amber-700" size={38}/>}<div className="mt-2 text-2xl font-black">{correct?'Richtig':'Noch nicht'}</div>{!correct&&<div className="mt-3 text-base font-bold">Richtig: {question.answer}</div>}</div>}
   <div className="exercise-actions">{answerValue&&<button className="btn-primary w-full" onClick={advance}>Weiter</button>}</div>
 </div>
 return <LearningFocusPortal enabled={focusMode} label="Hörübung">{body}</LearningFocusPortal>
}
