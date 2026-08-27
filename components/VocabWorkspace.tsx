'use client'

import { useMemo, useRef, useState } from 'react'
import { Brain, CheckCircle2, ChevronDown, Dumbbell, Headphones, Search, XCircle } from 'lucide-react'
import AudioButton from './AudioButton'
import InputPractice from './InputPractice'
import LearningFocusPortal from './LearningFocusPortal'
import { evaluateAnswer } from '@/lib/answer-evaluation'
import { isVerbFormVocabularyId } from '@/lib/curriculum-access'
import { getVocabularyStatus } from '@/lib/learner-status'
import { conjugationMistakeCategory, mistakeCategoryFromEvaluation } from '@/lib/learning-signals'
import { chooseVocabularyDirection, primarySkillForDirection, rankIntroducedVerbForms, rankVocabularyForPractice } from '@/lib/practice-engine'
import { verbByInfinitive } from '@/lib/content-registry'
import { Exercise, UserProgress, Vocabulary, VocabularyStatus } from '@/types'

type ResultMeta={responseMs:number;hintsUsed:number}
type Props={vocabulary:Vocabulary[];progress:UserProgress;onResult:(exercise:Exercise,correct:boolean,meta:ResultMeta)=>void}
type Mode='list'|'test'|'conjugation'|'input'
type StatusFilter='Alle'|VocabularyStatus
const statusLabels:Record<VocabularyStatus,string>={neu:'Neu',eingeführt:'Eingeführt',lernen:'Lernen',gelernt:'Gelernt',sicher:'Sicher'}
function availableWords(vocabulary:Vocabulary[],progress:UserProgress){return rankVocabularyForPractice(vocabulary.filter(word=>!isVerbFormVocabularyId(word.id)),progress)}

export default function VocabWorkspace({vocabulary,progress,onResult}:Props){
  const [mode,setMode]=useState<Mode>('list')
  const [query,setQuery]=useState('')
  const [category,setCategory]=useState('Alle')
  const [status,setStatus]=useState<StatusFilter>('Alle')
  const [open,setOpen]=useState<string|null>(null)
  const visibleVocabulary=useMemo(()=>vocabulary.filter(word=>!isVerbFormVocabularyId(word.id)),[vocabulary])
  const categories=['Alle',...Array.from(new Set(visibleVocabulary.map(item=>item.curriculumUnit||item.category)))]
  const statusCounts=useMemo(()=>visibleVocabulary.reduce((counts,item)=>{const key=getVocabularyStatus(item.id,progress);counts[key]=(counts[key]||0)+1;return counts},{neu:0,eingeführt:0,lernen:0,gelernt:0,sicher:0} as Record<VocabularyStatus,number>),[visibleVocabulary,progress])
  const list=visibleVocabulary.filter(item=>{const itemStatus=getVocabularyStatus(item.id,progress),unit=item.curriculumUnit||item.category;return(category==='Alle'||unit===category)&&(status==='Alle'||itemStatus===status)&&(`${item.sl} ${item.de}`.toLowerCase().includes(query.toLowerCase()))})
  const known=availableWords(vocabulary,progress)

  return <div className="space-y-4">
    <div><div className="eyebrow">Vokabeln</div><h1 className="page-title mt-1">Wörter & Formen</h1><p className="page-copy">Nachschlagen oder gezielt üben.</p></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <ModeButton active={mode==='list'} onClick={()=>setMode('list')} icon={Brain} label="Wörter"/>
      <ModeButton active={mode==='test'} onClick={()=>setMode('test')} icon={Brain} label="Vokabeltest"/>
      <ModeButton active={mode==='conjugation'} onClick={()=>setMode('conjugation')} icon={Dumbbell} label="Konjugation"/>
      <ModeButton active={mode==='input'} onClick={()=>setMode('input')} icon={Headphones} label="Verstehen"/>
    </div>

    {mode==='test'&&<VocabularyTest words={known} progress={progress} onResult={onResult} onExit={()=>setMode('list')}/>} 
    {mode==='conjugation'&&<ConjugationPractice progress={progress} onResult={onResult} onExit={()=>setMode('list')}/>} 
    {mode==='input'&&<InputPractice vocabulary={vocabulary} progress={progress} onResult={onResult}/>} 
    {mode==='list'&&<>
      <section className="surface p-3 sm:p-4">
        <div className="relative"><Search className="absolute left-3 top-3.5 text-slate-400" size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-3" placeholder="Suchen …"/></div>
        <div className="mt-2 grid grid-cols-2 gap-2"><select value={category} onChange={event=>setCategory(event.target.value)} className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="Alle">Alle Lernbereiche</option>{categories.filter(x=>x!=='Alle').map(x=><option key={x}>{x}</option>)}</select><select value={status} onChange={event=>setStatus(event.target.value as StatusFilter)} className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option>Alle</option>{(Object.keys(statusLabels) as VocabularyStatus[]).map(key=><option key={key} value={key}>{statusLabels[key]} ({statusCounts[key]})</option>)}</select></div>
      </section>
      <div className="surface divide-y divide-slate-100 overflow-hidden">{list.map(item=>{const verb=verbByInfinitive(item.lemma||item.sl);const expanded=open===item.id;return <div key={item.id} className="p-4"><div className="flex items-start gap-3"><AudioButton text={item.sl} compact/><button type="button" onClick={()=>verb&&setOpen(expanded?null:item.id)} className="min-w-0 flex-1 text-left"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="truncate text-lg font-black">{item.lemma&&item.lemma!==item.sl?item.lemma:item.sl}</div><div className="truncate text-sm text-slate-500">{item.de}</div></div><div className="flex shrink-0 items-center gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">{statusLabels[getVocabularyStatus(item.id,progress)]}</span>{verb&&<ChevronDown size={17} className={`text-slate-400 transition ${expanded?'rotate-180':''}`}/>}</div></div></button></div>{expanded&&verb&&<div className="mt-4 rounded-2xl bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-wide text-slate-400">Präsens</div><div className="mt-2 grid gap-2 sm:grid-cols-2">{verb.forms.map(form=><div key={`${form.number}-${form.person}`} className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">{form.pronoun}</span><b>{form.form}</b></div>)}</div><details className="mt-4 text-sm"><summary className="cursor-pointer font-bold">Beispiel anzeigen</summary><div className="mt-2 font-semibold">{item.example}</div><div className="text-slate-500">{item.exampleDe}</div></details></div>}</div>})}{!list.length&&<div className="p-6 text-center text-sm text-slate-500">Keine passenden Vokabeln gefunden.</div>}</div>
    </>}
  </div>
}

function ModeButton({active,onClick,icon:Icon,label}:{active:boolean;onClick:()=>void;icon:typeof Brain;label:string}){return <button onClick={onClick} className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-black ${active?'border-lime-400 bg-lime-100 text-slate-950':'border-slate-200 bg-white text-slate-600'}`}><Icon size={17}/>{label}</button>}

function VocabularyTest({words,progress,onResult,onExit}:{words:Vocabulary[];progress:UserProgress;onResult:Props['onResult'];onExit:()=>void}){
  const [index,setIndex]=useState(0),[input,setInput]=useState(''),[checked,setChecked]=useState(false),[feedback,setFeedback]=useState(''),[correct,setCorrect]=useState(false)
  const startedAt=useRef(Date.now())
  const word=words[index%Math.max(words.length,1)]
  if(!word)return <LearningFocusPortal><div className="exercise-shell"><div/><div className="exercise-feedback"><h2 className="text-xl font-black">Noch keine Vokabeln für einen Test</h2><p className="mt-2 text-sm text-slate-500">Lerne zuerst einige Wörter.</p><button className="btn-primary mt-3 w-full" onClick={onExit}>Zurück</button></div></div></LearningFocusPortal>
  const direction=chooseVocabularyDirection(word,progress,index),deToSl=direction==='de-sl'
  function next(){setIndex(i=>i+1);setInput('');setFeedback('');setChecked(false);setCorrect(false);startedAt.current=Date.now()}
  function check(){if(!input.trim()||checked)return;const expected=deToSl?word.sl:word.de;const result=evaluateAnswer({input,expected,alternatives:[],locale:deToSl?'sl-SI':'de-DE'});const mistake=mistakeCategoryFromEvaluation(result);const exercise:Exercise={id:`vocab-test:${word.id}:${direction}${mistake?`:mistake:${mistake}`:''}`,lesson:word.lesson,type:'free',prompt:deToSl?word.de:word.sl,answer:expected,vocabularyIds:[word.id],evaluationMode:'grammar',skillTargets:[primarySkillForDirection(direction)],targetContentKeys:[`vocab:${word.id}`],mistakeCategory:mistake,learningPhase:deToSl?'active-production':'recognize'};onResult(exercise,result.isCorrect,{responseMs:Math.max(250,Date.now()-startedAt.current),hintsUsed:0});setCorrect(result.isCorrect);setChecked(true);setFeedback(result.isCorrect?'Richtig':result.explanation||`Richtig wäre: ${expected}`)}
  const body=<div className="exercise-shell"><div className="flex items-center justify-between text-[11px] font-bold"><button onClick={onExit} className="btn-quiet -ml-2">Zurück</button><span className="text-slate-400">{deToSl?'Deutsch → Slowenisch':'Slowenisch → Deutsch'}</span></div>{!checked?<div className="exercise-content"><div className="eyebrow text-center">Vokabeltest</div><h2 className="exercise-prompt mt-2 text-center">{deToSl?word.de:word.sl}</h2>{!deToSl&&<div className="mx-auto mt-2"><AudioButton text={word.sl} compact/></div>}<input value={input} onFocus={()=>document.documentElement.dataset.keyboardFocus='true'} onBlur={()=>delete document.documentElement.dataset.keyboardFocus} onChange={event=>setInput(event.target.value)} onKeyDown={event=>event.key==='Enter'&&check()} className="exercise-input mt-4 w-full border border-slate-200 bg-white" placeholder="Antwort …"/><button className="btn-primary mt-3 w-full" disabled={!input.trim()} onClick={check}>Prüfen</button></div>:<div className="exercise-content exercise-feedback" role="status" aria-live="polite">{correct?<CheckCircle2 className="mx-auto text-lime-700" size={38}/>:<XCircle className="mx-auto text-amber-700" size={38}/>}<div className="mt-2 text-2xl font-black">{correct?'Richtig':'Noch nicht'}</div>{!correct&&<div className="exercise-feedback-answer mt-3 text-base font-bold">{feedback}</div>}<button className="btn-primary mt-3 w-full" onClick={next}>Weiter</button></div>}</div>
  return <LearningFocusPortal label="Vokabeltest">{body}</LearningFocusPortal>
}

function ConjugationPractice({progress,onResult,onExit}:{progress:UserProgress;onResult:Props['onResult'];onExit:()=>void}){
  const candidates=rankIntroducedVerbForms(progress)
  const [round,setRound]=useState(0),[input,setInput]=useState(''),[checked,setChecked]=useState(false),[feedback,setFeedback]=useState(''),[correct,setCorrect]=useState(false)
  const startedAt=useRef(Date.now())
  if(!candidates.length)return <LearningFocusPortal><div className="exercise-shell"><div/><div className="exercise-feedback"><h2 className="text-xl font-black">Noch keine Verbformen freigeschaltet</h2><p className="mt-2 text-sm text-slate-500">Die Formen werden im Curriculum Schritt für Schritt eingeführt.</p><button className="btn-primary mt-3 w-full" onClick={onExit}>Zurück</button></div></div></LearningFocusPortal>
  const candidate=candidates[round%candidates.length],verbForms=candidates.filter(item=>item.verbId===candidate.verbId).map(item=>item.form),{form}=candidate
  function next(){setRound(value=>value+1);setInput('');setFeedback('');setChecked(false);setCorrect(false);startedAt.current=Date.now()}
  function check(){if(!input.trim()||checked)return;const result=evaluateAnswer({input,expected:form.form,locale:'sl-SI'});const sameForm=verbForms.find(x=>x.form.toLowerCase()===input.trim().toLowerCase());const mistake=result.isCorrect?undefined:(sameForm?conjugationMistakeCategory(form.number,sameForm.number):mistakeCategoryFromEvaluation(result)||'conjugation-error');const exercise:Exercise={id:`conj:${candidate.key}${mistake?`:mistake:${mistake}`:''}`,lesson:1,type:'free',prompt:`${candidate.infinitive} – ${form.pronoun}`,answer:form.form,evaluationMode:'grammar',skillTargets:['grammar-application','production'],verbPractice:true,requiredVerbForms:[{verbId:candidate.verbId,person:form.person,number:form.number}],targetContentKeys:[`verb:${candidate.key}`],mistakeCategory:mistake,learningPhase:'active-production'};onResult(exercise,result.isCorrect,{responseMs:Math.max(250,Date.now()-startedAt.current),hintsUsed:0});setCorrect(result.isCorrect);setChecked(true);setFeedback(result.isCorrect?'Richtig':sameForm&&sameForm.number!==form.number?`„${input}“ gehört zu ${sameForm.pronoun}. Für ${form.pronoun}: ${form.form}.`:result.explanation||`Richtig wäre: ${form.form}`)}
  const body=<div className="exercise-shell"><div className="flex items-center justify-between text-[11px] font-bold"><button onClick={onExit} className="btn-quiet -ml-2">Zurück</button><span className="text-slate-400">{form.number==='dual'?'Dual':form.number==='plural'?'Plural':'Singular'}</span></div>{!checked?<div className="exercise-content"><div className="eyebrow text-center">Konjugation</div><h2 className="mt-2 text-center text-3xl font-black">{candidate.infinitive}</h2><div className="mt-1 text-center text-sm text-slate-500">{candidate.translation}</div><div className="mx-auto mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center"><div className="text-xs font-bold text-slate-400">Bilde die Form für</div><div className="mt-1 text-xl font-black">{form.pronoun}</div></div><input value={input} onFocus={()=>document.documentElement.dataset.keyboardFocus='true'} onBlur={()=>delete document.documentElement.dataset.keyboardFocus} onChange={event=>setInput(event.target.value)} onKeyDown={event=>event.key==='Enter'&&check()} className="exercise-input mt-4 w-full border border-slate-200 bg-white" placeholder="Verbform …"/><button className="btn-primary mt-3 w-full" disabled={!input.trim()} onClick={check}>Prüfen</button></div>:<div className="exercise-content exercise-feedback" role="status" aria-live="polite">{correct?<CheckCircle2 className="mx-auto text-lime-700" size={38}/>:<XCircle className="mx-auto text-amber-700" size={38}/>}<div className="mt-2 text-2xl font-black">{correct?'Richtig':'Noch nicht'}</div>{!correct&&<div className="exercise-feedback-answer mt-3 text-sm font-bold leading-snug">{feedback}</div>}<button className="btn-primary mt-3 w-full" onClick={next}>Weiter</button></div>}</div>
  return <LearningFocusPortal label="Konjugationsübung">{body}</LearningFocusPortal>
}
