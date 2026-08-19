'use client'

import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import AudioButton from '@/components/AudioButton'
import ExerciseDeck from '@/components/ExerciseDeck'
import { exercises, lessons, vocabulary } from '@/data/seed'
import { buildFinalReview, buildLearningBlocks, lessonProgress } from '@/lib/learning-flow'
import { Exercise, UserProgress } from '@/types'

type Stage='intro'|'learn'|'practice'|'grammar'|'final'|'done'

export default function LessonFlow({lessonId,progress,setProgress,onExerciseResult,onFinish}:{lessonId:number;progress:UserProgress;setProgress:(f:any)=>void;onExerciseResult:(e:Exercise,c:boolean)=>void;onFinish:()=>void}) {
  const lesson=lessons.find(l=>l.id===lessonId)!
  const blocks=useMemo(()=>buildLearningBlocks(lessonId,vocabulary,exercises,progress.introducedWords),[lessonId,progress.introducedWords])
  const [stage,setStage]=useState<Stage>(blocks.length?'intro':'grammar')
  const [blockIndex,setBlockIndex]=useState(0)
  const [wordIndex,setWordIndex]=useState(0)
  const block=blocks[blockIndex]
  const finalReview=buildFinalReview(lessonId,exercises)
  const percent=stage==='done'?100:lessonProgress(blockIndex,Math.max(1,blocks.length),stage==='practice'?1:0,2)

  function markWord(id:string) {
    setProgress((p:UserProgress)=>({...p,introducedWords:Array.from(new Set([...p.introducedWords,id]))}))
  }

  function nextWord() {
    if(!block) return
    markWord(block.words[wordIndex].id)
    if(wordIndex<block.words.length-1) setWordIndex(wordIndex+1)
    else { setWordIndex(0); setStage('practice') }
  }

  function nextBlock() {
    if(blockIndex<blocks.length-1) { setBlockIndex(blockIndex+1); setWordIndex(0); setStage('learn') }
    else setStage('grammar')
  }

  if(!lesson) return null

  return <div className="space-y-5">
    <div className="card">
      <div className="flex items-center justify-between gap-3"><div className="text-sm font-bold text-lime-700">Lektion {lesson.id}</div><div className="text-sm font-bold text-slate-500">{percent}%</div></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-lime-400 transition-all" style={{width:`${percent}%`}}/></div>
      <h2 className="mt-4 text-3xl font-black">{lesson.title}</h2><p className="mt-2 text-slate-600">{lesson.subtitle}</p>
    </div>

    {stage==='intro'&&<div className="card"><h3 className="text-xl font-black">Heute lernst du in kleinen Portionen</h3><p className="mt-2 text-slate-600">Maximal drei neue Wörter, danach sofort passende Aufgaben. Bereits bekannte Wörter werden dabei wieder eingestreut.</p><button onClick={()=>setStage('learn')} className="btn-primary mt-5">Los geht’s <ChevronRight size={18}/></button></div>}

    {stage==='learn'&&block&&<div className="card">
      <div className="text-sm font-bold text-lime-700">Lernblock {blockIndex+1} von {blocks.length} · Wort {wordIndex+1} von {block.words.length}</div>
      <div className="mt-5 flex items-start gap-4"><AudioButton text={block.words[wordIndex].sl}/><div><div className="text-3xl font-black">{block.words[wordIndex].sl}</div><div className="mt-1 text-lg text-slate-600">{block.words[wordIndex].de}</div><div className="mt-4 rounded-2xl bg-slate-50 p-4"><b>{block.words[wordIndex].example}</b><div className="mt-1 text-sm text-slate-500">{block.words[wordIndex].exampleDe}</div></div></div></div>
      <button onClick={nextWord} className="btn-primary mt-5 w-full justify-center">{wordIndex===block.words.length-1?'Jetzt anwenden':'Nächstes Wort'} <ChevronRight size={18}/></button>
    </div>}

    {stage==='practice'&&block&&<ExerciseDeck exercises={block.exercises} onResult={onExerciseResult} onComplete={nextBlock}/>} 

    {stage==='grammar'&&<div className="card"><div className="text-sm font-bold text-lime-700">Jetzt ergibt die Grammatik Sinn</div><h3 className="mt-1 text-2xl font-black">{lesson.grammar.title}</h3><p className="mt-3 text-slate-600">{lesson.grammar.body}</p><div className="mt-4 space-y-2">{lesson.grammar.examples.map(e=><div key={e} className="rounded-2xl bg-lime-50 p-3 font-semibold">{e}</div>)}</div><button onClick={()=>setStage('final')} className="btn-primary mt-5">Zum Abschlusstest <ChevronRight size={18}/></button></div>}

    {stage==='final'&&<><div className="card"><div className="text-sm font-bold text-lime-700">Gemischter Abschluss</div><h3 className="mt-1 text-2xl font-black">Zeig, was hängen geblieben ist</h3><p className="mt-2 text-slate-600">Neue und ältere Strukturen werden jetzt ohne erneute Einführung abgefragt.</p></div><ExerciseDeck exercises={finalReview} onResult={onExerciseResult} onComplete={()=>setStage('done')}/></>}

    {stage==='done'&&<div className="card text-center"><div className="text-sm font-bold text-lime-700">100 %</div><h3 className="mt-2 text-3xl font-black">Lektion geschafft</h3><p className="mt-2 text-slate-600">Fehlerhafte Inhalte landen automatisch früher in deinen Wiederholungen.</p><button onClick={onFinish} className="btn-primary mt-5 justify-center">Lektion abschließen</button></div>}
  </div>
}
