'use client'

import { useMemo, useRef, useState } from 'react'
import { Brain, ChevronDown, ChevronUp, Dumbbell, Headphones, Search } from 'lucide-react'
import AudioButton from './AudioButton'
import InputPractice from './InputPractice'
import { evaluateAnswer } from '@/lib/answer-evaluation'
import { isVerbFormVocabularyId } from '@/lib/curriculum-access'
import { getVocabularyStatus } from '@/lib/learner-status'
import { conjugationMistakeCategory, mistakeCategoryFromEvaluation } from '@/lib/learning-signals'
import { chooseVocabularyDirection, introducedVerbFormKeys, primarySkillForDirection, rankVocabularyForPractice } from '@/lib/practice-engine'
import { verbByInfinitive, verbCatalog } from '@/lib/verb-catalog'
import { Exercise, UserProgress, Vocabulary } from '@/types'

type ResultMeta = { responseMs:number; hintsUsed:number }
type Props = { vocabulary:Vocabulary[]; progress:UserProgress; onResult:(exercise:Exercise, correct:boolean, meta:ResultMeta)=>void }
type Mode = 'list'|'test'|'conjugation'|'input'

function availableWords(vocabulary:Vocabulary[], progress:UserProgress) {
  return rankVocabularyForPractice(vocabulary.filter(word=>!isVerbFormVocabularyId(word.id)),progress)
}

export default function VocabWorkspace({ vocabulary, progress, onResult }:Props) {
  const [mode,setMode]=useState<Mode>('list')
  const [query,setQuery]=useState('')
  const [category,setCategory]=useState('Alle')
  const [open,setOpen]=useState<string|null>(null)
  const visibleVocabulary=useMemo(()=>vocabulary.filter(word=>!isVerbFormVocabularyId(word.id)),[vocabulary])
  const categories=['Alle',...Array.from(new Set(visibleVocabulary.map(item=>item.category)))]
  const list=visibleVocabulary.filter(item=>(category==='Alle'||item.category===category)&&(`${item.sl} ${item.de}`.toLowerCase().includes(query.toLowerCase())))
  const known=availableWords(vocabulary,progress)

  return <div className="min-w-0 space-y-4">
    <div className="card min-w-0">
      <h2 className="text-2xl font-black sm:text-3xl">Vokabeln & Verstehen</h2>
      <p className="mt-2 text-slate-600">Lerne Wörter, rufe sie aktiv ab, trainiere Verbformen und begegne bekanntem Wortschatz in kurzen slowenischen Texten.</p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <button className={`btn-primary min-h-11 ${mode==='list'?'':'opacity-80'}`} onClick={()=>setMode('list')}>Vokabeln lernen</button>
        <button className="min-h-11 rounded-2xl bg-lime-200 px-4 font-bold" onClick={()=>setMode('test')}>Vokabeltest starten</button>
        <button className="min-h-11 rounded-2xl bg-slate-950 px-4 font-bold text-white" onClick={()=>setMode('conjugation')}>Konjugation üben</button>
        <button className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-sky-100 px-4 font-bold text-sky-950" onClick={()=>setMode('input')}><Headphones size={18}/>Verstehen</button>
      </div>
    </div>

    {mode==='test' && <VocabularyTest words={known} progress={progress} onResult={onResult}/>} 
    {mode==='conjugation' && <ConjugationPractice progress={progress} onResult={onResult}/>} 
    {mode==='input' && <InputPractice vocabulary={vocabulary} progress={progress} onResult={onResult}/>} 
    {mode==='list' && <>
      <div className="card grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"><div className="relative"><Search className="absolute left-3 top-3.5 text-slate-400" size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-3" placeholder="Slowenisch oder Deutsch …"/></div><select value={category} onChange={e=>setCategory(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3">{categories.map(x=><option key={x}>{x}</option>)}</select></div>
      <div className="grid gap-3 lg:grid-cols-2">{list.map(item=>{const verb=verbByInfinitive(item.sl);const expanded=open===item.id;return <div key={item.id} className="card min-w-0"><div className="flex gap-3"><AudioButton text={item.sl} compact/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><b className="text-lg">{item.sl}</b><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{getVocabularyStatus(item.id,progress)}</span></div><div className="text-slate-600">{item.de}</div><div className="mt-2 text-sm"><b>{item.example}</b><div className="text-slate-500">{item.exampleDe}</div></div>{verb&&<button onClick={()=>setOpen(expanded?null:item.id)} className="mt-3 flex items-center gap-1 text-sm font-bold text-lime-700">Konjugation {expanded?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</button>}</div></div>{verb&&expanded&&<div className="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-3"><div className="mb-2 font-black">Präsens</div><table className="w-full text-sm"><tbody>{verb.forms.map(form=><tr key={`${form.number}-${form.person}`} className="border-t border-slate-200"><td className="py-2 pr-3 text-slate-500">{form.pronoun}</td><td className="py-2 font-bold">{form.form}</td></tr>)}</tbody></table></div>}</div>})}</div>
    </>}
  </div>
}

function VocabularyTest({ words,progress,onResult }:{words:Vocabulary[];progress:UserProgress;onResult:Props['onResult']}) {
  const [index,setIndex]=useState(0),[input,setInput]=useState(''),[feedback,setFeedback]=useState('')
  const startedAt=useRef(Date.now())
  const word=words[index%Math.max(words.length,1)]
  if(!word)return <div className="card"><b>Noch keine eingeführten Vokabeln für einen Test.</b><p className="mt-2 text-sm text-slate-600">Lerne zuerst Wörter in einer Lektion. Der Test greift bewusst nicht auf noch unbekannten Stoff vor.</p></div>
  const direction=chooseVocabularyDirection(word,progress,index)
  const deToSl=direction==='de-sl'
  function next(){setIndex(i=>i+1);setInput('');setFeedback('');startedAt.current=Date.now()}
  function check(){
    const expected=deToSl?word.sl:word.de
    const result=evaluateAnswer({input,expected,alternatives:[],locale:deToSl?'sl-SI':'de-DE'})
    const mistake=mistakeCategoryFromEvaluation(result)
    const exercise:Exercise={id:`vocab-test:${word.id}:${direction}${mistake?`:mistake:${mistake}`:''}`,lesson:word.lesson,type:'free',prompt:deToSl?word.de:word.sl,answer:expected,vocabularyIds:[word.id],evaluationMode:'grammar',skillTargets:[primarySkillForDirection(direction)],targetContentKeys:[`vocab:${word.id}`],mistakeCategory:mistake}
    onResult(exercise,result.isCorrect,{responseMs:Math.max(250,Date.now()-startedAt.current),hintsUsed:0})
    setFeedback(result.isCorrect?'Odlično! Richtig.':result.explanation||`Richtig ist: ${expected}`)
    if(result.isCorrect)setTimeout(next,700)
  }
  return <div className="card"><div className="flex items-center gap-2 text-sm font-bold text-lime-700"><Brain size={18}/>Adaptiver Vokabeltest</div><div className="mt-2 text-xs text-slate-500">Die Practice Engine wählt Wort und Abrufrichtung nach Fälligkeit, Fehlern sowie Recognition-/Production-Stärke.</div><div className="mt-4 text-sm text-slate-500">{deToSl?'Deutsch → Slowenisch · aktive Produktion':'Slowenisch → Deutsch · Erkennen'}</div><div className="mt-1 text-2xl font-black">{deToSl?word.de:word.sl}</div>{!deToSl&&<div className="mt-2"><AudioButton text={word.sl} compact/></div>}<div className="mt-4 flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Antwort …"/><button className="btn-primary" onClick={check}>Prüfen</button></div>{feedback&&<div className="mt-3 rounded-2xl bg-slate-50 p-3">{feedback}</div>}</div>
}

function ConjugationPractice({progress,onResult}:{progress:UserProgress;onResult:Props['onResult']}) {
  const introducedForms=introducedVerbFormKeys(progress)
  const verbs=verbCatalog.map(verb=>({...verb,forms:verb.forms.filter(form=>introducedForms.has(`${verb.id}:${form.number}:${form.person}`))})).filter(verb=>verb.forms.length)
  const [round,setRound]=useState(0),[input,setInput]=useState(''),[feedback,setFeedback]=useState('')
  const startedAt=useRef(Date.now())
  if(!verbs.length)return <div className="card"><b>Noch keine freigeschalteten Verbformen.</b><p className="mt-2 text-sm text-slate-600">Das Konjugationstraining verwendet nur Formen, die im Curriculum bereits eingeführt wurden.</p></div>
  const verb=verbs[round%verbs.length]
  const form=verb.forms[(round*3+1)%verb.forms.length]
  function next(){setRound(r=>r+1);setInput('');setFeedback('');startedAt.current=Date.now()}
  function check(){
    const result=evaluateAnswer({input,expected:form.form,locale:'sl-SI'})
    const sameForm=verb.forms.find(x=>x.form.toLowerCase()===input.trim().toLowerCase())
    const mistake=result.isCorrect?undefined:(sameForm?conjugationMistakeCategory(form.number,sameForm.number):mistakeCategoryFromEvaluation(result)||'conjugation-error')
    const key=`${verb.id}:${form.number}:${form.person}`
    const exercise:Exercise={id:`conj:${key}${mistake?`:mistake:${mistake}`:''}`,lesson:1,type:'free',prompt:`${verb.infinitive} – ${form.pronoun}`,answer:form.form,evaluationMode:'grammar',skillTargets:['grammar-application','production'],verbPractice:true,requiredVerbForms:[{verbId:verb.id,person:form.person,number:form.number}],targetContentKeys:[`verb:${key}`],mistakeCategory:mistake}
    onResult(exercise,result.isCorrect,{responseMs:Math.max(250,Date.now()-startedAt.current),hintsUsed:0})
    if(result.isCorrect){setFeedback('Odlično! Richtig.');setTimeout(next,700)}
    else setFeedback(sameForm&&sameForm.number!==form.number?`Fast. „${input}“ gehört zu ${sameForm.pronoun} (${sameForm.number}). Für ${form.pronoun} brauchst du „${form.form}“.`:result.explanation||`Richtig ist: ${form.form}`)
  }
  return <div className="card"><div className="flex items-center gap-2 text-sm font-bold text-lime-700"><Dumbbell size={18}/>Konjugationstraining</div><div className="mt-2 text-xs text-slate-500">Nur bereits freigeschaltete Verbformen werden abgefragt.</div><div className="mt-4 text-2xl font-black">{verb.infinitive} <span className="font-normal text-slate-500">– {verb.translation}</span></div><div className="mt-3 rounded-2xl bg-slate-50 p-4"><div className="text-sm text-slate-500">Bilde die richtige Form für</div><div className="text-xl font-black">{form.pronoun} · {form.number==='dual'?'Dual':form.number==='plural'?'Plural':'Singular'}</div></div><div className="mt-4 flex gap-2"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Verbform …"/><button className="btn-primary" onClick={check}>Prüfen</button></div>{feedback&&<div className="mt-3 rounded-2xl bg-amber-50 p-3">{feedback}</div>}</div>
}
