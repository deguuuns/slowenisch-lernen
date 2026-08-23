'use client'
import { useMemo,useRef,useState } from 'react'
import AudioButton from './AudioButton'
import { INPUT_STORIES } from '@/lib/input-content'
import { Exercise,UserProgress,Vocabulary } from '@/types'

type ResultMeta={responseMs:number;hintsUsed:number}
type Props={vocabulary:Vocabulary[];progress:UserProgress;onResult:(exercise:Exercise,correct:boolean,meta:ResultMeta)=>void}

export default function InputPractice({vocabulary,progress,onResult}:Props){
 const knownWords=useMemo(()=>vocabulary.filter(word=>progress.wordsLearned.includes(word.id)||(progress.mastery?.[`vocab:${word.id}`]?.score??0)>=.5).flatMap(word=>[word.sl,word.lemma||'']).filter(Boolean),[vocabulary,progress.wordsLearned,progress.mastery])
 const known=useMemo(()=>new Set(knownWords.map(x=>x.toLowerCase())),[knownWords])
 const ranked=useMemo(()=>INPUT_STORIES.map(story=>({story,ratio:story.requiredWords.length?story.requiredWords.filter(w=>known.has(w.toLowerCase())).length/story.requiredWords.length:1})).sort((a,b)=>b.ratio-a.ratio),[known])
 const [index,setIndex]=useState(0); const [showText,setShowText]=useState(true); const [showTranslation,setShowTranslation]=useState(false); const [answers,setAnswers]=useState<Record<number,string>>({}); const startedAt=useRef(Date.now())
 const current=ranked[index%ranked.length]||{story:INPUT_STORIES[0],ratio:0}; const s=current.story;
 function answer(qi:number,option:string){if(answers[qi])return;const q=s.questions[qi];const correct=option===q.answer;setAnswers(a=>({...a,[qi]:option}));const exercise:Exercise={id:`input:${s.id}:${qi}`,lesson:1,type:'choice',prompt:q.prompt,answer:q.answer,options:q.options,evaluationMode:'exact',skillTargets:showText?['recognition']:['listening'],targetContentKeys:[`skill:${showText?'recognition':'listening'}`]};onResult(exercise,correct,{responseMs:Math.max(250,Date.now()-startedAt.current),hintsUsed:showTranslation?1:0})}
 function next(){setIndex(i=>(i+1)%ranked.length);setAnswers({});setShowTranslation(false);setShowText(true);startedAt.current=Date.now()}
 return <div className="card min-w-0"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="text-xs font-bold uppercase tracking-wide text-lime-700">Verstehen · {s.level}</div><h3 className="text-xl font-black">{s.title}</h3><div className="mt-1 text-sm text-slate-500">{Math.round(current.ratio*100)} % der Zielwörter bereits bekannt · nach deinem Lernstand ausgewählt</div></div><AudioButton text={s.text}/></div>
 <div className="mt-4 flex flex-wrap gap-2"><button className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold" onClick={()=>setShowText(v=>!v)}>{showText?'Nur hören':'Text anzeigen'}</button><button className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold" onClick={()=>setShowTranslation(v=>!v)}>{showTranslation?'Übersetzung aus':'Übersetzung anzeigen'}</button></div>
 {!showText&&<div className="mt-4 rounded-2xl bg-lime-50 p-4 text-sm text-lime-900"><b>Hörmodus:</b> Höre den Text und beantworte die Fragen ohne mitzulesen. Antworten fließen als Hörverständnis in deinen Lernstand ein.</div>}
 {showText&&<p className="mt-4 rounded-2xl bg-slate-50 p-4 text-lg leading-8">{s.text}</p>}{showTranslation&&<p className="mt-3 text-sm leading-6 text-slate-500">{s.translation}</p>}
 <div className="mt-5 space-y-4">{s.questions.map((q,qi)=><div key={q.prompt}><div className="font-bold">{q.prompt}</div><div className="mt-2 flex flex-wrap gap-2">{q.options.map(o=>{const picked=answers[qi]===o;const correct=picked&&o===q.answer;const wrong=picked&&o!==q.answer;return <button key={o} disabled={Boolean(answers[qi])} onClick={()=>answer(qi,o)} className={`rounded-xl border px-3 py-2 text-sm font-semibold disabled:cursor-default ${correct?'border-lime-500 bg-lime-100':wrong?'border-rose-300 bg-rose-50':'border-slate-200 bg-white'}`}>{o}</button>})}</div>{answers[qi]&&<div className={`mt-1 text-sm font-semibold ${answers[qi]===q.answer?'text-lime-700':'text-rose-700'}`}>{answers[qi]===q.answer?'Richtig.':'Richtig wäre: '+q.answer}</div>}</div>)}</div>
 <div className="mt-5 flex justify-end"><button className="btn-primary" onClick={next}>Nächster Text</button></div></div>
}
