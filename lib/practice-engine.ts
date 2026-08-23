import { isExerciseEligible } from '@/lib/curriculum-access'
import { enrichExercises } from '@/lib/curriculum-metadata'
import { dedupeExercisesByTarget, exerciseHasDueTarget, inferTargetContentKeys } from '@/lib/learning-targets'
import { Exercise, SkillTarget, UserProgress, Vocabulary } from '@/types'

export type PracticeIntent = 'review-due' | 'repair-weakness' | 'active-recall' | 'recognition' | 'fluency'
export type VocabularyDirection = 'de-sl' | 'sl-de'

function masteryScore(progress: UserProgress, key: string) {
  return progress.mastery?.[key]?.score ?? .25
}

function mistakeCount(progress: UserProgress, key: string) {
  return (progress.mistakes || []).filter(item => item.key === key || item.key.includes(key.replace(/^\w+:/,''))).reduce((sum,item)=>sum+item.count,0)
}

export function vocabularyPracticeScore(word: Vocabulary, progress: UserProgress, now = Date.now()) {
  const key = `vocab:${word.id}`
  const review = progress.reviews.find(item => item.key === key)
  const mastery = progress.mastery?.[key]
  const due = review?.dueAt && review.dueAt <= now ? 100 : 0
  const mistakes = mistakeCount(progress,key) * 12
  const weakness = Math.round((1 - (mastery?.score ?? .25)) * 30)
  const age = review?.lastReviewedAt ? Math.min(20,Math.floor((now-review.lastReviewedAt)/86_400_000)) : 10
  return due + mistakes + weakness + age
}

export function rankVocabularyForPractice(words: Vocabulary[], progress: UserProgress, now = Date.now()) {
  const allowed = new Set([...progress.introducedWords,...progress.wordsLearned,...progress.secureWords])
  return words.filter(word=>allowed.has(word.id)).sort((a,b)=>vocabularyPracticeScore(b,progress,now)-vocabularyPracticeScore(a,progress,now))
}

export function chooseVocabularyDirection(word: Vocabulary, progress: UserProgress, attemptIndex = 0): VocabularyDirection {
  const vocab = progress.mastery?.[`vocab:${word.id}`]
  const production = progress.mastery?.['skill:production']
  const recognition = progress.mastery?.['skill:recognition']
  if ((recognition?.attempts || 0) >= 2 && (!production || production.score + .1 < recognition.score)) return 'de-sl'
  if ((vocab?.activeCorrect || 0) < Math.max(1,(vocab?.passiveCorrect || 0))) return 'de-sl'
  return attemptIndex % 3 === 2 ? 'sl-de' : 'de-sl'
}

export function choosePracticeIntent(progress: UserProgress, exercise: Exercise, now = Date.now()): PracticeIntent {
  if (exerciseHasDueTarget(exercise,progress,now)) return 'review-due'
  const targets = inferTargetContentKeys(exercise)
  if (targets.some(key=>masteryScore(progress,key)<.55 || mistakeCount(progress,key)>=2)) return 'repair-weakness'
  if (exercise.skillTargets?.includes('production') || exercise.skillTargets?.includes('speaking')) return 'active-recall'
  if (exercise.skillTargets?.includes('recognition')) return 'recognition'
  return 'fluency'
}

function exerciseScore(progress: UserProgress, exercise: Exercise, now = Date.now()) {
  const intent = choosePracticeIntent(progress,exercise,now)
  const intentWeight: Record<PracticeIntent,number> = { 'review-due':120,'repair-weakness':90,'active-recall':55,recognition:35,fluency:25 }
  const targets = inferTargetContentKeys(exercise)
  const weakest = targets.length ? Math.min(...targets.map(key=>masteryScore(progress,key))) : .5
  const recent = new Set((progress.recentAttempts||[]).slice(-6).map(item=>item.exerciseId))
  return intentWeight[intent] + Math.round((1-weakest)*30) - (recent.has(exercise.id)?18:0)
}

export function buildPracticeDeck(progress: UserProgress, rawExercises: Exercise[], limit: number, now = Date.now()) {
  const eligible = enrichExercises(rawExercises).filter(exercise=>isExerciseEligible(exercise,progress))
  const ranked = [...eligible].sort((a,b)=>exerciseScore(progress,b,now)-exerciseScore(progress,a,now))
  return dedupeExercisesByTarget(ranked,limit).slice(0,limit)
}

export function primarySkillForDirection(direction: VocabularyDirection): SkillTarget {
  return direction === 'de-sl' ? 'production' : 'recognition'
}

export function introducedVerbFormKeys(progress: UserProgress) {
  return new Set(progress.introducedVerbForms)
}
