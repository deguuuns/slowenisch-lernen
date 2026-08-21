'use client'

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import AudioButton from '@/components/AudioButton'
import ExerciseDeck, { ExerciseResultMeta } from '@/components/ExerciseDeck'
import { exercises, lessons, vocabulary } from '@/data/seed'
import { grammarDefinitions, grammarPrerequisitesMet, isExerciseEligible } from '@/lib/curriculum-access'
import { buildExamPlan, examSize } from '@/lib/exam-planner'
import { appendExamHistory, historyItemFromExercises } from '@/lib/exam-history'
import { createExerciseSession, ExerciseSession } from '@/lib/exercise-session'
import { MAJOR_TEST_CONFIG } from '@/lib/learning-config'
import { buildLearningBlocks } from '@/lib/learning-flow'
import { buildVerbPracticeExercises, verbIntrosForVocabulary } from '@/lib/verb-learning'
import { Exercise, UserProgress } from '@/types'

type Stage =
  | 'lesson-intro'
  | 'word-intro'
  | 'verb-intro'
  | 'verb-practice'
  | 'grammar-intro'
  | 'block-practice'
  | 'checkpoint'
  | 'final-exam'
  | 'major-test'
  | 'done'

const STAGE_PROGRESS: Record<Exclude<Stage, 'final-exam' | 'major-test' | 'done'>, number> = {
  'lesson-intro': 0,
  'word-intro': .08,
  'verb-intro': .28,
  'verb-practice': .42,
  'grammar-intro': .55,
  'block-practice': .72,
  checkpoint: .94,
}

function blockSize(progress: UserProgress) {
  return progress.preferences.pace === 'ruhig' ? 2 : 3
}

export default function LessonFlow({ lessonId, progress, setProgress, onExerciseResult, onFinish }: {
  lessonId: number
  progress: UserProgress
  setProgress: Dispatch<SetStateAction<UserProgress>>
  onExerciseResult: (exercise: Exercise, correct: boolean, meta: ExerciseResultMeta) => void
  onFinish: () => void
}) {
  const lesson = lessons.find(item => item.id === lessonId)
  const [sessionSeed] = useState(() => Date.now())
  const [blocks] = useState(() => buildLearningBlocks(lessonId, vocabulary, exercises, progress.introducedWords, blockSize(progress)))
  const [stage, setStage] = useState<Stage>(blocks.length ? 'lesson-intro' : 'final-exam')
  const [blockIndex, setBlockIndex] = useState(0)
  const [wordIndex, setWordIndex] = useState(0)
  const [verbIndex, setVerbIndex] = useState(0)
  const [activeSession, setActiveSession] = useState<ExerciseSession | null>(null)

  const block = blocks[blockIndex]
  const blockRuleIds = useMemo(() => Array.from(new Set((block?.exercises || []).flatMap(exercise => exercise.grammarRuleIds || []))), [block])
  const pendingRules = blockRuleIds.filter(id => !progress.introducedGrammarRules.includes(id) && grammarPrerequisitesMet(id, progress, blockRuleIds))
  const ruleCards = grammarDefinitions(pendingRules).filter(rule => rule.id !== 'verb-first-person')
  const blockVerbIntros = useMemo(() => verbIntrosForVocabulary(block?.words.map(word => word.id) || []), [block])
  const currentVerb = blockVerbIntros[verbIndex]

  const percent = useMemo(() => {
    if (stage === 'done') return 100
    if (stage === 'major-test') return 98
    if (stage === 'final-exam') return 96
    if (!blocks.length) return 90
    return Math.min(95, Math.round(((blockIndex + STAGE_PROGRESS[stage]) / blocks.length) * 95))
  }, [blockIndex, blocks.length, stage])

  useEffect(() => {
    if (activeSession) return
    if (stage === 'verb-practice' && currentVerb) {
      setActiveSession(createExerciseSession('verb-practice', buildVerbPracticeExercises(lessonId, currentVerb), `lesson-${lessonId}:block-${blockIndex}:verb-${currentVerb.verbId}:${sessionSeed}`))
      return
    }
    if (stage === 'block-practice' && block) {
      const deck = block.exercises.filter(exercise => isExerciseEligible(exercise, progress))
      setActiveSession(createExerciseSession('learning-block', deck, `lesson-${lessonId}:block-${blockIndex}:practice:${sessionSeed}`))
      return
    }
    if (stage === 'checkpoint' && block) {
      const deck = buildExamPlan({ kind:'checkpoint', lessonId, exercises, vocabulary, progress, seed:sessionSeed + blockIndex * 101, targetSize:examSize('checkpoint', progress, block.words.length) })
      setActiveSession(createExerciseSession('checkpoint', deck, `lesson-${lessonId}:block-${blockIndex}:checkpoint:${sessionSeed}`))
      return
    }
    if (stage === 'final-exam') {
      const deck = buildExamPlan({ kind:'final', lessonId, exercises, vocabulary, progress, seed:sessionSeed + 9001, targetSize:examSize('final', progress) })
      setActiveSession(createExerciseSession('final-exam', deck, `lesson-${lessonId}:final:${sessionSeed}`))
      return
    }
    if (stage === 'major-test') {
      const deck = buildExamPlan({ kind:'major', lessonId, exercises, vocabulary, progress, seed:sessionSeed + 17001, targetSize:examSize('major', progress) })
      setActiveSession(createExerciseSession('major-test', deck, `lesson-${lessonId}:major:${sessionSeed}`))
    }
  }, [activeSession, block, blockIndex, currentVerb, lessonId, progress, sessionSeed, stage])

  if (!lesson) return null

  function markWord(id: string) {
    setProgress(previous => ({ ...previous, introducedWords:Array.from(new Set([...previous.introducedWords, id])), updatedAt:Date.now() }))
  }

  function pendingVerbIndex(afterIndex: number) {
    return blockVerbIntros.findIndex((verb, index) => index > afterIndex && verb.keys.some(key => !progress.introducedVerbForms.includes(key)))
  }

  function nextAfterWordIntro() {
    setWordIndex(0)
    setActiveSession(null)
    const firstVerb = pendingVerbIndex(-1)
    if (firstVerb >= 0) { setVerbIndex(firstVerb); setStage('verb-intro') }
    else if (ruleCards.length) setStage('grammar-intro')
    else setStage('block-practice')
  }

  function nextWord() {
    if (!block) return
    markWord(block.words[wordIndex].id)
    if (wordIndex < block.words.length - 1) setWordIndex(index => index + 1)
    else nextAfterWordIntro()
  }

  function unlockCurrentVerb() {
    if (!currentVerb) return
    setProgress(previous => ({ ...previous, introducedVerbForms:Array.from(new Set([...previous.introducedVerbForms, ...currentVerb.keys])), introducedGrammarRules:Array.from(new Set([...previous.introducedGrammarRules, 'verb-first-person'])), updatedAt:Date.now() }))
    setActiveSession(null)
    setStage('verb-practice')
  }

  function finishVerbPractice() {
    if (!currentVerb) return
    setActiveSession(null)
    const nextVerb = pendingVerbIndex(verbIndex)
    if (nextVerb >= 0) { setVerbIndex(nextVerb); setStage('verb-intro') }
    else if (ruleCards.length) setStage('grammar-intro')
    else setStage('block-practice')
  }

  function unlockGrammar() {
    setProgress(previous => ({ ...previous, introducedGrammarRules:Array.from(new Set([...previous.introducedGrammarRules, ...pendingRules])), updatedAt:Date.now() }))
    setActiveSession(null)
    setStage('block-practice')
  }

  function finishBlockPractice() { setActiveSession(null); setStage('checkpoint') }

  function recordCurrentExam(kind: 'checkpoint' | 'final' | 'major') {
    if (!activeSession) return
    const item = historyItemFromExercises(activeSession.sessionId, kind, lessonId, activeSession.exercises)
    setProgress(previous => ({ ...previous, examHistory:appendExamHistory(previous.examHistory, item), updatedAt:Date.now() }))
  }

  function finishCheckpoint() {
    recordCurrentExam('checkpoint')
    setActiveSession(null)
    if (blockIndex < blocks.length - 1) {
      setBlockIndex(index => index + 1)
      setWordIndex(0)
      setVerbIndex(0)
      setStage('word-intro')
    } else setStage('final-exam')
  }

  function finishFinalExam() {
    recordCurrentExam('final')
    setActiveSession(null)
    if (lessonId % MAJOR_TEST_CONFIG.lessonsPerTest === 0) setStage('major-test')
    else setStage('done')
  }

  function finishMajorTest() {
    recordCurrentExam('major')
    setActiveSession(null)
    setStage('done')
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <div className="card min-w-0 overflow-hidden">
        <div className="flex min-w-0 items-center justify-between gap-3"><div className="min-w-0 break-words text-sm font-bold text-lime-700">Lektion {lesson.id}</div><div className="shrink-0 text-sm font-bold text-slate-500">{percent}%</div></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-lime-400 transition-all" style={{ width:`${percent}%` }} /></div>
        <h2 className="mt-4 min-w-0 break-words text-2xl font-black sm:text-3xl [overflow-wrap:anywhere]">{lesson.title}</h2>
        <p className="mt-2 break-words text-slate-600 [overflow-wrap:anywhere]">{lesson.subtitle}</p>
      </div>

      {stage === 'lesson-intro' && <div className="card min-w-0"><h3 className="break-words text-xl font-black">Heute lernst du in kleinen Portionen</h3><p className="mt-2 break-words text-slate-600">Neue Wörter, Verben und Grammatik werden zuerst vorgestellt, danach angewendet und anschließend geprüft.</p><button onClick={() => setStage('word-intro')} className="btn-primary mt-5 min-h-11 whitespace-normal">Los geht’s <ChevronRight size={18} /></button></div>}
      {stage === 'word-intro' && block && <div className="card min-w-0 overflow-hidden"><div className="break-words text-sm font-bold text-lime-700">Lernblock {blockIndex + 1} von {blocks.length} · Wort {wordIndex + 1} von {block.words.length}</div><div className="mt-5 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2"><div className="min-w-0"><AudioButton text={block.words[wordIndex].sl} /></div><div className="min-w-0"><div className="break-words text-3xl font-black [overflow-wrap:anywhere]">{block.words[wordIndex].sl}</div><div className="mt-1 break-words text-lg text-slate-600 [overflow-wrap:anywhere]">{block.words[wordIndex].de}</div><div className="mt-4 min-w-0 rounded-2xl bg-slate-50 p-4"><b className="break-words [overflow-wrap:anywhere]">{block.words[wordIndex].example}</b><div className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">{block.words[wordIndex].exampleDe}</div></div></div></div><button onClick={nextWord} className="btn-primary mt-5 min-h-11 w-full justify-center whitespace-normal">{wordIndex === block.words.length - 1 ? 'Weiter' : 'Nächstes Wort'} <ChevronRight size={18} /></button></div>}
      {stage === 'verb-intro' && currentVerb && <div className="card min-w-0 overflow-hidden"><div className="break-words text-sm font-bold text-blue-700">Neues Verb</div><div className="mt-2 flex min-w-0 flex-wrap items-center gap-3"><h3 className="min-w-0 break-words text-2xl font-black sm:text-3xl [overflow-wrap:anywhere]">{currentVerb.infinitiveSl} – {currentVerb.infinitiveDe}</h3><AudioButton text={currentVerb.infinitiveSl} compact /></div><p className="mt-2 break-words text-slate-600">Dieses Verb lernst du zuerst im Singular. Dual und Plural kommen später.</p><div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-3">{currentVerb.forms.map(form => <div key={form.person} className="min-w-0 rounded-2xl bg-blue-50 p-4"><div className="flex min-w-0 flex-wrap items-center justify-between gap-2"><b className="min-w-0 break-words text-lg [overflow-wrap:anywhere]">{form.pronounSl} {form.formSl}</b><AudioButton text={`${form.pronounSl.split(' / ')[0]} ${form.formSl}`} compact /></div><div className="mt-1 break-words text-sm text-slate-600">{form.translationDe}</div></div>)}</div>{currentVerb.examples.length > 0 && <div className="mt-5 min-w-0 rounded-2xl bg-slate-50 p-4"><div className="font-black">Beispiele</div><div className="mt-2 space-y-2">{currentVerb.examples.map(example => <div key={example.sl} className="min-w-0"><b className="break-words [overflow-wrap:anywhere]">{example.sl}</b><div className="break-words text-sm text-slate-500 [overflow-wrap:anywhere]">{example.de}</div></div>)}</div></div>}<button onClick={unlockCurrentVerb} className="btn-primary mt-5 min-h-11 w-full justify-center whitespace-normal">Konjugation üben <ChevronRight size={18} /></button></div>}
      {stage === 'verb-practice' && currentVerb && activeSession && <><StageHeader tone="blue" title={`Konjugationstraining · ${currentVerb.infinitiveSl}`} count={activeSession.exercises.length} text="Übe die neuen Formen. Unsichere Formen kommen später gezielt wieder." /><ExerciseDeck key={activeSession.sessionId} session={activeSession} onResult={onExerciseResult} onComplete={finishVerbPractice} /></>}
      {stage === 'grammar-intro' && <div className="card min-w-0 overflow-hidden"><div className="text-sm font-bold text-lime-700">Erst verstehen, dann anwenden</div><h3 className="mt-1 break-words text-2xl font-black">Neue Grammatik</h3>{ruleCards.map(rule => <div key={rule.id} className="mt-4 min-w-0 rounded-2xl bg-lime-50 p-4"><div className="break-words font-black">{rule.title}</div><p className="mt-1 break-words text-sm text-slate-600">{rule.body}</p><div className="mt-2 space-y-1 text-sm font-semibold">{rule.examples.map(example => <div key={example} className="break-words [overflow-wrap:anywhere]">{example}</div>)}</div></div>)}<button onClick={unlockGrammar} className="btn-primary mt-5 min-h-11 w-full justify-center whitespace-normal">Jetzt anwenden <ChevronRight size={18} /></button></div>}
      {stage === 'block-practice' && activeSession && (activeSession.exercises.length ? <><StageHeader tone="lime" title="Übungsblock" count={activeSession.exercises.length} text="Jetzt wendest du den gerade gelernten Stoff an." /><ExerciseDeck key={activeSession.sessionId} session={activeSession} onResult={onExerciseResult} onComplete={finishBlockPractice} /></> : <SkipCard title="Keine weitere Übung nötig" text="Für diesen Lernblock ist aktuell keine weitere passende Übung nötig." onNext={finishBlockPractice} />)}
      {stage === 'checkpoint' && activeSession && (activeSession.exercises.length ? <><StageHeader tone="lime" title="Zwischenprüfung" count={activeSession.exercises.length} text="Hier prüfst du, was du bisher gelernt hast." /><ExerciseDeck key={activeSession.sessionId} session={activeSession} onResult={onExerciseResult} onComplete={finishCheckpoint} /></> : <SkipCard title="Zwischenprüfung übersprungen" text="Es gibt noch nicht genug unterschiedliche gelernte Inhalte für eine sinnvolle Prüfung." onNext={finishCheckpoint} />)}
      {stage === 'final-exam' && activeSession && <>{activeSession.exercises.length ? <><StageHeader tone="lime" title="Abschlussprüfung" count={activeSession.exercises.length} text="Jetzt prüfst du die wichtigsten Inhalte der Lektion." /><ExerciseDeck key={activeSession.sessionId} session={activeSession} onResult={onExerciseResult} onComplete={finishFinalExam} /></> : <SkipCard title="Lektion bereit zum Abschluss" text="Es sind aktuell keine zusätzlichen Prüfungsaufgaben nötig." onNext={finishFinalExam} />}</>}
      {stage === 'major-test' && activeSession && <>{activeSession.exercises.length ? <><StageHeader tone="blue" title={`Großer Test · Lektionen ${Math.max(1, lessonId - MAJOR_TEST_CONFIG.lessonsPerTest + 1)}–${lessonId}`} count={activeSession.exercises.length} text="Ein größerer Test über die wichtigsten Inhalte der letzten Lektionen." /><ExerciseDeck key={activeSession.sessionId} session={activeSession} onResult={onExerciseResult} onComplete={finishMajorTest} /></> : <SkipCard title="Großer Test noch nicht nötig" text="Für einen größeren Test sind noch nicht genug unterschiedliche Inhalte freigeschaltet." onNext={() => setStage('done')} />}</>}
      {stage === 'done' && <div className="card min-w-0 text-center"><div className="text-sm font-bold text-lime-700">100 %</div><h3 className="mt-2 break-words text-3xl font-black">Lektion geschafft</h3><p className="mt-2 break-words text-slate-600">Sicher gelernte Inhalte kommen mit größerem Abstand wieder. Unsichere Inhalte werden früher wiederholt.</p><button onClick={onFinish} className="btn-primary mt-5 min-h-11 justify-center whitespace-normal">Lektion abschließen</button></div>}
    </div>
  )
}

function StageHeader({ tone, title, count, text }: { tone:'blue'|'lime'; title:string; count:number; text:string }) {
  return <div className="card min-w-0"><div className={`break-words text-sm font-bold ${tone === 'blue' ? 'text-blue-700' : 'text-lime-700'}`}>{title} · {count} Aufgaben</div><p className="mt-2 break-words text-sm text-slate-600">{text}</p></div>
}

function SkipCard({ title, text, onNext }: { title:string; text:string; onNext:()=>void }) {
  return <div className="card min-w-0"><h3 className="break-words text-xl font-black">{title}</h3><p className="mt-2 break-words text-slate-600">{text}</p><button onClick={onNext} className="btn-primary mt-4 min-h-11 whitespace-normal">Weiter</button></div>
}
