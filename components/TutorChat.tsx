'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, Lightbulb } from 'lucide-react'
import AudioButton from './AudioButton'

type Topic='smalltalk'|'restaurant'|'travel'|'shopping'
type Msg={role:'user'|'tutor';text:string;translation?:string;hint?:string;status?:string}
const topics:{id:Topic;label:string;start:string;translation:string}[]=[
  {id:'smalltalk',label:'Smalltalk',start:'Živjo! Kje si zdaj?',translation:'Hallo! Wo bist du gerade?'},
  {id:'restaurant',label:'Restaurant',start:'Dober dan. Kaj želite piti?',translation:'Guten Tag. Was möchten Sie trinken?'},
  {id:'travel',label:'Unterwegs',start:'Kam greš danes?',translation:'Wohin gehst oder fährst du heute?'},
  {id:'shopping',label:'Einkaufen',start:'Dober dan. Kaj iščete?',translation:'Guten Tag. Was suchen Sie?'},
]

export default function TutorChat(){
 const [topic,setTopic]=useState<Topic>('smalltalk'); const initial=topics[0]
 const [messages,setMessages]=useState<Msg[]>([{role:'tutor',text:initial.start,translation:initial.translation}]); const [input,setInput]=useState(''); const [busy,setBusy]=useState(false); const [showTranslations,setShowTranslations]=useState(true); const [hintLevel,setHintLevel]=useState(0); const scrollRef=useRef<HTMLDivElement|null>(null)
 useEffect(()=>{scrollRef.current?.scrollTo({top:scrollRef.current.scrollHeight,behavior:'smooth'})},[messages])
 function chooseTopic(id:Topic){const t=topics.find(x=>x.id===id)!;setTopic(id);setMessages([{role:'tutor',text:t.start,translation:t.translation}]);setHintLevel(0);setInput('')}
 async function send(forced?:string){const text=(forced??input).trim();if(!text||busy)return;const next=[...messages,{role:'user' as const,text}];setMessages(next);setInput('');setBusy(true);try{const r=await fetch('/api/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:next.slice(-14),context:{topic,hintLevel}})});const data=await r.json();setMessages(m=>[...m,{role:'tutor',text:data.reply||'Poskusi še enkrat.',translation:data.translation,hint:data.hint,status:data.status}]);setHintLevel(0)}catch{setMessages(m=>[...m,{role:'tutor',text:'Poskusi še enkrat.'}])}finally{setBusy(false)}}
 const lastTutor=[...messages].reverse().find(m=>m.role==='tutor');
 return <div className="card min-w-0">
  <div className="mb-3 flex items-center gap-2"><Sparkles size={20}/><h3 className="text-xl font-black">Sprechen</h3><span className="ml-auto rounded-full bg-lime-100 px-2 py-1 text-xs font-bold">geführt</span></div>
  <div className="mb-4 flex gap-2 overflow-x-auto pb-1">{topics.map(t=><button key={t.id} onClick={()=>chooseTopic(t.id)} className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${topic===t.id?'bg-slate-950 text-white':'bg-slate-100 text-slate-700'}`}>{t.label}</button>)}</div>
  <div ref={scrollRef} className="max-h-96 space-y-3 overflow-y-auto pr-1">{messages.map((m,i)=><div key={i} className={`rounded-2xl p-3 ${m.role==='user'?'ml-6 bg-lime-100 sm:ml-10':m.status==='correction'?'mr-6 bg-amber-50 sm:mr-10':m.status==='off-topic'?'mr-6 bg-rose-50 sm:mr-10':'mr-6 bg-slate-100 sm:mr-10'}`}><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><div className="break-words">{m.text}</div>{showTranslations&&m.translation&&<div className="mt-1 text-sm text-slate-500">{m.translation}</div>}{m.hint&&<div className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-sm"><strong>Tipp:</strong> {m.hint}</div>}</div>{m.role==='tutor'&&<AudioButton text={m.text.split(/(?<=[.!?])\s/)[0]} compact/>}</div></div>)}</div>
  <div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>setShowTranslations(v=>!v)} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold">{showTranslations?'Übersetzung aus':'Übersetzung an'}</button><button onClick={()=>{setHintLevel(v=>Math.min(4,v+1));void send('Ne razumem')}} className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold"><Lightbulb size={14}/> Hilfe</button>{lastTutor?.hint&&<button onClick={()=>setInput(lastTutor.hint||'')} className="rounded-full bg-lime-100 px-3 py-2 text-xs font-semibold">Tipp übernehmen</button>}</div>
  <div className="mt-4 flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void send()}} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Antworte auf Slowenisch …"/><button onClick={()=>void send()} disabled={busy} className="btn-primary px-4" aria-label="Antwort senden"><Send size={18}/></button></div>
 </div>
}
