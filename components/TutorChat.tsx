'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import AudioButton from './AudioButton'

type Msg = { role:'user'|'tutor'; text:string }

export default function TutorChat() {
  const [messages,setMessages]=useState<Msg[]>([{role:'tutor',text:'Živjo! Kje si zdaj?'}])
  const [input,setInput]=useState('')
  const [busy,setBusy]=useState(false)
  const scrollRef=useRef<HTMLDivElement|null>(null)

  useEffect(()=>{scrollRef.current?.scrollTo({top:scrollRef.current.scrollHeight,behavior:'smooth'})},[messages])

  async function send() {
    const text=input.trim(); if(!text||busy)return
    const next=[...messages,{role:'user' as const,text}]
    setMessages(next); setInput(''); setBusy(true)
    try {
      const r=await fetch('/api/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:next.slice(-12)})})
      const data=await r.json()
      setMessages(m=>[...m,{role:'tutor',text:data.reply||'Poskusi še enkrat.'}])
    } catch { setMessages(m=>[...m,{role:'tutor',text:'Poskusi še enkrat.'}]) }
    finally { setBusy(false) }
  }

  return <div className="card min-w-0">
    <div className="mb-4 flex items-center gap-2"><Sparkles size={20}/><h3 className="text-xl font-black">Tutor</h3><span className="ml-auto rounded-full bg-lime-100 px-2 py-1 text-xs font-bold">Gespräch</span></div>
    <div ref={scrollRef} className="max-h-96 space-y-3 overflow-y-auto pr-1">{messages.map((m,i)=><div key={i} className={`rounded-2xl p-3 ${m.role==='user'?'ml-6 bg-lime-100 sm:ml-10':'mr-6 bg-slate-100 sm:mr-10'}`}><div className="flex items-start gap-2"><div className="min-w-0 flex-1 break-words">{m.text}</div>{m.role==='tutor'&&<AudioButton text={m.text.split(/(?<=[.!?])\s/)[0]} compact/>}</div></div>)}</div>
    <div className="mt-4 flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send()}} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Antworte auf Slowenisch …"/><button onClick={send} disabled={busy} className="btn-primary px-4" aria-label="Antwort senden"><Send size={18}/></button></div>
  </div>
}
