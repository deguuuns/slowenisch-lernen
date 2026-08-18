'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronRight, Eye, Flag, Lightbulb, RotateCcw, Sparkles } from 'lucide-react'
import AudioButton from '@/components/AudioButton'
import SpeechPractice from '@/components/SpeechPractice'
import { beginnerExercises } from '@/data/beginnerContent'
import { beginnerReinforcementExercises } from '@/data/beginnerReinforcement'
import { getBeginnerSessionGoal } from '@/data/beginnerCurriculum'
import { foundationExercises } from '@/data/foundationCurriculum'
import { exercises as diverseExercises } from '@/data/diverseContent'
import { compareAnswer } from '@/lib/answerMatching'
import { guidedHint } from '@/lib/guidedFeedback'
import { validateFreeProduction } from '@/lib/freeProduction'
import { getActiveProfile } from '@/lib/profileStorage'
import { registerIntroductions } from '@/lib/prerequisites'
import { eligibleAdaptiveContent } from '@/lib/sessionEligibility'
import { updateLearnerStateWithHelp } from '@/lib/masteryWithHelp'
import {
  createSessionState,
  registerSessionOutcome,
  selectNextExercise,
  type SessionState,
} from '@/lib/learningEngine'
import { recordLearningTime, registerMistake, scheduleReview } from '@/lib/storage'
import type { Exercise, LearningSkill, MistakeCategory, UserProgress } from '@/types'

export default function AdaptiveLearningSession({
  progress,
  exercises: _legacyExercises,
  setProgress,
  onFinish,
}: {
  progress: UserProgress
  exercises: Exercise[]
  setProgress: (updater: (current: UserProgress) => UserProgress) => void
  onFinish: () => void
}) {
  const [session, setSession] = useState<SessionState>(() => createSessionState())
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState(false)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [showReason, setShowReason] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [transcriptHelpUsed, setTranscriptHelpUsed] = useState(false)
  const profile = useMemo(() => getActiveProfile(), [])
  const beginnerGoal = useMemo(() => getBeginnerSessionGoal(progress), [progress])
  const sessionTarget = profile?.startMode === 'zero' ? 10 : 14

  const allAdaptiveContent = useMemo(
    () => [...beginnerExercises, ...beginnerReinforcementExercises, ...foundationExercises, ...diverseExercises],
    [],
  )
  const contentPool = useMemo(
    () => eligibleAdaptiveContent(allAdaptiveContent, progress, session, profile),
    [allAdaptiveContent, progress, profile, session],
  )
  const candidate = useMemo(() => selectNextExercise(progress, contentPool, session), [progress, contentPool, session])
  const exercise = candidate?.exercise
  const comparison = useMemo(() => exercise ? compareAnswer({
    input: value,
    expected: exercise.answer,
    acceptedAnswers: exercise.acceptedAnswers,
    inputMode: exercise.type === 'speak-answer' || exercise.type === 'repeat-after-me' ? 'speech' : 'typed',
    allowNumericShorthand: exercise.type === 'speak-answer' || exercise.type === 'repeat-after-me',
  }) : null, [exercise, value])
  const freeEvaluation = useMemo(() => exercise?.evaluationMode === 'free' ? validateFreeProduction(exercise, value) : null, [exercise, value])

  if (!candidate || !exercise || !comparison) {
    return <div className="card"><h2 className="text-2xl font-black">Keine passende Aufgabe gefunden.</h2><p className="mt-2 text-slate-500">Im Moment ist kein sinnvoller nächster Schritt freigeschaltet. Das kann bedeuten, dass eine Einführung oder Voraussetzung fehlt.</p><button onClick={onFinish} className="btn-primary mt-4">Zurück</button></div>
  }

  const activeCandidate = candidate
  const activeExercise = exercise
  const activeComparison = comparison
  const isFree = activeExercise.evaluationMode === 'free'
  const isChoice = activeExercise.modality === 'choice' || activeExercise.type === 'choice' || activeExercise.type === 'listen-choice'
  const isSpeaking = activeExercise.modality === 'speaking' || activeExercise.type === 'speak-answer' || activeExercise.type === 'repeat-after-me'
  const isListening = activeExercise.modality === 'listening' || activeExercise.type.startsWith('listen-')
  const isIntroduction = activeExercise.type === 'introduce'
  const done = session.answered >= sessionTarget
  const elapsedMinutes = Math.max(1, Math.round((Date.now() - session.startedAt) / 60_000))
  const freeCorrect = isFree && !!freeEvaluation?.acceptable
  const canContinue = isIntroduction || (isFree ? freeCorrect || showSolution : activeComparison.correct || showSolution)

  if (done) {
    const accuracy = session.answered ? Math.round(session.correct / session.answered * 100) : 0
    const modalities = Array.from(new Set(session.history.map(item => item.modality).filter(Boolean)))
    return <div className="space-y-5"><div className="card bg-slate-950 text-white"><div className="text-sm font-bold text-lime-300">Session abgeschlossen</div><h2 className="mt-2 text-3xl font-black">Dobro opravljeno.</h2><p className="mt-3 text-slate-300">{session.answered} Schritte · {accuracy}% bei geprüften Aufgaben · ca. {elapsedMinutes} Min.</p>{profile?.startMode === 'zero' && <div className="mt-5 rounded-2xl bg-white/10 p-4"><div className="text-xs font-black uppercase tracking-[0.16em] text-lime-300">Heute im Fokus</div><div className="mt-1 text-lg font-black">{beginnerGoal.title}</div><p className="mt-1 text-sm text-slate-300">{beginnerGoal.goal}</p></div>}<p className="mt-3 text-sm text-slate-400">Geübt: {modalities.join(' · ') || 'Text'}</p><button onClick={onFinish} className="mt-6 min-h-12 rounded-2xl bg-lime-300 px-5 py-3 font-black text-slate-950">Fertig</button></div></div>
  }

  function resetForNext() {
    setValue('')
    setChecked(false)
    setWrongAttempts(0)
    setShowSolution(false)
    setStartedAt(Date.now())
    setShowReason(false)
    setShowTranscript(false)
    setTranscriptHelpUsed(false)
  }

  function insertSpecialChar(char: string) { setValue(current => current + char); setChecked(false) }

  function check() {
    if (isIntroduction || !value.trim()) return
    if (isFree) {
      setChecked(true)
      if (!freeEvaluation?.acceptable) setWrongAttempts(current => current + 1)
      return
    }
    if (activeComparison.correct) { setChecked(true); return }
    const nextAttempts = wrongAttempts + 1
    setWrongAttempts(nextAttempts)
    setChecked(true)
    if (nextAttempts >= 3) setShowSolution(true)
  }

  function retry() { setChecked(false); setShowSolution(false) }

  function completeIntroduction() {
    setProgress(current => recordLearningTime(registerIntroductions(current, activeExercise), 0.1, true))
    setSession(current => registerSessionOutcome(current, activeCandidate, { correct: true, responseMs: Math.max(250, Date.now() - startedAt) }))
    resetForNext()
  }

  function continueSession() {
    if (!canContinue || isIntroduction) return
    const correct = isFree ? freeCorrect : activeComparison.correct
    const responseMs = Math.max(250, Date.now() - startedAt)
    const category = activeComparison.category as MistakeCategory | undefined
    const hintsUsed = wrongAttempts + (showSolution ? 2 : 0) + (transcriptHelpUsed ? 1 : 0)

    setProgress(current => {
      let next = registerIntroductions(current, activeExercise)
      if (!isFree || freeCorrect) {
        next = updateLearnerStateWithHelp(next, activeExercise, { correct, responseMs, mistakeCategory: category, hintsUsed })
        const modality = activeExercise.modality ?? (isListening ? 'listening' : isSpeaking ? 'speaking' : isChoice ? 'choice' : 'text')
        next = {
          ...next,
          reviews: scheduleReview(next.reviews, activeExercise.id, correct, responseMs),
          mistakes: correct ? next.mistakes : registerMistake(next.mistakes, activeExercise.id, category),
          skillXp: addSkillXp(next.skillXp ?? {}, activeExercise.skills ?? ['schreiben'], correct),
          listeningMinutes: isListening ? +(next.listeningMinutes + 0.2).toFixed(1) : next.listeningMinutes,
          speakingMinutes: isSpeaking ? +(next.speakingMinutes + 0.2).toFixed(1) : next.speakingMinutes,
          recentSessionHistory: [...(next.recentSessionHistory ?? []), {
            exerciseId: activeExercise.id,
            learningTargets: activeCandidate.learningTargets,
            skills: activeExercise.skills ?? ['schreiben'],
            correct,
            timestamp: Date.now(),
            mistakeCategory: category,
            reason: activeCandidate.reasons[0],
            exerciseType: activeExercise.type,
            modality,
            grammarTag: activeExercise.grammarTag,
            contentKey: activeExercise.contentKey ?? activeExercise.answer,
            contextTag: activeExercise.contextTag,
            hintsUsed,
            learningPhase: activeExercise.learningPhase,
            curriculumPhase: activeExercise.curriculumPhase,
          }].slice(-80),
        }
        if (!correct && activeExercise.grammarTag) next.mistakes = registerMistake(next.mistakes, `grammar:${activeExercise.grammarTag}`, category)
      }
      return recordLearningTime(next, Math.max(0.1, responseMs / 60_000), correct)
    })

    setSession(current => registerSessionOutcome(current, activeCandidate, { correct, responseMs, mistakeCategory: category }))
    resetForNext()
  }

  const phaseLabel = activeExercise.learningPhase === 'new' ? 'NEU' : activeExercise.learningPhase === 'review' ? 'WIEDERHOLEN' : activeExercise.learningPhase === 'recognition' || activeExercise.learningPhase === 'recall' ? 'ÜBEN' : 'ANWENDEN'

  return <div className="space-y-4">
    {profile?.startMode === 'zero' && <div className="rounded-3xl bg-white p-4 shadow-sm"><div className="text-xs font-black uppercase tracking-[0.18em] text-lime-700">Lernziel · Phase {beginnerGoal.phase}</div><div className="mt-1 text-xl font-black">{beginnerGoal.title}</div><p className="mt-1 text-sm text-slate-500">{beginnerGoal.goal}</p></div>}
    <div className="flex items-center justify-between gap-3"><div className="text-sm font-bold text-slate-500">Persönliche Session · {session.answered + 1}/{sessionTarget}</div><button onClick={onFinish} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-white"><Flag size={16}/> Beenden</button></div>
    <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-lime-400 transition-all" style={{ width: `${session.answered / sessionTarget * 100}%` }}/></div>
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap gap-1.5"><span className="rounded-full bg-lime-100 px-2.5 py-1 text-xs font-black text-lime-800">{phaseLabel}</span>{(activeExercise.skills ?? ['schreiben']).map(skill => <span key={skill} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">{skill}</span>)}</div><button onClick={() => setShowReason(current => !current)} className="text-xs font-semibold text-slate-400">Warum diese Aufgabe?</button></div>
      {showReason && <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600"><div className="font-bold text-slate-800">Warum jetzt?</div>{activeExercise.curriculumPhase && <div className="mt-1 text-lime-800">+ gehört zum aktuellen Anfänger-Lernziel</div>}{activeCandidate.reasons.slice(0, 5).map(reason => <div key={reason} className="mt-1 text-lime-800">+ {reason}</div>)}{activeCandidate.penalties.slice(0, 4).map(reason => <div key={reason} className="mt-1 text-amber-700">− {reason}</div>)}</div>}

      {isIntroduction ? <div className="mt-5 rounded-3xl border border-lime-200 bg-lime-50 p-5"><div className="text-xs font-black uppercase tracking-[0.2em] text-lime-800">Neu kennenlernen</div><div className="mt-4 text-3xl font-black">{activeExercise.introSl ?? activeExercise.answer}</div><div className="mt-1 text-xl text-slate-700">{activeExercise.introDe}</div>{activeExercise.introUsage && <p className="mt-4 text-sm leading-6 text-slate-600"><strong>Verwendung:</strong> {activeExercise.introUsage}</p>}<div className="mt-5"><AudioButton text={activeExercise.audioPrompt ?? activeExercise.answer}/></div><button onClick={completeIntroduction} className="btn-primary mt-6 w-full justify-center">Weiter <ChevronRight size={18}/></button></div> : <>
        {isListening && <div className="mt-4 rounded-3xl bg-slate-950 p-5 text-white"><div className="text-xs font-bold uppercase tracking-[0.2em] text-lime-300">Nur hören – Text bleibt verborgen</div><div className="mt-3"><AudioButton text={activeExercise.audioPrompt ?? activeExercise.answer}/></div>{showTranscript ? <div className="mt-4 rounded-2xl bg-white/10 p-3 text-lg font-bold">{activeExercise.audioPrompt ?? activeExercise.answer}</div> : <button onClick={() => { setShowTranscript(true); setTranscriptHelpUsed(true) }} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-slate-300 underline"><Eye size={16}/> Text anzeigen</button>}</div>}
        {!isSpeaking && <h2 className="mt-4 text-2xl font-black">{activeExercise.prompt}</h2>}
        {activeExercise.hint && !checked && !isListening && <p className="mt-2 text-sm text-slate-500">Hinweis: {activeExercise.hint}</p>}
        {isSpeaking ? <div className="mt-4"><SpeechPractice key={activeExercise.id} prompt={activeExercise.prompt} expected={activeExercise.answer} acceptedAnswers={activeExercise.acceptedAnswers} onResult={(_correct, actual) => { setValue(actual); setChecked(true) }}/></div> : isChoice ? <div className="mt-5 grid gap-2">{Array.from(new Set([...(activeExercise.alternatives ?? []), activeExercise.answer])).map(option => <button key={option} onClick={() => { setValue(option); setChecked(false) }} className={`min-h-12 rounded-2xl border px-4 py-3 text-left font-semibold ${value === option ? 'border-lime-500 bg-lime-50' : 'border-slate-200 bg-white'}`}>{option}</button>)}{!checked && <button onClick={check} disabled={!value} className="btn-primary mt-2 w-full justify-center">Prüfen</button>}</div> : <><input value={value} onChange={event => { setValue(event.target.value); setChecked(false) }} onKeyDown={event => { if (event.key === 'Enter' && value.trim()) check() }} className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100" placeholder="Deine Antwort …" autoComplete="off" spellCheck={false}/><div className="mt-2 flex gap-2">{['č','š','ž'].map(char => <button key={char} type="button" onClick={() => insertSpecialChar(char)} className="touch-target rounded-xl border border-slate-200 bg-white px-4 py-2 font-black">{char.toUpperCase()}</button>)}</div>{!checked && <button onClick={check} disabled={!value.trim()} className="btn-primary mt-4 w-full justify-center">Prüfen</button>}</>}
        {checked && !isSpeaking && <GuidedFeedback correct={isFree ? freeCorrect : activeComparison.correct} isFree={isFree} freeFeedback={freeEvaluation?.feedback} value={value} exercise={activeExercise} category={activeComparison.category as MistakeCategory | undefined} wrongAttempts={wrongAttempts} showSolution={showSolution} onRetry={retry} onShowSolution={() => setShowSolution(true)}/>} 
        {checked && canContinue && <button onClick={continueSession} className="btn-primary mt-4 w-full justify-center">Nächste passende Aufgabe <ChevronRight size={18}/></button>}
      </>}
    </div>
    <div className="flex items-center gap-2 rounded-2xl bg-white/70 p-3 text-xs text-slate-500"><Sparkles size={15}/><span>Curriculum bestimmt den Stoff. Die Lern-Engine entscheidet nur, wann und wie du ihn sinnvoll übst.</span></div>
  </div>
}

function GuidedFeedback({ correct, isFree, freeFeedback, value, exercise, category, wrongAttempts, showSolution, onRetry, onShowSolution }: { correct: boolean; isFree: boolean; freeFeedback?: string; value: string; exercise: Exercise; category?: MistakeCategory; wrongAttempts: number; showSolution: boolean; onRetry: () => void; onShowSolution: () => void }) {
  if (correct) return <div className="mt-4 rounded-2xl bg-lime-50 p-4"><div className="flex items-center gap-2 font-black"><CheckCircle2 size={20}/> {isFree ? 'Plausible slowenische Antwort.' : 'Richtig.'}</div>{isFree && freeFeedback && <p className="mt-2 text-sm text-slate-600">{freeFeedback}</p>}</div>
  if (isFree) return <div className="mt-4 rounded-2xl bg-amber-50 p-4"><div className="flex items-center gap-2 font-black"><Lightbulb size={20}/> Noch einmal versuchen</div><p className="mt-2 text-sm">{freeFeedback ?? 'Die Antwort kann so noch nicht als passende slowenische Antwort gewertet werden.'}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 font-bold"><RotateCcw size={17}/> Antwort verbessern</button><button onClick={onShowSolution} className="inline-flex min-h-11 items-center gap-2 px-3 py-2 text-sm font-bold text-slate-500"><Eye size={17}/> Beispielantwort anzeigen</button></div>{showSolution && <><p className="mt-3 text-sm text-slate-500">Beispielantwort:</p><div className="font-bold">{exercise.answer}</div></>}</div>
  const stage = Math.min(2, Math.max(1, wrongAttempts)) as 1 | 2
  return <div className="mt-4 rounded-2xl bg-amber-50 p-4"><div className="flex items-center gap-2 font-black"><AlertCircle size={20}/> Noch nicht ganz.</div>{!showSolution ? <><p className="mt-3 text-sm"><strong>Hinweis {stage}/2:</strong> {guidedHint(category, value, exercise.answer, stage)}</p><p className="mt-2 text-xs text-amber-800">Die vollständige Lösung bleibt zunächst verborgen, damit du selbst korrigieren kannst.</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 font-bold"><RotateCcw size={17}/> Noch einmal versuchen</button><button onClick={onShowSolution} className="inline-flex min-h-11 items-center gap-2 px-3 py-2 text-sm font-bold text-slate-500"><Eye size={17}/> Lösung zeigen</button></div></> : <><div className="mt-3 text-sm text-slate-500">Lösung</div><div className="text-lg font-black">{exercise.answer}</div>{exercise.explanation && <div className="mt-3 text-sm"><strong>Warum?</strong> {exercise.explanation}</div>}</>}</div>
}

function addSkillXp(current: Partial<Record<LearningSkill, number>>, skills: LearningSkill[], correct: boolean) {
  const next = { ...current }
  for (const skill of skills) next[skill] = (next[skill] ?? 0) + (correct ? 3 : 1)
  return next
}
