'use client'

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import AudioButton from '@/components/AudioButton'
import ExerciseDeck, { ExerciseResultMeta } from '@/components/ExerciseDeck'
import { exercises, lessons, vocabulary } from '@/data/curriculum'
import { grammarDefinitions, grammarPrerequisitesMet, isExerciseEligible } from '@/lib/curriculum-access'
import { buildExamPlan, examSize } from '@/lib/exam-planner'
import { appendExamHistory, historyItemFromExercises } from '@/lib/exam-history'
import { createExerciseSession, ExerciseSession } from '@/lib/exercise-session'
import { MAJOR_TEST_CONFIG } from '@/lib/learning-config'
import { buildLearningBlocks } from '@/lib/learning-flow'
import { buildVerbPracticeExercises, verbIntrosForVocabulary } from '@/lib/verb-learning'
import { Exercise, UserProgress } from '@/types'

type Stage='lesson-intro'|'word-intro'|'verb-intro'|'verb-practice'|'grammar-intro'|'block-practice'|'checkpoint'|'final-exam'|'major-test'|'done'
const STAGE_PROGRESS:Record<Exclude<Stage,'final-exam'|'major-test'|'done'>,number>={'lesson-intro':0,'word-intro':.08,'verb-intro':.28,'verb-practice':.42,'grammar-intro':.55,'block-practice':.72,checkpoint:.94}
function blockSize(progress:UserProgress){return progress.preferences.pace==='ruhig'?2:3}

export default function LessonFlow({lessonId,progress,setProgress,onExerciseResult,onFinish}:{lessonId:number;progress:UserProgress;setProgress:Dispatch<SetStateAction<UserProgress>>;onExerciseResult:(exercise:Exercise,correct:boolean,meta:ExerciseResultMeta)=>void;onFinish:()=>void}){
  const lesson=lessons.find(item=>item.id===lessonId)
  const [sessionSeed]=useState(()=>Date.now())
  const [blocks]=useState(()=>buildLearningBlocks(lessonId,vocabulary,exercises,progress.introducedWords,blockSize(progress)))
  const [stage,setStage]=useState<Stage>(blocks.length?'lesson-intro':'final-exam')
  const [blockIndex,setBlockIndex]=useState(0),[wordIndex,setWordIndex]=useState(0),[verbIndex,setVerbIndex]=useState(0)
  const [activeSession,setActiveSession]=useState<ExerciseSession|null>(null)
  const block=blocks[blockIndex]
  const blockRuleIds=useMemo(()=>Array.from(new Set((block?.exercises||[]).flatMap(exercise=>exercise.grammarRuleIds||[]))),[block])
  const pendingRules=blockRuleIds.filter(id=>!progress.introducedGrammarRules.includes(id)&&grammarPrerequisitesMet(id,progress,blockRuleIds))
  const ruleCards=grammarDefinitions(pendingRules).filter(rule=>rule.id!=='verb-first-person')
  const blockVerbIntros=useMemo(()=>verbIntrosForVocabulary(block?.words.map(word=>word.id)||[]),[block])
  const currentVerb=blockVerbIntros[verbIndex]
  const percent=useMemo(()=>{if(stage==='done')return 100;if(stage==='major-test')return 98;if(stage==='final-exam')return 96;if(!blocks.length)return 90;return Math.min(95,Math.round(((blockIndex+STAGE_PROGRESS[stage])/blocks.length)*95))},[blockIndex,blocks.length,stage])

  useEffect(()=>{
    if(activeSession)return
    if(stage==='verb-practice'&&currentVerb){setActiveSession(createExerciseSession('verb-practice',buildVerbPracticeExercises(lessonId,currentVerb),`lesson-${lessonId}:block-${blockIndex}:verb-${currentVerb.verbId}:${sessionSeed}`));return}
    if(stage==='block-practice'&&block){const deck=block.exercises.filter(exercise=>isExerciseEligible(exercise,progress));setActiveSession(createExerciseSession('learning-block',deck,`lesson-${lessonId}:block-${blockIndex}:practice:${sessionSeed}`));return}
    if(stage==='checkpoint'&&block){const deck=buildExamPlan({kind:'checkpoint',lessonId,exercises,vocabulary,progress,seed:sessionSeed+blockIndex*101,targetSize:examSize('checkpoint',progress,block.words.length)});setActiveSession(createExerciseSession('checkpoint',deck,`lesson-${lessonId}:block-${blockIndex}:checkpoint:${sessionSeed}`));return}
    if(stage==='final-exam'){const deck=buildExamPlan({kind:'final',lessonId,exercises,vocabulary,progress,seed:sessionSeed+9001,targetSize:examSize('final',progress)});setActiveSession(createExerciseSession('final-exam',deck,`lesson-${lessonId}:final:${sessionSeed}`));return}
    if(stage==='major-test'){const deck=buildExamPlan({kind:'major',lessonId,exercises,vocabulary,progress,seed:sessionSeed+17001,targetSize:examSize('major',progress)});setActiveSession(createExerciseSession('major-test',deck,`lesson-${lessonId}:major:${sessionSeed}`))}
  },[activeSession,block,blockIndex,currentVerb,lessonId,progress,sessionSeed,stage])

  if(!lesson)return null
  function markWord(id:string){setProgress(previous=>({...previous,introducedWords:Array.from(new Set([...previous.introducedWords,id])),updatedAt:Date.now()}))}
  function pendingVerbIndex(afterIndex:number){return blockVerbIntros.findIndex((verb,index)=>index>afterIndex&&verb.keys.some(key=>!progress.introducedVerbForms.includes(key)))}
  function nextAfterWordIntro(){setWordIndex(0);setActiveSession(null);const firstVerb=pendingVerbIndex(-1);if(firstVerb>=0){setVerbIndex(firstVerb);setStage('verb-intro')}else if(ruleCards.length)setStage('grammar-intro');else setStage('block-practice')}
  function nextWord(){if(!block)return;markWord(block.words[wordIndex].id);if(wordIndex<block.words.length-1)setWordIndex(index=>index+1);else nextAfterWordIntro()}
  function unlockCurrentVerb(){if(!currentVerb)return;setProgress(previous=>({...previous,introducedVerbForms:Array.from(new Set([...previous.introducedVerbForms,...currentVerb.keys])),introducedGrammarRules:Array.from(new Set([...previous.introducedGrammarRules,'verb-first-person'])),updatedAt:Date.now()}));setActiveSession(null);setStage('verb-practice')}
  function finishVerbPractice(){if(!currentVerb)return;setActiveSession(null);const nextVerb=pendingVerbIndex(verbIndex);if(nextVerb>=0){setVerbIndex(nextVerb);setStage('verb-intro')}else if(ruleCards.length)setStage('grammar-intro');else setStage('block-practice')}
  function unlockGrammar(){setProgress(previous=>({...previous,introducedGrammarRules:Array.from(new Set([...previous.introducedGrammarRules,...pendingRules])),updatedAt:Date.now()}));setActiveSession(null);setStage('block-practice')}
  function finishBlockPractice(){setActiveSession(null);setStage('checkpoint')}
  function recordCurrentExam(kind:'checkpoint'|'final'|'major'){if(!activeSession)return;const item=historyItemFromExercises(activeSession.sessionId,kind,lessonId,activeSession.exercises);setProgress(previous=>({...previous,examHistory:appendExamHistory(previous.examHistory,item),updatedAt:Date.now()}))}
  function finishCheckpoint(){recordCurrentExam('checkpoint');setActiveSession(null);if(blockIndex<blocks.length-1){setBlockIndex(index=>index+1);setWordIndex(0);setVerbIndex(0);setStage('word-intro')}else setStage('final-exam')}
  function finishFinalExam(){recordCurrentExam('final');setActiveSession(null);if(lessonId%MAJOR_TEST_CONFIG.lessonsPerTest===0)setStage('major-test');else setStage('done')}
  function finishMajorTest(){recordCurrentExam('major');setActiveSession(null);setStage('done')}

  return <div className="space-y-3">
    <div className="surface px-4 py-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="text-xs font-bold text-lime-700">Lektion {lesson.id}</div><div className="truncate text-sm font-black">{lesson.title}</div></div><div className="shrink-0 text-xs font-black text-slate-400">{percent}%</div></div><div className="progress-track mt-2"><div className="progress-fill" style={{width:`${percent}%`}}/></div></div>

    {stage==='lesson-intro'&&<Step><div className="eyebrow">Neue Lektion</div><h2 className="mt-2 text-3xl font-black tracking-tight">{lesson.title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{lesson.subtitle}</p><p className="mt-4 text-sm leading-6 text-slate-600">Du lernst neue Wörter und Formen in kleinen Portionen und wendest sie direkt danach an.</p><button onClick={()=>setStage('word-intro')} className="btn-primary mt-5 w-full">Los geht’s <ChevronRight size={18}/></button></Step>}

    {stage==='word-intro'&&block&&<Step><div className="flex items-center justify-between gap-3 text-xs font-bold"><span className="text-lime-700">Neues Wort</span><span className="text-slate-400">{wordIndex+1}/{block.words.length}</span></div><div className="mt-5 flex items-start justify-between gap-4"><div className="min-w-0"><h2 className="break-words text-4xl font-black tracking-tight [overflow-wrap:anywhere]">{block.words[wordIndex].sl}</h2><div className="mt-1 text-lg text-slate-500">{block.words[wordIndex].de}</div></div><AudioButton text={block.words[wordIndex].sl} compact/></div><div className="mt-5 rounded-2xl bg-slate-50 p-4"><div className="font-bold">{block.words[wordIndex].example}</div><div className="mt-1 text-sm text-slate-500">{block.words[wordIndex].exampleDe}</div></div><button onClick={nextWord} className="btn-primary mt-5 w-full">{wordIndex===block.words.length-1?'Weiter':'Nächstes Wort'} <ChevronRight size={18}/></button></Step>}

    {stage==='verb-intro'&&currentVerb&&<Step><div className="eyebrow">Neues Verb</div><div className="mt-3 flex items-start justify-between gap-4"><div><h2 className="text-3xl font-black">{currentVerb.infinitiveSl}</h2><div className="text-slate-500">{currentVerb.infinitiveDe}</div></div><AudioButton text={currentVerb.infinitiveSl} compact/></div><div className="mt-5 space-y-2">{currentVerb.forms.map(form=><div key={form.person} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"><div><div className="font-black">{form.pronounSl} {form.formSl}</div><div className="text-xs text-slate-500">{form.translationDe}</div></div><AudioButton text={`${form.pronounSl.split(' / ')[0]} ${form.formSl}`} compact/></div>)}</div>{currentVerb.examples.length>0&&<details className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm"><summary className="cursor-pointer font-black">Beispiele anzeigen</summary><div className="mt-2 space-y-2">{currentVerb.examples.map(example=><div key={example.sl}><b>{example.sl}</b><div className="text-slate-500">{example.de}</div></div>)}</div></details>}<button onClick={unlockCurrentVerb} className="btn-primary mt-5 w-full">Konjugation üben <ChevronRight size={18}/></button></Step>}

    {stage==='grammar-intro'&&<Step><div className="eyebrow">Neue Grammatik</div><h2 className="mt-2 text-2xl font-black">Kurz verstehen, dann anwenden</h2><div className="mt-4 space-y-3">{ruleCards.map(rule=><details key={rule.id} className="rounded-2xl bg-lime-50 p-4" open={ruleCards.length===1}><summary className="cursor-pointer font-black">{rule.title}</summary><p className="mt-2 text-sm leading-6 text-slate-600">{rule.body}</p><div className="mt-2 space-y-1 text-sm font-semibold">{rule.examples.map(example=><div key={example}>{example}</div>)}</div></details>)}</div><button onClick={unlockGrammar} className="btn-primary mt-5 w-full">Jetzt anwenden <ChevronRight size={18}/></button></Step>}

    {stage==='verb-practice'&&currentVerb&&activeSession&&<SessionStep label={`Konjugation · ${currentVerb.infinitiveSl}`}><ExerciseDeck key={activeSession.sessionId} session={activeSession} onResult={onExerciseResult} onComplete={finishVerbPractice}/></SessionStep>}
    {stage==='block-practice'&&activeSession&&(activeSession.exercises.length?<SessionStep label="Üben"><ExerciseDeck key={activeSession.sessionId} session={activeSession} onResult={onExerciseResult} onComplete={finishBlockPractice}/></SessionStep>:<SkipCard title="Keine weitere Übung nötig" onNext={finishBlockPractice}/>)}
    {stage==='checkpoint'&&activeSession&&(activeSession.exercises.length?<SessionStep label="Zwischenprüfung"><ExerciseDeck key={activeSession.sessionId} session={activeSession} onResult={onExerciseResult} onComplete={finishCheckpoint}/></SessionStep>:<SkipCard title="Zwischenprüfung übersprungen" onNext={finishCheckpoint}/>)}
    {stage==='final-exam'&&activeSession&&(activeSession.exercises.length?<SessionStep label="Abschlussprüfung"><ExerciseDeck key={activeSession.sessionId} session={activeSession} onResult={onExerciseResult} onComplete={finishFinalExam}/></SessionStep>:<SkipCard title="Lektion bereit zum Abschluss" onNext={finishFinalExam}/>)}
    {stage==='major-test'&&activeSession&&(activeSession.exercises.length?<SessionStep label={`Großer Test · Lektionen ${Math.max(1,lessonId-MAJOR_TEST_CONFIG.lessonsPerTest+1)}–${lessonId}`}><ExerciseDeck key={activeSession.sessionId} session={activeSession} onResult={onExerciseResult} onComplete={finishMajorTest}/></SessionStep>:<SkipCard title="Großer Test noch nicht nötig" onNext={()=>setStage('done')}/>)}

    {stage==='done'&&<Step center><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime-100 text-lime-800"><CheckCircle2 size={28}/></div><div className="eyebrow mt-4">100%</div><h2 className="mt-1 text-3xl font-black">Lektion geschafft</h2><p className="mt-2 text-sm leading-6 text-slate-500">Unsichere Inhalte kommen früher wieder, sichere mit größerem Abstand.</p><button onClick={onFinish} className="btn-primary mt-5 w-full">Lektion abschließen</button></Step>}
  </div>
}

function Step({children,center=false}:{children:React.ReactNode;center?:boolean}){return <div className={`surface p-4 sm:p-5 ${center?'text-center':''}`}>{children}</div>}
function SessionStep({label,children}:{label:string;children:React.ReactNode}){return <div className="space-y-2"><div className="px-1 text-xs font-black uppercase tracking-wide text-slate-400">{label}</div>{children}</div>}
function SkipCard({title,onNext}:{title:string;onNext:()=>void}){return <div className="surface p-5 text-center"><div className="text-2xl">✓</div><h3 className="mt-2 text-lg font-black">{title}</h3><button onClick={onNext} className="btn-primary mt-4 w-full">Weiter</button></div>}
