import { isExerciseEligible } from '@/lib/curriculum-access'
import { enrichExercises } from '@/lib/curriculum-metadata'
import { expandExerciseVariety, presentationVarietyBonus } from '@/lib/exercise-variety'
import { dedupeExercisesByTarget, exerciseHasDueTarget, inferTargetContentKeys } from '@/lib/learning-targets'
import { verbCatalog, VerbForm } from '@/lib/verb-catalog'
import { Exercise, SkillTarget, UserProgress, Vocabulary } from '@/types'

export type PracticeIntent = 'review-due' | 'repair-weakness' | 'active-recall' | 'recognition' | 'fluency'
export type VocabularyDirection = 'de-sl' | 'sl-de'
export type VerbPracticeCandidate = { verbId:string; infinitive:string; translation:string; form:VerbForm; key:string; score:number }

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
  return intentWeight[intent] + Math.round((1-weakest)*30) + presentationVarietyBonus(progress,exercise) - (recent.has(exercise.id)?18:0)
}

export function buildPracticeDeck(progress: UserProgress, rawExercises: Exercise[], limit: number, now = Date.now()) {
  const varied = expandExerciseVariety(rawExercises)
  const eligible = enrichExercises(varied).filter(exercise=>isExerciseEligible(exercise,progress))
  const ranked = [...eligible].sort((a,b)=>exerciseScore(progress,b,now)-exerciseScore(progress,a,now))
  return dedupeExercisesByTarget(ranked,limit).slice(0,limit)
}

export function primarySkillForDirection(direction: VocabularyDirection): SkillTarget {
  return direction === 'de-sl' ? 'production' : 'recognition'
}

export function introducedVerbFormKeys(progress: UserProgress) {
  return new Set(progress.introducedVerbForms)
}

function verbPracticeScore(progress:UserProgress,key:string,now=Date.now()){
  const target=`verb:${key}`
  const mastery=progress.mastery?.[target]
  const review=progress.reviews.find(item=>item.key===target||item.key===key)
  const due=review?.dueAt&&review.dueAt<=now?100:0
  const weak=Math.round((1-(mastery?.score??.25))*35)
  const mistakes=mistakeCount(progress,target)*14
  const activeGap=Math.max(0,2-(mastery?.activeCorrect||0))*8
  const age=review?.lastReviewedAt?Math.min(15,Math.floor((now-review.lastReviewedAt)/86_400_000)):8
  return due+weak+mistakes+activeGap+age
}

export function rankIntroducedVerbForms(progress:UserProgress,now=Date.now()):VerbPracticeCandidate[]{
  const introduced=introducedVerbFormKeys(progress)
  const candidates:VerbPracticeCandidate[]=[]
  for(const verb of verbCatalog){
    for(const form of verb.forms){
      const key=`${verb.id}:${form.number}:${form.person}`
      if(!introduced.has(key))continue
      candidates.push({verbId:verb.id,infinitive:verb.infinitive,translation:verb.translation,form,key,score:verbPracticeScore(progress,key,now)})
    }
  }
  return candidates.sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key))
}
