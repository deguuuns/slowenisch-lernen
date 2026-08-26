'use client'
import { useMemo,useRef,useState } from 'react'
import { CheckCircle2, Headphones, XCircle } from 'lucide-react'
import AudioButton from './AudioButton'
import ListeningPractice from './ListeningPractice'
import LearningFocusPortal from './LearningFocusPortal'
import { INPUT_STORIES } from '@/lib/input-content'
import { Exercise,UserProgress,Vocabulary } from '@/types'

type ResultMeta={responseMs:number;hintsUsed:number}
type Props={vocabulary:Vocabulary[];progress:UserProgress;onResult:(exercise:Exercise,correct:boolean,meta:ResultMeta)=>void}

export default function InputPractice({vocabulary,progress,onResult}:Props){
 const [section,setSection]=useState<'menu'|'listening'|'stories'>('menu')
 const knownWords=useMemo(()=>vocabulary.filter(word=>progress.wordsLearned.includes(word.id)||(progress.mastery?.[`vocab:${word.id}`]?.score??0)>=.5).flatMap(word=>[word.sl,word.lemma||'']).filter(Boolean),[vocabulary,progress.wordsLearned,progress.mastery])
 const known=useMemo(()=>new Set(knownWords.map(x=>x.toLowerCase())),[knownWords])
 const ranked=useMemo(()=>INPUT_STORIES.map(story=>({story,ratio:story.requiredWords.length?story.requiredWords.filter(w=>known.has(w.toLowerCase())).length/story.requiredWords.length:1})).sort((a,b)=>b.ratio-a.ratio),[known])

 if(section==='listening')return <ListeningPractice vocabulary={vocabulary} progress={progress} onResult={onResult}/>
 if(section==='stories')return <StoryFocus ranked={ranked} onResult={onResult} onExit={()=>setSection('menu')}/>
 return <div className="space-y-4"><div className="surface p-4"><div className="eyebrow">Verstehen</div><h2 className="mt-1 text-2xl font-black">Hören & Mini-Geschichten</h2><p className="mt-2 text-sm leading-6 text-slate-500">Wähle eine Übungsform. Sobald du startest, öffnet sich der ablenkungsfreie Lernmodus.</p></div><div className="grid gap-3 sm:grid-cols-2"><button onClick={()=>setSection('listening')} className="surface-interactive min-h-28 rounded-2xl border border-slate-200 bg-white p-4 text-left"><Headphones size={22} className="text-lime-700"/><div className="mt-3 font-black">Systematisches Hören</div><div className="mt-1 text-sm text-slate-500">Eine Hörfrage pro Schritt</div></button><button onClick={()=>setSection('stories')} className="surface-interactive min-h-28 rounded-2xl border border-slate-200 bg-white p-4 text-left"><div className="text-xl">📖</div><div className="mt-3 font-black">Mini-Geschichten</div><div className="mt-1 text-sm text-slate-500">Kontext verstehen und gezielt prüfen</div></button></div></div>
}

function StoryFocus({ranked,onResult,onExit}:{ranked:{story:(typeof INPUT_STORIES)[number];ratio:number}[];onResult:Props['onResult'];onExit:()=>void}){
 const [storyIndex,setStoryIndex]=useState(0),[questionIndex,setQuestionIndex]=useState(0),[showText,setShowText]=useState(true),[showTranslation,setShowTranslation]=useState(false),[answerValue,setAnswerValue]=useState<string|null>(null)
 const startedAt=useRef(Date.now())
 const current=ranked[storyIndex%Math.max(1,ranked.length)]||{story:INPUT_STORIES[0],ratio:0},s=current.story,q=s.questions[Math.min(questionIndex,Math.max(0,s.questions.length-1))]
 const correct=Boolean(q&&answerValue===q.answer)
 function answer(option:string){if(answerValue||!q)return;setAnswerValue(option);const isCorrect=option===q.answer;const exercise:Exercise={id:`input:${s.id}:${questionIndex}`,lesson:1,type:'choice',prompt:q.prompt,answer:q.answer,evaluationMode:'exact',skillTargets:showText?['recognition']:['listening'],targetContentKeys:[`skill:${showText?'recognition':'listening'}`],learningPhase:'recognize'};onResult(exercise,isCorrect,{responseMs:Math.max(250,Date.now()-startedAt.current),hintsUsed:showTranslation?1:0})}
 function next(){if(questionIndex<s.questions.length-1){setQuestionIndex(index=>index+1);setAnswerValue(null);setShowTranslation(false);startedAt.current=Date.now();return}setStoryIndex(index=>(index+1)%Math.max(1,ranked.length));setQuestionIndex(0);setAnswerValue(null);setShowText(true);setShowTranslation(false);startedAt.current=Date.now()}
 if(!q)return <LearningFocusPortal><div className="exercise-shell"><div/><div className="exercise-feedback"><h2 className="text-xl font-black">Keine Geschichte verfügbar</h2></div><div><button onClick={onExit} className="btn-primary w-full">Zurück</button></div></div></LearningFocusPortal>
 const body=<div className="exercise-shell"><div className="flex items-center justify-between gap-3 text-[11px] font-bold"><button onClick={onExit} className="btn-quiet -ml-2">Zurück</button><span className="text-slate-400">Frage {questionIndex+1}/{s.questions.length}</span></div>{!answerValue?<div className="exercise-content"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="eyebrow">{s.level} · {Math.round(current.ratio*100)}% bekannt</div><h2 className="mt-1 truncate text-xl font-black">{s.title}</h2></div><AudioButton text={s.text} compact/></div>{showText&&<div className="mt-3 max-h-28 overflow-hidden rounded-xl bg-slate-50 p-3 text-sm font-semibold leading-snug">{s.text}</div>}{showTranslation&&<div className="mt-3 max-h-24 overflow-hidden rounded-xl bg-slate-50 p-3 text-sm leading-snug text-slate-500">{s.translation}</div>}<div className="mt-3 flex gap-1.5"><button className="btn-quiet flex-1" onClick={()=>{setShowText(value=>!value);setShowTranslation(false)}}>{showText?'Nur hören':'Text'}</button><button className="btn-quiet flex-1" onClick={()=>{setShowTranslation(value=>!value);setShowText(false)}}>{showTranslation?'Deutsch aus':'Deutsch'}</button></div><div className="mt-3 text-lg font-black leading-tight">{q.prompt}</div><div className="exercise-choice-grid mt-2">{q.options.map(option=><button key={option} onClick={()=>answer(option)} className="exercise-choice surface-interactive border border-slate-200 bg-white text-left font-bold">{option}</button>)}</div></div>:<div className="exercise-content exercise-feedback" role="status" aria-live="polite">{correct?<CheckCircle2 className="mx-auto text-lime-700" size={38}/>:<XCircle className="mx-auto text-amber-700" size={38}/>}<div className="mt-2 text-2xl font-black">{correct?'Richtig':'Noch nicht'}</div>{!correct&&<div className="mt-3 text-base font-bold">Richtig: {q.answer}</div>}</div>}<div className="exercise-actions">{answerValue&&<button className="btn-primary w-full" onClick={next}>Weiter</button>}</div></div>
 return <LearningFocusPortal label="Mini-Geschichte">{body}</LearningFocusPortal>
}
