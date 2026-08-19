import type { Exercise } from '@/types'

export type ContentAuditIssue = {
  severity: 'error' | 'warning'
  code:
    | 'duplicate-id'
    | 'missing-intro-translation'
    | 'missing-intro-target'
    | 'unsafe-production'
    | 'missing-production-stage'
    | 'missing-content-key'
    | 'missing-learning-target'
    | 'legacy-requirements-unknown'
  exerciseId: string
  message: string
}

const PRODUCTIVE_TYPES = new Set<Exercise['type']>(['translate-de-sl', 'free', 'ending', 'listen-answer', 'speak-answer', 'transform'])

function isProductive(exercise: Exercise) {
  return exercise.learningPhase === 'production' || exercise.learningPhase === 'transfer' || PRODUCTIVE_TYPES.has(exercise.type)
}

function hasVocabularyRequirements(exercise: Exercise) {
  return !!(exercise.requiredVocabulary?.length || exercise.requiredInputVocabulary?.length || exercise.requiredOutputVocabulary?.length)
}

function hasStructuralRequirements(exercise: Exercise) {
  return !!(
    exercise.requiredChunks?.length ||
    exercise.requiredGrammar?.length ||
    exercise.requiredVerbForms?.length ||
    exercise.requiredSentencePatterns?.length ||
    exercise.requiredLearningItems?.length
  )
}

export function auditAdaptiveContent(exercises: Exercise[]): ContentAuditIssue[] {
  const issues: ContentAuditIssue[] = []
  const ids = new Set<string>()

  for (const exercise of exercises) {
    if (ids.has(exercise.id)) {
      issues.push({ severity:'error', code:'duplicate-id', exerciseId:exercise.id, message:'Exercise-ID ist mehrfach vorhanden.' })
    }
    ids.add(exercise.id)

    if (!exercise.contentKey) {
      issues.push({ severity:'warning', code:'missing-content-key', exerciseId:exercise.id, message:'Kein contentKey für Anti-Repetition vorhanden.' })
    }

    if (!exercise.learningTargets?.length) {
      issues.push({ severity:'warning', code:'missing-learning-target', exerciseId:exercise.id, message:'Kein explizites Lernziel vorhanden.' })
    }

    if (exercise.type === 'introduce') {
      if (!exercise.introSl?.trim() || !exercise.introDe?.trim()) {
        issues.push({ severity:'error', code:'missing-intro-translation', exerciseId:exercise.id, message:'Einführung braucht slowenischen Inhalt und deutsche Bedeutung.' })
      }
      if (!(exercise.introducesVocabulary?.length || exercise.introducesGrammar?.length)) {
        issues.push({ severity:'error', code:'missing-intro-target', exerciseId:exercise.id, message:'Einführung führt kein explizites Lernobjekt ein.' })
      }
    }

    if (isProductive(exercise)) {
      if (!hasVocabularyRequirements(exercise) || (!exercise.requirementsComplete && !hasStructuralRequirements(exercise))) {
        issues.push({ severity:'error', code:'unsafe-production', exerciseId:exercise.id, message:'Produktionsaufgabe kann Input/Output-Voraussetzungen nicht vollständig beweisen.' })
      }
      if (!exercise.requiredTargetStage && !exercise.requiredLearningItems?.length && !exercise.requiredSentencePatterns?.length) {
        issues.push({ severity:'error', code:'missing-production-stage', exerciseId:exercise.id, message:'Produktionsaufgabe besitzt keinen Nachweis für Recall-/Production-Bereitschaft.' })
      }
    }

    const unversionedLegacy = exercise.type !== 'introduce'
      && exercise.curriculumPhase === undefined
      && exercise.learningPhase === undefined
      && !hasVocabularyRequirements(exercise)
      && !hasStructuralRequirements(exercise)
    if (unversionedLegacy) {
      issues.push({ severity:'warning', code:'legacy-requirements-unknown', exerciseId:exercise.id, message:'Legacy-Aufgabe besitzt keine ausreichende didaktische Requirements-Klassifikation.' })
    }
  }

  return issues
}

export function auditErrors(exercises: Exercise[]) {
  return auditAdaptiveContent(exercises).filter(issue => issue.severity === 'error')
}
