'use client'

import { useEffect,useRef,useState } from 'react'
import { Send,Sparkles,Lightbulb } from 'lucide-react'
import AudioButton from './AudioButton'
import { CONVERSATION_CURRICULUM,type ConversationTopic } from '@/lib/conversation-curriculum'

type Msg={role:'user'|'tutor';text:string;translation?:string;hint?:string;status?:string}

export default function TutorChat(){
 const initial=CONVERSATION_CURRICULUM[0]
 const [topic,setTopic]=useState<ConversationTopic>(initial.id)
 const [messages,setMessages]=useState<Msg[]>([{role:'tutor',text:initial.steps[0].prompt,translation:initial.steps[0].translation,hint:initial.steps[0].hint}])
 const [input,setInput]=useState('');const[busy,setBusy]=useState(false);const[showTranslations,setShowTranslations]=useState(true);const[hintLevel,setHintLevel]=useState(0);const scrollRef=useRef<HTMLDivElement|null>(null)
 useEffect(()=>{scrollRef.current?.scrollTo({top:scrollRef.current.scrollHeight,behavior:'smooth'})},[messages])
 const scenario=CONVERSATION_CURRICULUM.find(s=>s.id===topic)??initial
 function chooseTopic(id:ConversationTopic){const s=CONVERSATION_CURRICULUM.find(x=>x.id===id)??initial;setTopic(id);setMessages([{role:'tutor',text:s.steps[0].prompt,translation:s.steps[0].translation,hint:s.steps[0].hint}]);setHintLevel(0);setInput('')}
 async function send(forced?:string){const text=(forced??input).trim();if(!text||busy)return;const next=[...messages,{role:'user' as const,text}];setMessages(next);setInput('');setBusy(true);try{const r=await fetch('/api/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:next.slice(-14),context:{topic,hintLevel}})});const data=await r.json();setMessages(m=>[...m,{role:'tutor',text:data.reply||'Poskusi še enkrat.',translation:data.translation,hint:data.hint,status:data.status}]);setHintLevel(0)}catch{setMessages(m=>[...m,{role:'tutor',text:'Poskusi še enkrat.'}])}finally{setBusy(false)}}
 const lastTutor=[...messages].reverse().find(m=>m.role==='tutor')
 return <div className="card min-w-0">
  <div className="mb-3 flex items-center gap-2"><Sparkles size={20}/><div className="min-w-0"><h3 className="text-xl font-black">Sprechen</h3><div className="text-xs text-slate-500">{scenario.goal}</div></div><span className="ml-auto rounded-full bg-lime-100 px-2 py-1 text-xs font-bold">{scenario.level}</span></div>
  <div className="mb-4 flex gap-2 overflow-x-auto pb-1">{CONVERSATION_CURRICULUM.map(t=><button key={t.id} onClick={()=>chooseTopic(t.id)} className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${topic===t.id?'bg-slate-950 text-white':'bg-slate-100 text-slate-700'}`}>{t.label}</button>)}</div>
  <div className="mb-3 flex flex-wrap gap-1.5">{scenario.grammarTargets.map(t=><span key={t} className="rounded-full bg-slate-50 px-2 py-1 text-[11px] text-slate-500">{t}</span>)}</div>
  <div ref={scrollRef} className="max-h-96 space-y-3 overflow-y-auto pr-1">{messages.map((m,i)=><div key={i} className={`rounded-2xl p-3 ${m.role==='user'?'ml-6 bg-lime-100 sm:ml-10':m.status==='correction'?'mr-6 bg-amber-50 sm:mr-10':m.status==='off-topic'?'mr-6 bg-rose-50 sm:mr-10':'mr-6 bg-slate-100 sm:mr-10'}`}><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><div className="break-words">{m.text}</div>{showTranslations&&m.translation&&<div className="mt-1 text-sm text-slate-500">{m.translation}</div>}{m.hint&&<div className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-sm"><strong>Tipp:</strong> {m.hint}</div>}</div>{m.role==='tutor'&&<AudioButton text={m.text.split(/(?<=[.!?])\s/)[0]} compact/>}</div></div>)}</div>
  <div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>setShowTranslations(v=>!v)} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold">{showTranslations?'Übersetzung aus':'Übersetzung an'}</button><button onClick={()=>{setHintLevel(v=>Math.min(4,v+1));void send('Ne razumem')}} className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold"><Lightbulb size={14}/> Hilfe</button>{lastTutor?.hint&&<button onClick={()=>setInput(lastTutor.hint||'')} className="rounded-full bg-lime-100 px-3 py-2 text-xs font-semibold">Tipp übernehmen</button>}</div>
  <div className="mt-4 flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void send()}} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Antworte auf Slowenisch …"/><button onClick={()=>void send()} disabled={busy} className="btn-primary px-4" aria-label="Antwort senden"><Send size={18}/></button></div>
 </div>
}
