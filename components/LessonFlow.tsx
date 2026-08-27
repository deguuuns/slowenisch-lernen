'use client'

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import AudioButton from '@/components/AudioButton'
import ExerciseDeck, { ExerciseResultMeta } from '@/components/ExerciseDeck'
import LearningFocusPortal from '@/components/LearningFocusPortal'
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
const STAGE_PROGRESS:Record<Exclude<Stage,'final-exam'|'major-test'|'done'>,number>={'lesson-intro':0,'word-intro':.08,'verb-intro':.28,'verb-practice':.42,'grammar-intro':.55,'block-practice':.78,checkpoint:.94}
function blockSize(progress:UserProgress){return progress.preferences.pace==='ruhig'?2:3}

export default function LessonFlow({lessonId,progress,setProgress,onExerciseResult,onFinish,focusMode=true}:{lessonId:number;progress:UserProgress;setProgress:Dispatch<SetStateAction<UserProgress>>;onExerciseResult:(exercise:Exercise,correct:boolean,meta:ExerciseResultMeta)=>void;onFinish:()=>void;focusMode?:boolean}){
  const lesson=lessons.find(item=>item.id===lessonId)
  const [sessionSeed]=useState(()=>Date.now())
  // Internal batches only control how many new atoms are introduced at once. They are not separate lesson pools.
  const [blocks]=useState(()=>buildLearningBlocks(lessonId,vocabulary,exercises,progress.introducedWords,blockSize(progress)))
  const [stage,setStage]=useState<Stage>(blocks.length?'lesson-intro':'final-exam')
  const [blockIndex,setBlockIndex]=useState(0),[wordIndex,setWordIndex]=useState(0),[verbIndex,setVerbIndex]=useState(0),[grammarIndex,setGrammarIndex]=useState(0)
  const [activeSession,setActiveSession]=useState<ExerciseSession|null>(null)
  const block=blocks[blockIndex]
  const blockRuleIds=useMemo(()=>Array.from(new Set((block?.exercises||[]).flatMap(exercise=>exercise.grammarRuleIds||[]))),[block])
  const pendingRules=blockRuleIds.filter(id=>!progress.introducedGrammarRules.includes(id)&&grammarPrerequisitesMet(id,progress,blockRuleIds))
  const ruleCards=grammarDefinitions(pendingRules).filter(rule=>rule.id!=='verb-first-person')
  const currentRule=ruleCards[Math.min(grammarIndex,Math.max(0,ruleCards.length-1))]
  const blockVerbIntros=useMemo(()=>verbIntrosForVocabulary(block?.words.map(word=>word.id)||[]),[block])
  const currentVerb=blockVerbIntros[verbIndex]
  const percent=useMemo(()=>{if(stage==='done')return 100;if(stage==='major-test')return 98;if(stage==='final-exam')return 96;if(!blocks.length)return 90;return Math.min(95,Math.round(((blockIndex+STAGE_PROGRESS[stage])/blocks.length)*95))},[blockIndex,blocks.length,stage])

  useEffect(()=>{
    if(activeSession)return
    if(stage==='verb-practice'&&currentVerb){setActiveSession(createExerciseSession('verb-practice',buildVerbPracticeExercises(lessonId,currentVerb),`lesson-${lessonId}:batch-${blockIndex}:verb-${currentVerb.verbId}:${sessionSeed}`));return}
    if(stage==='block-practice'&&block){const deck=block.exercises.filter(exercise=>isExerciseEligible(exercise,progress,{allowVocabularyIds:block.words.map(word=>word.id),allowVerbForms:blockVerbIntros.flatMap(verb=>verb.keys)}));setActiveSession(createExerciseSession('learning-block',deck,`lesson-${lessonId}:batch-${blockIndex}:practice:${sessionSeed}`));return}
    if(stage==='checkpoint'){const deck=buildExamPlan({kind:'checkpoint',lessonId,exercises,vocabulary,progress,seed:sessionSeed+701,targetSize:examSize('checkpoint',progress,vocabulary.filter(word=>word.lesson===lessonId).length)});setActiveSession(createExerciseSession('checkpoint',deck,`lesson-${lessonId}:checkpoint:${sessionSeed}`));return}
    if(stage==='final-exam'){const deck=buildExamPlan({kind:'final',lessonId,exercises,vocabulary,progress,seed:sessionSeed+9001,targetSize:examSize('final',progress)});setActiveSession(createExerciseSession('final-exam',deck,`lesson-${lessonId}:final:${sessionSeed}`));return}
    if(stage==='major-test'){const deck=buildExamPlan({kind:'major',lessonId,exercises,vocabulary,progress,seed:sessionSeed+17001,targetSize:examSize('major',progress)});setActiveSession(createExerciseSession('major-test',deck,`lesson-${lessonId}:major:${sessionSeed}`))}
  },[activeSession,block,blockIndex,blockVerbIntros,currentVerb,lessonId,progress,sessionSeed,stage])

  if(!lesson)return null
  function markWord(id:string){setProgress(previous=>({...previous,introducedWords:Array.from(new Set([...previous.introducedWords,id])),updatedAt:Date.now()}))}
  function pendingVerbIndex(afterIndex:number){return blockVerbIntros.findIndex((verb,index)=>index>afterIndex&&verb.keys.some(key=>!progress.introducedVerbForms.includes(key)))}
  function nextAfterWordIntro(){setWordIndex(0);setActiveSession(null);const firstVerb=pendingVerbIndex(-1);if(firstVerb>=0){setVerbIndex(firstVerb);setStage('verb-intro')}else if(ruleCards.length){setGrammarIndex(0);setStage('grammar-intro')}else setStage('block-practice')}
  function nextWord(){if(!block)return;markWord(block.words[wordIndex].id);if(wordIndex<block.words.length-1)setWordIndex(index=>index+1);else nextAfterWordIntro()}
  function unlockCurrentVerb(){if(!currentVerb)return;setProgress(previous=>({...previous,introducedVerbForms:Array.from(new Set([...previous.introducedVerbForms,...currentVerb.keys])),introducedGrammarRules:Array.from(new Set([...previous.introducedGrammarRules,'verb-first-person'])),updatedAt:Date.now()}));setActiveSession(null);setStage('verb-practice')}
  function finishVerbPractice(){if(!currentVerb)return;setActiveSession(null);const nextVerb=pendingVerbIndex(verbIndex);if(nextVerb>=0){setVerbIndex(nextVerb);setStage('verb-intro')}else if(ruleCards.length){setGrammarIndex(0);setStage('grammar-intro')}else setStage('block-practice')}
  function nextGrammar(){if(grammarIndex<ruleCards.length-1){setGrammarIndex(index=>index+1);return}setProgress(previous=>({...previous,introducedGrammarRules:Array.from(new Set([...previous.introducedGrammarRules,...pendingRules])),updatedAt:Date.now()}));setActiveSession(null);setGrammarIndex(0);setStage('block-practice')}
  function finishBlockPractice(){
    setActiveSession(null)
    if(blockIndex<blocks.length-1){setBlockIndex(index=>index+1);setWordIndex(0);setVerbIndex(0);setGrammarIndex(0);setStage('word-intro')}
    else setStage('checkpoint')
  }
  function recordCurrentExam(kind:'checkpoint'|'final'|'major'){if(!activeSession)return;const item=historyItemFromExercises(activeSession.sessionId,kind,lessonId,activeSession.exercises);setProgress(previous=>({...previous,examHistory:appendExamHistory(previous.examHistory,item),updatedAt:Date.now()}))}
  function finishCheckpoint(){recordCurrentExam('checkpoint');setActiveSession(null);setStage('final-exam')}
  function finishFinalExam(){recordCurrentExam('final');setActiveSession(null);if(lessonId%MAJOR_TEST_CONFIG.lessonsPerTest===0)setStage('major-test');else setStage('done')}
  function finishMajorTest(){recordCurrentExam('major');setActiveSession(null);setStage('done')}

  const header=<div className="lesson-focus-status"><button type="button" onClick={onFinish} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Lektion verlassen"><ChevronLeft size={20}/></button><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="truncate text-xs font-black">Lektion {lesson.id} · {lesson.title}</span><span className="shrink-0 text-[11px] font-bold text-slate-400">{percent}%</span></div><div className="progress-track mt-1"><div className="progress-fill" style={{width:`${percent}%`}}/></div></div></div></div>

  let active:React.ReactNode=null
  if(stage==='lesson-intro') active=<LessonStep><div className="eyebrow">Neue Lektion</div><h2 className="mt-2 text-3xl font-black tracking-tight">{lesson.title}</h2><p className="mt-2 max-w-md text-sm leading-5 text-slate-500">{lesson.subtitle}</p><button onClick={()=>setStage('word-intro')} className="btn-primary mt-5 w-full">Los geht’s <ChevronRight size={18}/></button></LessonStep>
  if(stage==='word-intro'&&block){const word=block.words[wordIndex];active=<LessonStep><div className="flex items-center justify-between gap-3 text-[11px] font-bold"><span className="text-lime-700">Neuer Baustein</span><span className="text-slate-400">{wordIndex+1}/{block.words.length}</span></div><div className="mt-4 flex items-start justify-between gap-4"><div className="min-w-0"><h2 className="break-words text-4xl font-black tracking-tight [overflow-wrap:anywhere]">{word.sl}</h2><div className="mt-1 text-lg font-semibold text-slate-500">{word.de}</div></div><AudioButton text={word.sl} compact/></div>{word.usageNote&&<div className="mt-4 rounded-xl bg-lime-50 p-3 text-sm leading-5 text-slate-700">{word.usageNote}</div>}{word.introExample&&word.example&&<div className="mt-3 rounded-xl bg-slate-50 p-3"><div className="text-sm font-bold leading-snug">{word.example}</div><div className="mt-1 text-xs leading-snug text-slate-500">{word.exampleDe}</div></div>}<button onClick={nextWord} className="btn-primary mt-4 w-full">{wordIndex===block.words.length-1?'Weiter':'Nächster Baustein'} <ChevronRight size={18}/></button></LessonStep>}
  if(stage==='verb-intro'&&currentVerb){const form=currentVerb.forms[0];active=<LessonStep><div className="eyebrow">Verbform verstehen</div><div className="mt-3 flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words text-3xl font-black">{currentVerb.infinitiveSl}</h2><div className="text-sm text-slate-500">{currentVerb.infinitiveDe}</div></div><AudioButton text={currentVerb.infinitiveSl} compact/></div>{form&&<div className="mt-4 rounded-xl bg-slate-50 px-3 py-3"><div className="text-lg font-black">{form.pronounSl} {form.formSl}</div><div className="mt-1 text-sm text-slate-500">{form.translationDe}</div></div>}<button onClick={unlockCurrentVerb} className="btn-primary mt-4 w-full">Diese Form üben <ChevronRight size={18}/></button></LessonStep>}
  if(stage==='grammar-intro'&&currentRule) active=<LessonStep><div className="flex items-center justify-between gap-3"><div className="eyebrow">Muster erkennen</div><div className="text-[11px] font-bold text-slate-400">{grammarIndex+1}/{ruleCards.length}</div></div><h2 className="mt-3 text-2xl font-black leading-tight">{currentRule.title}</h2><p className="mt-3 text-sm leading-5 text-slate-600">{currentRule.body}</p><div className="mt-3 rounded-xl bg-lime-50 p-3">{currentRule.examples.slice(0,2).map(example=><div key={example} className="text-sm font-bold leading-snug">{example}</div>)}</div><button onClick={nextGrammar} className="btn-primary mt-4 w-full">{grammarIndex<ruleCards.length-1?'Nächste Regel':'Jetzt anwenden'} <ChevronRight size={18}/></button></LessonStep>
  if(stage==='verb-practice'&&currentVerb&&activeSession) active=<ExerciseDeck key={activeSession.sessionId} session={activeSession} onResult={onExerciseResult} onComplete={finishVerbPractice} focusMode={false}/>
  if(stage==='block-practice'&&activeSession) active=activeSession.exercises.length?<ExerciseDeck key={activeSession.sessionId} session={activeSession} onResult={onExerciseResult} onComplete={finishBlockPractice} focusMode={false}/>:<SkipStep title="Diese Bausteine sitzen" onNext={finishBlockPractice}/>
  if(stage==='checkpoint'&&activeSession) active=activeSession.exercises.length?<ExerciseDeck key={activeSession.sessionId} session={activeSession} onResult={onExerciseResult} onComplete={finishCheckpoint} focusMode={false}/>:<SkipStep title="Lektionscheck übersprungen" onNext={finishCheckpoint}/>
  if(stage==='final-exam'&&activeSession) active=activeSession.exercises.length?<ExerciseDeck key={activeSession.sessionId} session={activeSession} onResult={onExerciseResult} onComplete={finishFinalExam} focusMode={false}/>:<SkipStep title="Lektion bereit zum Abschluss" onNext={finishFinalExam}/>
  if(stage==='major-test'&&activeSession) active=activeSession.exercises.length?<ExerciseDeck key={activeSession.sessionId} session={activeSession} onResult={onExerciseResult} onComplete={finishMajorTest} focusMode={false}/>:<SkipStep title="Großer Test noch nicht nötig" onNext={()=>setStage('done')}/>
  if(stage==='done') active=<LessonStep center><CheckCircle2 className="mx-auto text-lime-700" size={40}/><div className="eyebrow mt-4">100%</div><h2 className="mt-1 text-3xl font-black">Lektion geschafft</h2><p className="mt-2 text-sm text-slate-500">Unsichere Inhalte werden später gezielt wiederholt.</p><button onClick={onFinish} className="btn-primary mt-5 w-full">Lektion abschließen</button></LessonStep>

  const content=<div className="lesson-focus-flow">{header}<div className="lesson-focus-content">{active}</div></div>
  return <LearningFocusPortal enabled={focusMode} label={`Lektion ${lesson.id}`}>{content}</LearningFocusPortal>
}

function LessonStep({children,center=false}:{children:React.ReactNode;center?:boolean}){return <div className={`lesson-focus-step ${center?'text-center':''}`}>{children}</div>}
function SkipStep({title,onNext}:{title:string;onNext:()=>void}){return <LessonStep center><div className="text-3xl">✓</div><h3 className="mt-2 text-xl font-black">{title}</h3><button onClick={onNext} className="btn-primary mt-4 w-full">Weiter</button></LessonStep>}
