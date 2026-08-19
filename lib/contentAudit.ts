import type { Exercise } from '@/types'

export type ContentAuditIssue = {
  severity: 'error' | 'warning'
  code: 'duplicate-id' | 'missing-intro-translation' | 'missing-intro-target' | 'unsafe-production' | 'missing-content-key' | 'missing-learning-target'
  exerciseId: string
  message: string
}

const PRODUCTIVE_TYPES = new Set<Exercise['type']>(['translate-de-sl', 'free', 'ending', 'listen-answer', 'speak-answer', 'transform'])

function isProductive(exercise: Exercise) {
  return exercise.learningPhase === 'production' || exercise.learningPhase === 'transfer' || PRODUCTIVE_TYPES.has(exercise.type)
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

    if (isProductive(exercise) && !(exercise.requiredVocabulary?.length || exercise.requiredGrammar?.length || exercise.requiredLearningItems?.length)) {
      issues.push({ severity:'error', code:'unsafe-production', exerciseId:exercise.id, message:'Produktionsaufgabe kann ihre Voraussetzungen nicht beweisen.' })
    }
  }

  return issues
}

export function auditErrors(exercises: Exercise[]) {
  return auditAdaptiveContent(exercises).filter(issue => issue.severity === 'error')
}
