'use client'

import { useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import AudioButton from './AudioButton'

type Msg = { role: 'user'|'tutor'; text:string }

export default function TutorChat() {
  const [messages,setMessages]=useState<Msg[]>([{role:'tutor',text:'Živjo! Kje si zdaj?'}])
  const [input,setInput]=useState('')
  const [busy,setBusy]=useState(false)

  async function send() {
    const text=input.trim(); if(!text||busy)return
    const next=[...messages,{role:'user' as const,text}]
    setMessages(next); setInput(''); setBusy(true)
    try {
      const r=await fetch('/api/tutor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:next.slice(-8)})})
      const data=await r.json()
      setMessages(m=>[...m,{role:'tutor',text:data.reply||'Poskusi še enkrat.'}])
    } catch { setMessages(m=>[...m,{role:'tutor',text:'Poskusi še enkrat.'}]) }
    finally { setBusy(false) }
  }

  return <div className="card">
    <div className="mb-4 flex items-center gap-2"><Sparkles size={20}/><h3 className="text-xl font-black">Tutor</h3><span className="ml-auto rounded-full bg-lime-100 px-2 py-1 text-xs font-bold">lokal + LLM-ready</span></div>
    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">{messages.map((m,i)=><div key={i} className={`rounded-2xl p-3 ${m.role==='user'?'ml-8 bg-lime-100':'mr-8 bg-slate-100'}`}><div className="flex items-start gap-2"><div className="flex-1">{m.text}</div>{m.role==='tutor'&&/[čšž]|\b(kje|kam|sem|grem|jutri|danes|živjo)\b/i.test(m.text)&&<AudioButton text={m.text.split(/(?<=[.!?])\s/)[0]} compact/>}</div></div>)}</div>
    <div className="mt-4 flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send()}} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Antworte auf Slowenisch …"/><button onClick={send} disabled={busy} className="btn-primary px-4"><Send size={18}/></button></div>
    <p className="mt-2 text-xs text-slate-500">Ohne API-Konfiguration nutzt die App einen lokalen Fehler-Tutor. Mit AI_TUTOR_ENDPOINT wird ein externer LLM-Tutor zugeschaltet.</p>
  </div>
}
