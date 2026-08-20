'use client'

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import AudioButton from '@/components/AudioButton'
import ExerciseDeck, { ExerciseResultMeta } from '@/components/ExerciseDeck'
import { exercises, lessons, vocabulary } from '@/data/seed'
import { grammarDefinitions, grammarPrerequisitesMet } from '@/lib/curriculum-access'
import { buildLearningBlocks, lessonProgress } from '@/lib/learning-flow'
import { buildExamPlan, examSize } from '@/lib/exam-planner'
import { createExerciseSession, ExerciseSession } from '@/lib/exercise-session'
import { allVerbFormsReady, buildVerbPracticeExercises, verbIntrosForVocabulary } from '@/lib/verb-learning'
import { Exercise, UserProgress, VerbFormRequirement } from '@/types'

type Stage =
  | 'intro'
  | 'learn'
  | 'verb-intro'
  | 'verb-practice'
  | 'grammar-intro'
  | 'checkpoint'
  | 'final'
  | 'done'

function blockSize(progress: UserProgress) {
  return progress.preferences.pace === 'ruhig' ? 2 : 3
}

export default function LessonFlow({
  lessonId,
  progress,
  setProgress,
  onExerciseResult,
  onFinish,
}: {
  lessonId: number
  progress: UserProgress
  setProgress: Dispatch<SetStateAction<UserProgress>>
  onExerciseResult: (exercise: Exercise, correct: boolean, meta: ExerciseResultMeta) => void
  onFinish: () => void
}) {
  const lesson = lessons.find(item => item.id === lessonId)!
  const [sessionSeed] = useState(() => Date.now())
  const [blocks] = useState(() =>
    buildLearningBlocks(lessonId, vocabulary, exercises, progress.introducedWords, blockSize(progress)),
  )
  const [stage, setStage] = useState<Stage>(blocks.length ? 'intro' : 'final')
  const [blockIndex, setBlockIndex] = useState(0)
  const [wordIndex, setWordIndex] = useState(0)
  const [verbIndex, setVerbIndex] = useState(0)
  const [verbRound, setVerbRound] = useState(0)
  const [activeSession, setActiveSession] = useState<ExerciseSession | null>(null)

  const block = blocks[blockIndex]
  const blockRuleIds = useMemo(
    () => Array.from(new Set((block?.exercises || []).flatMap(exercise => exercise.grammarRuleIds || []))),
    [block],
  )
  const pendingRules = blockRuleIds.filter(
    id =>
      !progress.introducedGrammarRules.includes(id) &&
      grammarPrerequisitesMet(id, progress, blockRuleIds),
  )
  const ruleCards = grammarDefinitions(pendingRules)
  const verbIntros = verbIntrosForVocabulary(block?.words.map(word => word.id) || [])
  const currentVerb = verbIntros[verbIndex]

  useEffect(() => {
    if (activeSession) return

    if (stage === 'verb-practice' && currentVerb) {
      const deck = buildVerbPracticeExercises(lessonId, currentVerb)
      setActiveSession(
        createExerciseSession(
          'verb-practice',
          deck,
          `lesson-${lessonId}:block-${blockIndex}:verb-${currentVerb.verbId}:round-${verbRound}`,
        ),
      )
      return
    }

    if (stage === 'checkpoint' && block) {
      const deck = buildExamPlan({
        kind: 'checkpoint',
        lessonId,
        exercises: block.exercises,
        vocabulary,
        progress,
        seed: sessionSeed + blockIndex * 101,
        targetSize: examSize('checkpoint', progress, block.words.length),
      })
      setActiveSession(
        createExerciseSession(
          'checkpoint',
          deck,
          `lesson-${lessonId}:block-${blockIndex}:checkpoint:${sessionSeed}`,
        ),
      )
      return
    }

    if (stage === 'final') {
      const deck = buildExamPlan({
        kind: 'final',
        lessonId,
        exercises,
        vocabulary,
        progress,
        seed: sessionSeed + 9001,
        targetSize: examSize('final', progress),
      })
      setActiveSession(
        createExerciseSession('final-exam', deck, `lesson-${lessonId}:final:${sessionSeed}`),
      )
    }
  }, [
    activeSession,
    block,
    blockIndex,
    currentVerb,
    lessonId,
    progress,
    sessionSeed,
    stage,
    verbRound,
  ])

  const percent =
    stage === 'done'
      ? 100
      : blocks.length
        ? lessonProgress(blockIndex, blocks.length, stage === 'checkpoint' ? 1 : 0, 2)
        : 75

  function markWord(id: string) {
    setProgress(previous => ({
      ...previous,
      introducedWords: Array.from(new Set([...previous.introducedWords, id])),
      updatedAt: Date.now(),
    }))
  }

  function afterWords() {
    setWordIndex(0)
    setVerbIndex(0)
    setActiveSession(null)
    if (verbIntros.length) setStage('verb-intro')
    else if (pendingRules.length) setStage('grammar-intro')
    else setStage('checkpoint')
  }

  function nextWord() {
    if (!block) return
    markWord(block.words[wordIndex].id)
    if (wordIndex < block.words.length - 1) setWordIndex(wordIndex + 1)
    else afterWords()
  }

  function unlockCurrentVerb() {
    if (!currentVerb) return
    setProgress(previous => ({
      ...previous,
      introducedVerbForms: Array.from(
        new Set([...previous.introducedVerbForms, ...currentVerb.keys]),
      ),
      introducedGrammarRules: Array.from(
        new Set([...previous.introducedGrammarRules, 'verb-first-person']),
      ),
      updatedAt: Date.now(),
    }))
    setActiveSession(null)
    setStage('verb-practice')
  }

  function currentRequirements(): VerbFormRequirement[] {
    return (
      currentVerb?.forms.map(form => ({
        verbId: currentVerb.verbId,
        person: form.person,
        number: 'singular' as const,
      })) || []
    )
  }

  function finishVerbPractice() {
    if (!currentVerb) return
    if (!allVerbFormsReady(progress, currentRequirements())) {
      setVerbRound(round => round + 1)
      setActiveSession(null)
      return
    }

    setActiveSession(null)
    if (verbIndex < verbIntros.length - 1) {
      setVerbIndex(index => index + 1)
      setStage('verb-intro')
    } else if (pendingRules.filter(rule => rule !== 'verb-first-person').length) {
      setStage('grammar-intro')
    } else {
      setStage('checkpoint')
    }
  }

  function unlockGrammar() {
    setProgress(previous => ({
      ...previous,
      introducedGrammarRules: Array.from(
        new Set([...previous.introducedGrammarRules, ...pendingRules]),
      ),
      updatedAt: Date.now(),
    }))
    setActiveSession(null)
    setStage('checkpoint')
  }

  function nextBlock() {
    setActiveSession(null)
    if (blockIndex < blocks.length - 1) {
      setBlockIndex(index => index + 1)
      setWordIndex(0)
      setVerbIndex(0)
      setVerbRound(0)
      setStage('learn')
    } else {
      setStage('final')
    }
  }

  if (!lesson) return null

  return (
    <div className="w-full min-w-0 max-w-full space-y-5 overflow-x-hidden">
      <div className="card min-w-0 overflow-hidden">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0 break-words text-sm font-bold text-lime-700">Lektion {lesson.id}</div>
          <div className="shrink-0 text-sm font-bold text-slate-500">{percent}%</div>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-lime-400 transition-all" style={{ width: `${percent}%` }} />
        </div>
        <h2 className="mt-4 min-w-0 break-words text-2xl font-black sm:text-3xl [overflow-wrap:anywhere]">
          {lesson.title}
        </h2>
        <p className="mt-2 break-words text-slate-600 [overflow-wrap:anywhere]">{lesson.subtitle}</p>
      </div>

      {stage === 'intro' && (
        <div className="card min-w-0">
          <h3 className="break-words text-xl font-black">Heute lernst du in kleinen Portionen</h3>
          <p className="mt-2 break-words text-slate-600">
            Neue Wörter, Verben und Grammatik werden zuerst vollständig vorgestellt. Erst danach werden sie
            in normalen Sätzen abgefragt.
          </p>
          <button onClick={() => setStage('learn')} className="btn-primary mt-5 min-h-11 whitespace-normal">
            Los geht’s <ChevronRight size={18} />
          </button>
        </div>
      )}

      {stage === 'learn' && block && (
        <div className="card min-w-0 overflow-hidden">
          <div className="break-words text-sm font-bold text-lime-700">
            Lernblock {blockIndex + 1} von {blocks.length} · Wort {wordIndex + 1} von {block.words.length}
          </div>
          <div className="mt-5 grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="min-w-0">
              <AudioButton text={block.words[wordIndex].sl} />
            </div>
            <div className="min-w-0">
              <div className="break-words text-3xl font-black [overflow-wrap:anywhere]">
                {block.words[wordIndex].sl}
              </div>
              <div className="mt-1 break-words text-lg text-slate-600 [overflow-wrap:anywhere]">
                {block.words[wordIndex].de}
              </div>
              <div className="mt-4 min-w-0 rounded-2xl bg-slate-50 p-4">
                <b className="break-words [overflow-wrap:anywhere]">{block.words[wordIndex].example}</b>
                <div className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                  {block.words[wordIndex].exampleDe}
                </div>
              </div>
            </div>
          </div>
          <button onClick={nextWord} className="btn-primary mt-5 w-full min-h-11 justify-center whitespace-normal">
            {wordIndex === block.words.length - 1 ? 'Weiter' : 'Nächstes Wort'} <ChevronRight size={18} />
          </button>
        </div>
      )}

      {stage === 'verb-intro' && currentVerb && (
        <div className="card min-w-0 overflow-hidden">
          <div className="break-words text-sm font-bold text-blue-700">
            Neues Verb · {verbIndex + 1} von {verbIntros.length}
          </div>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-3">
            <h3 className="min-w-0 break-words text-2xl font-black sm:text-3xl [overflow-wrap:anywhere]">
              {currentVerb.infinitiveSl} – {currentVerb.infinitiveDe}
            </h3>
            <AudioButton text={currentVerb.infinitiveSl} compact />
          </div>
          <p className="mt-2 break-words text-slate-600">
            Dieses Verb lernst du zuerst vollständig im Singular. Dual und Plural kommen später als eigene
            Lernstufen.
          </p>
          <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-3">
            {currentVerb.forms.map(form => (
              <div key={form.person} className="min-w-0 rounded-2xl bg-blue-50 p-4">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <b className="min-w-0 break-words text-lg [overflow-wrap:anywhere]">
                    {form.pronounSl} {form.formSl}
                  </b>
                  <AudioButton text={`${form.pronounSl.split(' / ')[0]} ${form.formSl}`} compact />
                </div>
                <div className="mt-1 break-words text-sm text-slate-600">{form.translationDe}</div>
              </div>
            ))}
          </div>
          {currentVerb.examples.length > 0 && (
            <div className="mt-5 min-w-0 rounded-2xl bg-slate-50 p-4">
              <div className="font-black">Beispiele</div>
              <div className="mt-2 space-y-2">
                {currentVerb.examples.map(example => (
                  <div key={example.sl} className="min-w-0">
                    <b className="break-words [overflow-wrap:anywhere]">{example.sl}</b>
                    <div className="break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                      {example.de}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={unlockCurrentVerb}
            className="btn-primary mt-5 w-full min-h-11 justify-center whitespace-normal"
          >
            Konjugation üben <ChevronRight size={18} />
          </button>
        </div>
      )}

      {stage === 'verb-practice' && currentVerb && activeSession && (
        <>
          <div className="card min-w-0">
            <div className="break-words text-sm font-bold text-blue-700">
              Konjugationstraining · {currentVerb.infinitiveSl} · {activeSession.exercises.length} Aufgaben
            </div>
            <h3 className="mt-1 break-words text-2xl font-black">Erst sicher anwenden, dann in Sätzen benutzen</h3>
            <p className="mt-2 break-words text-slate-600">
              Jede Singularform wird erkannt und aktiv produziert. Bei Fehlern folgt eine weitere Runde, bevor
              das Verb für normale Aufgaben freigegeben wird.
            </p>
          </div>
          <ExerciseDeck
            key={activeSession.sessionId}
            session={activeSession}
            onResult={onExerciseResult}
            onComplete={finishVerbPractice}
          />
        </>
      )}

      {stage === 'grammar-intro' && (
        <div className="card min-w-0 overflow-hidden">
          <div className="text-sm font-bold text-lime-700">Erst verstehen, dann üben</div>
          <h3 className="mt-1 break-words text-2xl font-black">Neue Grammatik in diesem Lernblock</h3>
          {ruleCards
            .filter(rule => rule.id !== 'verb-first-person')
            .map(rule => (
              <div key={rule.id} className="mt-4 min-w-0 rounded-2xl bg-lime-50 p-4">
                <div className="break-words font-black">{rule.title}</div>
                <p className="mt-1 break-words text-sm text-slate-600">{rule.body}</p>
                <div className="mt-2 space-y-1 text-sm font-semibold">
                  {rule.examples.map(example => (
                    <div key={example} className="break-words [overflow-wrap:anywhere]">
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          <button onClick={unlockGrammar} className="btn-primary mt-5 w-full min-h-11 justify-center whitespace-normal">
            Jetzt üben <ChevronRight size={18} />
          </button>
        </div>
      )}

      {stage === 'checkpoint' && activeSession && block && (
        activeSession.exercises.length ? (
          <>
            <div className="card min-w-0">
              <div className="break-words text-sm font-bold text-lime-700">
                Zwischenprüfung · {activeSession.exercises.length} Aufgaben
              </div>
              <p className="mt-1 break-words text-sm text-slate-600">
                Dieser Prüfungsplan ist jetzt fest und verändert sich während der Prüfung nicht mehr.
              </p>
            </div>
            <ExerciseDeck
              key={activeSession.sessionId}
              session={activeSession}
              onResult={onExerciseResult}
              onComplete={nextBlock}
            />
          </>
        ) : (
          <div className="card min-w-0">
            <h3 className="break-words text-xl font-black">Dieser Block ist vorbereitet</h3>
            <p className="mt-2 break-words text-slate-600">
              Noch keine passende normale Übung ist freigeschaltet. Wir gehen weiter, statt unsichere oder
              unbekannte Formen abzufragen.
            </p>
            <button onClick={nextBlock} className="btn-primary mt-4 min-h-11 whitespace-normal">Weiter</button>
          </div>
        )
      )}

      {stage === 'final' && activeSession && (
        <>
          <div className="card min-w-0">
            <div className="break-words text-sm font-bold text-lime-700">
              Abschlussprüfung · {activeSession.exercises.length} Aufgaben
            </div>
            <h3 className="mt-1 break-words text-2xl font-black">Breiter Test über die ganze Lektion</h3>
            <p className="mt-2 break-words text-slate-600">
              Nur bereits eingeführte und ausreichend trainierte Inhalte werden geprüft. Der Plan bleibt bis
              zum Abschluss unverändert.
            </p>
          </div>
          {activeSession.exercises.length ? (
            <ExerciseDeck
              key={activeSession.sessionId}
              session={activeSession}
              onResult={onExerciseResult}
              onComplete={() => {
                setActiveSession(null)
                setStage('done')
              }}
            />
          ) : (
            <button onClick={() => setStage('done')} className="btn-primary min-h-11 whitespace-normal">
              Lektion abschließen
            </button>
          )}
        </>
      )}

      {stage === 'done' && (
        <div className="card min-w-0 text-center">
          <div className="text-sm font-bold text-lime-700">100 %</div>
          <h3 className="mt-2 break-words text-3xl font-black">Lektion geschafft</h3>
          <p className="mt-2 break-words text-slate-600">
            Einzelne Wörter oder Regeln können trotzdem noch im Status „lernen“ sein.
          </p>
          <button onClick={onFinish} className="btn-primary mt-5 min-h-11 justify-center whitespace-normal">
            Lektion abschließen
          </button>
        </div>
      )}
    </div>
  )
}
