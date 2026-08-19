'use client'

import { useMemo, useState } from 'react'
import { Exercise } from '@/types'
import { isEquivalent } from '@/lib/text'

function shuffled<T>(items:T[]) {
  const copy=[...items]
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1))
    ;[copy[i],copy[j]]=[copy[j],copy[i]]
  }
  return copy
}

export default function ExerciseDeck({exercises,onResult,onComplete}:{exercises:Exercise[];onResult:(e:Exercise,c:boolean)=>void;onComplete?:()=>void}) {
  const [i,setI]=useState(0)
  const [value,setValue]=useState('')
  const [checked,setChecked]=useState(false)
  const [finished,setFinished]=useState(false)
  const ex=exercises[i]
  const choiceOptions=useMemo(()=>{
    if(!ex || ex.type!=='choice') return []
    return shuffled(Array.from(new Set([ex.answer,...(ex.alternatives??[])])))
  },[ex?.id])

  if(!exercises.length) return <div className="card">Für diesen Lernblock sind noch keine Übungen vorhanden.</div>
  if(finished) return <div className="card text-center"><div className="text-sm font-bold text-lime-700">Geschafft</div><h3 className="mt-2 text-2xl font-black">Lernblock abgeschlossen</h3><button onClick={onComplete} className="btn-primary mt-5 justify-center">Weiter</button></div>

  const correct=ex ? isEquivalent(value,ex.answer) : false

  function submit(answer=value) {
    if(!ex || !answer.trim() || checked) return
    setValue(answer)
    setChecked(true)
    onResult(ex,isEquivalent(answer,ex.answer))
  }

  function next() {
    if(i>=exercises.length-1) {
      setFinished(true)
      return
    }
    setI(i+1)
    setValue('')
    setChecked(false)
  }

  return <div className="card">
    <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-lime-400 transition-all" style={{width:`${Math.round(((i+(checked?1:0))/exercises.length)*100)}%`}}/></div>
    <div className="text-sm font-bold text-lime-700">Aufgabe {i+1} von {exercises.length}</div>
    <h3 className="mt-2 text-xl font-black">{ex.prompt}</h3>
    {ex.hint&&<p className="mt-2 text-sm text-slate-500">Hinweis: {ex.hint}</p>}

    {ex.type==='choice' ? <div className="mt-5 grid gap-2">
      {choiceOptions.map((option,index)=><button key={option} disabled={checked} onClick={()=>submit(option)} className={`rounded-2xl border px-4 py-3 text-left font-semibold transition ${checked&&isEquivalent(option,ex.answer)?'border-lime-500 bg-lime-50':checked&&value===option?'border-amber-400 bg-amber-50':'border-slate-200 bg-white hover:border-lime-400'}`}><span className="mr-3 text-slate-400">{String.fromCharCode(65+index)}</span>{option}</button>)}
    </div> : <>
      <input value={value} disabled={checked} onChange={e=>setValue(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submit()}} className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500" placeholder="Deine Antwort …"/>
      <div className="mt-2 flex gap-2">{['č','š','ž'].map(ch=><button key={ch} type="button" disabled={checked} onClick={()=>setValue(v=>v+ch)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-black">{ch.toUpperCase()}</button>)}</div>
      <button onClick={()=>submit()} disabled={!value.trim()||checked} className="btn-primary mt-3 w-full justify-center">Prüfen</button>
    </>}

    {checked&&<div className={`mt-4 rounded-2xl p-4 ${correct?'bg-lime-50':'bg-amber-50'}`}>
      {correct?<><b>Pravilno!</b> Genau richtig.</>:<><b>Noch nicht.</b><div className="mt-1">Richtig: <span className="font-bold">{ex.answer}</span></div>{ex.explanation&&<div className="mt-2 text-sm">Warum? {ex.explanation}</div>}</>}
      <button onClick={next} className="mt-3 font-bold underline">{i===exercises.length-1?'Block abschließen':'Nächste Aufgabe'}</button>
    </div>}
  </div>
}
