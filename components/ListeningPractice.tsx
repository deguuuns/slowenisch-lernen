'use client'
import {useMemo,useRef,useState} from 'react'
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
 function next(){setIndex(i=>(i+1)%Math.max(1,ranked.length));setAnswers({});setShowText(false);setShowTranslation(false);startedAt.current=Date.now()}
 return <div className="card min-w-0"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="text-xs font-bold uppercase tracking-wide text-lime-700">Hörtraining · {item.stage}</div><h3 className="text-xl font-black">{item.title}</h3><div className="mt-1 text-sm text-slate-500">Empfohlenes Tempo: {item.recommendedSpeed==='verySlow'?'sehr langsam':item.recommendedSpeed==='slow'?'langsam':item.recommendedSpeed==='normal'?'normal':'muttersprachlich'} · adaptiv nach Hör-Lernstand</div></div></div>
 <div className="mt-4"><AudioButton text={item.text}/></div>
 <div className="mt-4 rounded-2xl bg-lime-50 p-4 text-sm text-lime-900 dark:bg-lime-950 dark:text-lime-100"><b>Zuerst nur hören.</b> Text und Übersetzung sind Hilfen und werden beim Ergebnis als Hinweis berücksichtigt.</div>
 <div className="mt-3 flex flex-wrap gap-2"><button className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold dark:bg-slate-800" onClick={()=>setShowText(v=>!v)}>{showText?'Text ausblenden':'Text anzeigen'}</button><button className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold dark:bg-slate-800" onClick={()=>setShowTranslation(v=>!v)}>{showTranslation?'Übersetzung aus':'Übersetzung anzeigen'}</button></div>
 {showText&&<p className="mt-4 rounded-2xl bg-slate-50 p-4 text-lg leading-8 dark:bg-slate-950">{item.text}</p>}{showTranslation&&<p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.translation}</p>}
 <div className="mt-5 space-y-4">{item.prompts.map((q,qi)=><div key={q.question}><div className="font-bold">{q.question}</div><div className="mt-2 flex flex-wrap gap-2">{q.options.map(o=>{const picked=answers[qi]===o,correct=picked&&o===q.answer,wrong=picked&&o!==q.answer;return <button key={o} disabled={Boolean(answers[qi])} onClick={()=>answer(qi,o)} className={`rounded-xl border px-3 py-2 text-sm font-semibold disabled:cursor-default ${correct?'border-lime-500 bg-lime-100 dark:bg-lime-950':wrong?'border-rose-300 bg-rose-50 dark:bg-rose-950':'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>{o}</button>})}</div>{answers[qi]&&<div className={`mt-1 text-sm font-semibold ${answers[qi]===q.answer?'text-lime-700 dark:text-lime-300':'text-rose-700 dark:text-rose-300'}`}>{answers[qi]===q.answer?'Richtig.':'Richtig wäre: '+q.answer}</div>}</div>)}</div>
 <div className="mt-5 flex justify-end"><button className="btn-primary" disabled={Boolean(onComplete)&&!answeredAll} onClick={()=>onComplete&&answeredAll?onComplete():next()}>{onComplete?'Hörblock abschließen':'Nächste Hörübung'}</button></div></div>
}
