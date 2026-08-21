import { enrichExercises } from '@/lib/curriculum-metadata'
import { isExerciseEligible } from '@/lib/curriculum-access'
import { isStrictlyAssessableExercise } from '@/lib/exercise-integrity'
import { MASTERY_THRESHOLDS } from '@/lib/learner-status'
import { dedupeExercisesByTarget, exerciseHasDueTarget, inferTargetContentKeys, isReviewDue } from '@/lib/learning-targets'
import { generatedExercisesForWord } from '@/lib/learning-flow'
import { Exercise, UserProgress, Vocabulary } from '@/types'
import { buildTransferExercise, injectDueTransfer } from '@/lib/transfer-practice'
import { buildVerbPracticeExercises, verbIntrosForVocabulary } from '@/lib/verb-learning'

export type AdaptiveActionKind = 'review' | 'strengthen' | 'new-content' | 'speaking'
export type AdaptiveRecommendation = { kind:AdaptiveActionKind; title:string; reason:string; priority:number; lessonId?:number; focusKeys:string[]; exerciseIds:string[] }

function eligible(progress: UserProgress, exercises: Exercise[]) {
  return exercises.filter(isStrictlyAssessableExercise).filter(exercise => isExerciseEligible(exercise, progress))
}

function fluencyConcern(progress: UserProgress) {
  const recent = (progress.recentAttempts || []).slice(-12)
  if (recent.length < 4) return false
  const correct = recent.filter(attempt => attempt.correct)
  if (correct.length < 3) return false
  const slow = correct.filter(attempt => attempt.responseMs > 30_000).length
  const helped = correct.filter(attempt => attempt.hintsUsed > 0).length
  return slow + helped >= Math.ceil(correct.length / 2)
}

function newWordBudget(progress: UserProgress) {
  const pace = progress.preferences?.pace || 'normal'
  const recent = (progress.recentAttempts || []).slice(-12)
  const accuracy = recent.length ? recent.filter(attempt => attempt.correct).length / recent.length : .75
  const fastCorrect = recent.filter(attempt => attempt.correct && attempt.responseMs <= 12_000 && attempt.hintsUsed === 0).length
  const base = pace === 'ruhig' ? 2 : pace === 'intensiv' ? 4 : 3
  if (recent.length >= 6 && accuracy >= .85 && fastCorrect >= Math.ceil(recent.length * .6)) return Math.min(5, base + 1)
  if (recent.length >= 6 && accuracy < .6) return Math.max(1, base - 1)
  return base
}

function generatedDueReviews(progress: UserProgress, vocabulary: Vocabulary[], now: number): Exercise[] {
  const generated: Exercise[] = []
  const introducedWords = vocabulary.filter(word => progress.introducedWords.includes(word.id))

  for (const review of progress.reviews || []) {
    if (review.dueAt > now) continue
    if (review.key.startsWith('vocab:')) {
      const wordId = review.key.slice('vocab:'.length)
      const word = vocabulary.find(item => item.id === wordId)
      if (!word || !progress.introducedWords.includes(word.id)) continue
      const lessonWords = introducedWords.filter(item => item.lesson === word.lesson)
      const production = generatedExercisesForWord(word, lessonWords).find(exercise => exercise.type === 'translate-de-sl')
      if (production) generated.push({ ...production, id:`review-${production.id}` })
    }
  }

  const verbIntros = verbIntrosForVocabulary(progress.introducedWords)
  for (const intro of verbIntros) {
    for (const exercise of buildVerbPracticeExercises(0, intro)) {
      const target = inferTargetContentKeys(exercise)[0]
      if (target && isReviewDue(progress, target, now)) generated.push({ ...exercise, id:`review-${exercise.id}` })
    }
  }

  return generated
}

export function buildAdaptiveRecommendation(progress: UserProgress, rawExercises: Exercise[], vocabulary: Vocabulary[], activeLesson: number, now = Date.now()): AdaptiveRecommendation {
  const exercises = eligible(progress, enrichExercises(rawExercises))
  const dueKeys = (progress.reviews || []).filter(review => review.dueAt <= now).map(review => review.key)
  if (dueKeys.length) {
    const matching = buildAdaptiveReviewDeck(progress, rawExercises, 10, now, vocabulary)
    if (matching.length) return { kind:'review', title:'Fällige Wiederholungen', reason:`${dueKeys.length} Lernziele sind jetzt wirklich fällig.`, priority:100, focusKeys:dueKeys, exerciseIds:matching.map(exercise => exercise.id) }
  }

  const attemptCount = progress.recentAttempts?.length || 0
  const viableTransfer = (progress.transferQueue || []).find(item => progress.introducedGrammarRules.includes(item.grammarRuleId) && buildTransferExercise(item, exercises, attemptCount))
  if (viableTransfer) return { kind:'strengthen', title:'Fehler gezielt übertragen', reason:'Eine zuletzt unsichere Regel wird mit einem anderen Satz geprüft.', priority:90, focusKeys:[`grammar:${viableTransfer.grammarRuleId}`], exerciseIds:[] }

  const production = progress.mastery?.['skill:production']
  const recognition = progress.mastery?.['skill:recognition']
  if ((recognition?.attempts || 0) >= 3 && (!production || production.score + .12 < (recognition.score || 0)) && exercises.some(exercise => exercise.skillTargets?.includes('production'))) {
    return { kind:'speaking', title:'Mehr selbst produzieren', reason:'Erkennen klappt besser als selbst formulieren.', priority:75, focusKeys:['skill:production'], exerciseIds:exercises.filter(exercise => exercise.skillTargets?.includes('production')).map(exercise => exercise.id).slice(0,8) }
  }

  const listening = progress.mastery?.['skill:listening']
  if ((listening?.attempts || 0) >= 2 && listening.score < MASTERY_THRESHOLDS.learning) return { kind:'strengthen', title:'Hörverständnis festigen', reason:'Beim Hören brauchst du noch Unterstützung.', priority:70, focusKeys:['skill:listening'], exerciseIds:exercises.filter(exercise => exercise.skillTargets?.includes('listening')).map(exercise => exercise.id).slice(0,8) }

  const speaking = progress.mastery?.['skill:speaking']
  if ((speaking?.attempts || 0) >= 2 && speaking.score < MASTERY_THRESHOLDS.learning) return { kind:'speaking', title:'Sprechen festigen', reason:'Aktives Sprechen ist aktuell noch unsicher.', priority:68, focusKeys:['skill:speaking'], exerciseIds:[] }

  if (fluencyConcern(progress) && exercises.length) return { kind:'strengthen', title:'Sicherer und flüssiger antworten', reason:'Richtige Antworten brauchten zuletzt viel Zeit oder Hilfe; bereits fällige Inhalte werden bevorzugt.', priority:65, focusKeys:['skill:fluency'], exerciseIds:dedupeExercisesByTarget(exercises.filter(exercise => exercise.type !== 'choice'), 8).map(exercise => exercise.id) }

  const budget = newWordBudget(progress)
  const lessonWords = vocabulary.filter(word => word.lesson === activeLesson)
  const unseen = lessonWords.filter(word => !progress.introducedWords.includes(word.id))
  return { kind:'new-content', title:`Weiter mit Lektion ${activeLesson}`, reason: unseen.length ? `${Math.min(budget, unseen.length)} neue Wörter statt unnötiger Wiederholungen.` : 'Es ist aktuell nichts regulär fällig; weiter geht es mit dem Kurs statt mit künstlichem Drill.', priority:50, lessonId:activeLesson, focusKeys:unseen.slice(0,budget).map(word => `vocab:${word.id}`), exerciseIds:dedupeExercisesByTarget(exercises.filter(exercise => exercise.lesson === activeLesson), 8).map(exercise => exercise.id) }
}

export function buildAdaptiveReviewDeck(progress: UserProgress, rawExercises: Exercise[], limit = 10, now = Date.now(), vocabulary: Vocabulary[] = []): Exercise[] {
  const exercises = eligible(progress, enrichExercises(rawExercises))
  const dueCurated = exercises.filter(exercise => exerciseHasDueTarget(exercise, progress, now))
  const dueGenerated = generatedDueReviews(progress, vocabulary, now)
  const recentIds = new Set((progress.recentAttempts || []).slice(-8).map(attempt => attempt.exerciseId))
  const pool = [...dueGenerated, ...dueCurated]
  const duePreferred = [...pool.filter(exercise => !recentIds.has(exercise.id)), ...pool.filter(exercise => recentIds.has(exercise.id))]
  let chosen = dedupeExercisesByTarget(duePreferred, limit)

  const transfer = injectDueTransfer(chosen, progress.transferQueue || [], exercises, progress.recentAttempts?.length || 0)
  chosen = dedupeExercisesByTarget(transfer.exercises.filter(exercise => exercise.generated || (isStrictlyAssessableExercise(exercise) && isExerciseEligible(exercise, progress))), limit)
  return chosen.slice(0, limit)
}

export function targetKeysForExercise(exercise: Exercise) {
  return inferTargetContentKeys(exercise)
}
