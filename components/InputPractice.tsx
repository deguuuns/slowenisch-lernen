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
 const [storyIndex,setStoryIndex]=useState(0),[questionIndex,setQuestionIndex]=useState(0),[overlay,setOverlay]=useState<'text'|'translation'|null>(null),[usedText,setUsedText]=useState(false),[usedTranslation,setUsedTranslation]=useState(false),[answerValue,setAnswerValue]=useState<string|null>(null),[checked,setChecked]=useState(false)
 const startedAt=useRef(Date.now())
 const current=ranked[storyIndex%Math.max(1,ranked.length)]||{story:INPUT_STORIES[0],ratio:0},s=current.story,q=s.questions[Math.min(questionIndex,Math.max(0,s.questions.length-1))]
 const correct=Boolean(q&&answerValue===q.answer)
 function choose(option:string){if(checked||!q)return;setAnswerValue(option)}
 function submit(){if(!answerValue||checked||!q)return;setChecked(true);const isCorrect=answerValue===q.answer;const exercise:Exercise={id:`input:${s.id}:${questionIndex}`,lesson:1,type:'choice',prompt:q.prompt,answer:q.answer,evaluationMode:'exact',skillTargets:usedText?['recognition']:['listening'],targetContentKeys:[`skill:${usedText?'recognition':'listening'}`],learningPhase:'recognize'};onResult(exercise,isCorrect,{responseMs:Math.max(250,Date.now()-startedAt.current),hintsUsed:(usedText?1:0)+(usedTranslation?1:0)})}
 function reset(){setAnswerValue(null);setChecked(false);setOverlay(null);setUsedText(false);setUsedTranslation(false);startedAt.current=Date.now()}
 function next(){if(questionIndex<s.questions.length-1){setQuestionIndex(index=>index+1);reset();return}setStoryIndex(index=>(index+1)%Math.max(1,ranked.length));setQuestionIndex(0);reset()}
 function openText(){setUsedText(true);setOverlay('text')}
 function openTranslation(){setUsedTranslation(true);setOverlay('translation')}
 if(!q)return <LearningFocusPortal><div className="exercise-shell"><div/><div className="exercise-feedback"><h2 className="text-xl font-black">Keine Geschichte verfügbar</h2></div><div><button onClick={onExit} className="btn-primary w-full">Zurück</button></div></div></LearningFocusPortal>
 const body=<div className="exercise-shell"><div className="flex items-center justify-between gap-3 text-[11px] font-bold"><button onClick={onExit} className="btn-quiet -ml-2">Zurück</button><span className="text-slate-400">Frage {questionIndex+1}/{s.questions.length}</span></div>{!checked?<div className="exercise-content"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="eyebrow">{s.level} · {Math.round(current.ratio*100)}% bekannt</div><h2 className="mt-1 text-lg font-black leading-tight">{s.title}</h2></div><AudioButton text={s.text} compact/></div><div className="mt-2 flex gap-1.5"><button className="btn-quiet flex-1" onClick={openText}>Text</button><button className="btn-quiet flex-1" onClick={openTranslation}>Deutsch</button></div><div className="mt-3 text-lg font-black leading-tight">{q.prompt}</div><div className="exercise-choice-grid mt-2">{q.options.map(option=>{const selected=answerValue===option;return <button key={option} type="button" aria-pressed={selected} onClick={()=>choose(option)} className={`exercise-choice surface-interactive border text-left font-bold ${selected?'border-lime-500 bg-lime-50 ring-2 ring-lime-100':'border-slate-200 bg-white'}`}>{option}</button>})}</div><button className="btn-primary mt-3 w-full" disabled={!answerValue} onClick={submit}>Prüfen</button></div>:<div className="exercise-content exercise-feedback" role="status" aria-live="polite">{correct?<CheckCircle2 className="mx-auto text-lime-700" size={38}/>:<XCircle className="mx-auto text-amber-700" size={38}/>}<div className="mt-2 text-2xl font-black">{correct?'Richtig':'Noch nicht'}</div>{!correct&&<div className="mt-3 text-base font-bold">Richtig: {q.answer}</div>}<button className="btn-primary mt-3 w-full" onClick={next}>Weiter</button></div>}{overlay&&<div className="exercise-overlay" role="dialog" aria-label={overlay==='text'?'Geschichtentext':'Deutsche Übersetzung'}><div className="eyebrow">{overlay==='text'?'Geschichtentext':'Übersetzung'}</div><div className="mt-3 text-base font-semibold leading-7">{overlay==='text'?s.text:s.translation}</div><button className="btn-primary mt-5 w-full" onClick={()=>setOverlay(null)}>Zur Frage</button></div>}</div>
 return <LearningFocusPortal label="Mini-Geschichte">{body}</LearningFocusPortal>
}
