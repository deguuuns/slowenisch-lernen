'use client'

import { useEffect,useRef,useState } from 'react'
import { ChevronDown, Lightbulb, RefreshCcw, Send, Sparkles } from 'lucide-react'
import AudioButton from './AudioButton'
import { TUTOR_TOPICS, TutorReply, TutorTopicId } from '@/lib/tutor-engine'

type Msg={role:'user'|'tutor';text:string;translation?:string;kind?:TutorReply['kind'];hint?:string;suggestions?:string[]}

export default function TutorChat(){
  const [topic,setTopic]=useState<TutorTopicId>('location')
  const initial=TUTOR_TOPICS.find(item=>item.id===topic)!
  const [messages,setMessages]=useState<Msg[]>([{role:'tutor',text:initial.opening,translation:initial.openingDe}])
  const [input,setInput]=useState(''),[busy,setBusy]=useState(false),[showTranslation,setShowTranslation]=useState(true),[turn,setTurn]=useState(0)
  const scrollRef=useRef<HTMLDivElement|null>(null)
  const selected=TUTOR_TOPICS.find(item=>item.id===topic)!

  useEffect(()=>{scrollRef.current?.scrollTo({top:scrollRef.current.scrollHeight,behavior:'smooth'})},[messages])

  function reset(nextTopic=topic){
    const item=TUTOR_TOPICS.find(value=>value.id===nextTopic)!
    setTopic(nextTopic);setMessages([{role:'tutor',text:item.opening,translation:item.openingDe}]);setInput('');setTurn(0)
  }

  async function send(value?:string){
    const text=(value??input).trim();if(!text||busy)return
    const next=[...messages,{role:'user' as const,text}]
    setMessages(next);setInput('');setBusy(true)
    try{
      const r=await fetch('/api/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:next.slice(-14),topic,turn})})
      const data=await r.json() as TutorReply
      setMessages(m=>[...m,{role:'tutor',text:data.reply||'Poskusi še enkrat.',translation:data.translation,kind:data.kind,hint:data.hint,suggestions:data.suggestions}])
      if(data.correct)setTurn(value=>value+1)
    }catch{setMessages(m=>[...m,{role:'tutor',text:'Poskusi še enkrat.',translation:'Versuch es noch einmal.',kind:'help'}])}
    finally{setBusy(false)}
  }

  const lastTutor=[...messages].reverse().find(m=>m.role==='tutor')

  return <div className="card min-w-0">
    <div className="flex flex-wrap items-center gap-2"><Sparkles size={20}/><h3 className="text-xl font-black">Gesprächstraining</h3><span className="ml-auto rounded-full bg-lime-100 px-2 py-1 text-xs font-bold">{turn}/8</span></div>

    <div className="mt-4 rounded-2xl bg-slate-50 p-3">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Thema</div>
      <div className="mt-1 font-black">{selected.title}</div>
      <div className="mt-1 text-sm text-slate-600">{selected.description}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="relative"><select value={topic} onChange={e=>reset(e.target.value as TutorTopicId)} className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-semibold">{TUTOR_TOPICS.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-2.5" size={16}/></label>
        <button onClick={()=>reset()} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><RefreshCcw size={15}/>Neu starten</button>
        <button onClick={()=>setShowTranslation(value=>!value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold">{showTranslation?'Übersetzung aus':'Übersetzung an'}</button>
      </div>
    </div>

    <div ref={scrollRef} className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
      {messages.map((m,i)=><div key={i} className={`rounded-2xl p-3 ${m.role==='user'?'ml-6 bg-lime-100 sm:ml-10':'mr-6 bg-slate-100 sm:mr-10'} ${m.kind==='correction'?'ring-1 ring-amber-300':''}`}>
        <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><div className="break-words">{m.text}</div>{showTranslation&&m.translation&&<div className="mt-1 text-sm text-slate-500">{m.translation}</div>}{m.hint&&<div className="mt-2 rounded-xl bg-white/70 px-2 py-1.5 text-sm"><b>Tipp:</b> {m.hint}</div>}{m.suggestions?.length?<div className="mt-2 flex flex-wrap gap-2">{m.suggestions.map(option=><button key={option} onClick={()=>send(option)} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">{option}</button>)}</div>:null}</div>{m.role==='tutor'&&<AudioButton text={m.text.split(/(?<=[.!?])\s/)[0]} compact/>}</div>
      </div>)}
    </div>

    {lastTutor?.role==='tutor'&&lastTutor.hint&&!lastTutor.suggestions?.length?<div className="mt-3 flex items-center gap-2 rounded-2xl bg-amber-50 p-3 text-sm"><Lightbulb size={17}/><span>{lastTutor.hint}</span></div>:null}

    <div className="mt-4 flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send()}} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Antworte auf Slowenisch …"/><button onClick={()=>send()} disabled={busy} className="btn-primary px-4" aria-label="Antwort senden"><Send size={18}/></button></div>
    <p className="mt-2 text-xs text-slate-500">Der Tutor akzeptiert nicht einfach jede Antwort: unpassende Antworten, Deutsch und typische Grammatikfehler werden gezielt aufgegriffen.</p>
  </div>
}
