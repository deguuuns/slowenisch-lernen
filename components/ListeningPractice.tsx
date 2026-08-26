'use client'
import {useMemo,useRef,useState} from 'react'
import {Headphones} from 'lucide-react'
import AudioButton from './AudioButton'
import {LISTENING_CURRICULUM,recommendedListeningItems,type ListeningItem} from '@/lib/listening-curriculum'
import {Exercise,UserProgress,Vocabulary} from '@/types'

type ResultMeta={responseMs:number;hintsUsed:number}
type Props={vocabulary:Vocabulary[];progress:UserProgress;onResult:(exercise:Exercise,correct:boolean,meta:ResultMeta)=>void;onComplete?:()=>void}

export default function ListeningPractice({vocabulary,progress,onResult,onComplete}:Props){
 const known=useMemo(()=>new Set(vocabulary.filter(word=>progress.wordsLearned.includes(word.id)||(progress.mastery?.[`vocab:${word.id}`]?.score??0)>=.5).flatMap(word=>[word.sl,word.lemma||'']).filter(Boolean).map(x=>x.toLocaleLowerCase('sl-SI'))),[vocabulary,progress.wordsLearned,progress.mastery])
 const listeningScore=progress.mastery?.['skill:listening']?.score??.25
 const ranked=useMemo(()=>recommendedListeningItems(known,listeningScore),[known,listeningScore])
 const [index,setIndex]=useState(0),[showText,setShowText]=useState(false),[showTranslation,setShowTranslation]=useState(false),[answers,setAnswers]=useState<Record<number,string>>({})
 const startedAt=useRef(Date.now())
 const item:ListeningItem=ranked[index%Math.max(1,ranked.length)]||LISTENING_CURRICULUM[0]
 const answeredAll=item.prompts.length>0&&item.prompts.every((_,qi)=>Boolean(answers[qi]))
 function answer(qi:number,option:string){if(answers[qi])return;const q=item.prompts[qi],correct=option===q.answer;setAnswers(a=>({...a,[qi]:option}));const exercise:Exercise={id:`listening:${item.id}:${qi}`,lesson:1,type:'choice',prompt:q.question,answer:q.answer,evaluationMode:'exact',skillTargets:['listening'],targetContentKeys:item.targetKeys};onResult(exercise,correct,{responseMs:Math.max(250,Date.now()-startedAt.current),hintsUsed:(showText?1:0)+(showTranslation?1:0)})}
 function next(){setIndex(i=>(i+1)%Math.max(1,ranked.length));setAnswers({});setShowText(false);setShowTranslation(false);startedAt.current=Date.now();window.scrollTo({top:0,behavior:'smooth'})}
 return <div className="surface p-4 sm:p-5">
   <div className="flex items-center gap-2 text-lime-700"><Headphones size={18}/><span className="eyebrow">Hören</span></div>
   <h2 className="mt-2 text-2xl font-black tracking-tight">{item.title}</h2>
   <p className="mt-1 text-sm text-slate-500">Hör zuerst nur zu. Text und Übersetzung sind optionale Hilfen.</p>
   <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-center"><AudioButton text={item.text}/><div className="mt-2 text-xs font-bold text-slate-400">{item.recommendedSpeed==='verySlow'?'Sehr langsam':item.recommendedSpeed==='slow'?'Langsam':item.recommendedSpeed==='normal'?'Normal':'Muttersprachlich'}</div></div>
   <div className="mt-3 flex gap-2"><button className="btn-secondary flex-1 text-sm" onClick={()=>setShowText(v=>!v)}>{showText?'Text ausblenden':'Text anzeigen'}</button><button className="btn-secondary flex-1 text-sm" onClick={()=>setShowTranslation(v=>!v)}>{showTranslation?'Übersetzung aus':'Übersetzung'}</button></div>
   {showText&&<p className="mt-3 rounded-2xl bg-slate-50 p-4 text-lg font-semibold leading-8">{item.text}</p>}
   {showTranslation&&<p className="mt-3 text-sm leading-6 text-slate-500">{item.translation}</p>}
   <div className="mt-5 space-y-5">{item.prompts.map((q,qi)=><div key={q.question}><div className="font-black">{q.question}</div><div className="mt-2 grid gap-2">{q.options.map(o=>{const picked=answers[qi]===o,correct=picked&&o===q.answer,wrong=picked&&o!==q.answer;return <button key={o} disabled={Boolean(answers[qi])} onClick={()=>answer(qi,o)} className={`min-h-12 rounded-2xl border px-4 py-3 text-left font-bold ${correct?'border-lime-500 bg-lime-50':wrong?'border-amber-400 bg-amber-50':'border-slate-200 bg-white'}`}>{o}</button>})}</div>{answers[qi]&&<div className={`mt-2 text-sm font-bold ${answers[qi]===q.answer?'text-lime-700':'text-amber-700'}`}>{answers[qi]===q.answer?'Richtig':`Richtig wäre: ${q.answer}`}</div>}</div>)}</div>
   <button className="btn-primary mt-5 w-full" disabled={Boolean(onComplete)&&!answeredAll} onClick={()=>onComplete&&answeredAll?onComplete():next()}>{onComplete?'Weiter':'Nächste Hörübung'}</button>
 </div>
}
