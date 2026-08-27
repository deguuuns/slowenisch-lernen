import { verbFormKey } from '@/lib/curriculum-access'
import { Exercise, TargetContentKey, UserProgress } from '@/types'

function unique<T>(items: T[]) { return Array.from(new Set(items)) }

export function inferTargetContentKeys(exercise: Exercise): TargetContentKey[] {
  if (exercise.targetContentKeys?.length) return unique(exercise.targetContentKeys)
  if (exercise.verbPractice && exercise.requiredVerbForms?.length) return [`verb:${verbFormKey(exercise.requiredVerbForms[0])}` as TargetContentKey]
  if (exercise.grammarRuleIds?.length) return [`grammar:${exercise.grammarRuleIds[0]}` as TargetContentKey]
  if (exercise.vocabularyIds?.length) return [`vocab:${exercise.vocabularyIds[0]}` as TargetContentKey]
  if (exercise.requiredVerbForms?.length) return [`verb:${verbFormKey(exercise.requiredVerbForms[0])}` as TargetContentKey]
  return []
}

export function inferSupportingContentKeys(exercise: Exercise): TargetContentKey[] {
  if (exercise.supportingContentKeys?.length) return unique(exercise.supportingContentKeys)
  const targets = new Set(inferTargetContentKeys(exercise))
  return unique([
    ...(exercise.vocabularyIds || []).map(id => `vocab:${id}` as TargetContentKey),
    ...(exercise.grammarRuleIds || []).map(id => `grammar:${id}` as TargetContentKey),
    ...(exercise.requiredVerbForms || []).map(requirement => `verb:${verbFormKey(requirement)}` as TargetContentKey),
  ].filter(key => !targets.has(key)))
}

export function withTargetMetadata(exercise: Exercise): Exercise {
  return { ...exercise, targetContentKeys: inferTargetContentKeys(exercise), supportingContentKeys: inferSupportingContentKeys(exercise) }
}

function normalizeSemanticText(value:string){
  return value.toLocaleLowerCase('sl').normalize('NFKC').replace(/[„“”"'!?.,;:()[\]{}]/g,' ').replace(/\s+/g,' ').trim()
}

/**
 * Identifies exercises that are effectively the same learning event even when ids or
 * superficial wording differ. Exercise type is intentionally omitted: changing the card
 * chrome must not make the same prompt/answer pair count as a fresh task.
 */
export function exerciseSemanticFingerprint(exercise:Exercise){
  const targets=inferTargetContentKeys(exercise).slice().sort().join('|')
  const vocab=(exercise.vocabularyIds||[]).slice().sort().join('|')
  const grammar=(exercise.grammarRuleIds||[]).slice().sort().join('|')
  const prompt=normalizeSemanticText(exercise.prompt)
  const answer=normalizeSemanticText(exercise.answer)
  return [targets,vocab,grammar,prompt,answer].join('::')
}

/** Broader fingerprint catches repeated recall of the same atom with slightly different wording. */
export function exerciseConceptFingerprint(exercise:Exercise){
  const targets=inferTargetContentKeys(exercise).slice().sort().join('|')
  const vocab=(exercise.vocabularyIds||[]).slice().sort().join('|')
  const answer=normalizeSemanticText(exercise.answer)
  return [targets||vocab,answer].join('::')
}

export function dedupeExercisesSemantically(exercises:Exercise[],limit=Number.POSITIVE_INFINITY,allowCrossPhase=false){
  const usedExact=new Set<string>()
  const usedConcept=new Set<string>()
  const selected:Exercise[]=[]
  for(const exercise of exercises){
    const exact=exerciseSemanticFingerprint(exercise)
    const concept=exerciseConceptFingerprint(exercise)
    if(usedExact.has(exact))continue
    if(!allowCrossPhase&&usedConcept.has(concept))continue
    selected.push(withTargetMetadata(exercise))
    usedExact.add(exact);usedConcept.add(concept)
    if(selected.length>=limit)break
  }
  return selected
}

export function reviewForKey(progress: UserProgress, key: string) { return (progress.reviews || []).find(review => review.key === key) }
export function isReviewDue(progress: UserProgress, key: string, now = Date.now()) { const review = reviewForKey(progress, key); return Boolean(review && review.dueAt <= now) }
export function exerciseHasDueTarget(exercise: Exercise, progress: UserProgress, now = Date.now()) { return inferTargetContentKeys(exercise).some(key => isReviewDue(progress, key, now)) }

export function dedupeExercisesByTarget(exercises: Exercise[], limit = Number.POSITIVE_INFINITY) {
  const usedTargets = new Set<string>()
  const selected: Exercise[] = []
  for (const exercise of exercises) {
    const targets = inferTargetContentKeys(exercise)
    if (targets.length && targets.some(target => usedTargets.has(target))) continue
    selected.push(withTargetMetadata(exercise))
    targets.forEach(target => usedTargets.add(target))
    if (selected.length >= limit) break
  }
  return selected
}

export function isCanonicalReviewKey(key: string) { return /^(vocab|grammar|verb|skill):/.test(key) }
