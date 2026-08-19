import test from 'node:test'
import assert from 'node:assert/strict'
import { beginnerExercises } from '../data/beginnerContent'
import { beginnerReinforcementExercises } from '../data/beginnerReinforcement'
import { foundationExercises } from '../data/foundationCurriculum'
import { exercises as diverseExercises } from '../data/diverseContent'
import { evaluateExerciseAnswerability } from '../lib/answerability'
import { createSessionState } from '../lib/learningEngine'
import { registerIntroductions } from '../lib/prerequisites'
import { eligibleAdaptiveContent, isEligibleForAdaptiveSession, requiresCurriculumSafety } from '../lib/sessionEligibility'
import type { Exercise, LearnerProfile, LearningItemState, UserProgress } from '../types'

const selfAssessmentProfile: LearnerProfile = {
  id:'old-profile', name:'Test', startMode:'self-assessment', approximateLevel:'A1', onboardingCompleted:true, placementCompleted:true, createdAt:1, updatedAt:1,
}

function emptyProgress(overrides: Partial<UserProgress> = {}): UserProgress {
  return {
    schemaVersion:4,
    resetGeneration:1,
    progressResetAt:Date.now(),
    completedLessons:[], streak:1, wordsLearned:[], secureWords:[], mistakes:[], reviews:[], speakingMinutes:0, listeningMinutes:0,
    introducedVocabulary:[], introducedGrammar:[], skillXp:{}, learningItems:{}, recentSessionHistory:[], ...overrides,
  }
}

function learned(key: string, stage: LearningItemState['stage']): LearningItemState {
  return {
    key, kind:key.startsWith('pattern:') ? 'pattern' : key.startsWith('chunk:') ? 'chunk' : key.startsWith('grammar:') ? 'grammar' : 'vocabulary',
    stage, introduced:true, attempts:2, correctCount:2, incorrectCount:0, correctStreak:2, incorrectStreak:0,
    mastery:0.55, difficulty:1, receptiveMastery:stage === 'introduced' ? 0.08 : 0.4, recallMastery:stage === 'recall' || stage === 'production' ? 0.35 : 0, productiveMastery:stage === 'production' ? 0.3 : 0,
  }
}

test('explicit reset keeps curriculum safety enabled even on an old self-assessment profile', () => {
  let progress = emptyProgress()
  for (const id of ['zivjo','hvala','prosim','ja','ne']) {
    const intro = beginnerExercises.find(item => item.id === id)
    assert.ok(intro)
    progress = registerIntroductions(progress, intro)
  }
  assert.equal(requiresCurriculumSafety(progress, selfAssessmentProfile), true)
})

test('legacy Kje si zdaj free-production is blocked after reset instead of leaking into step 6', () => {
  const legacy = diverseExercises.find(item => item.id === 'e07')
  assert.ok(legacy)
  const progress = emptyProgress({ introducedVocabulary:['živjo','hvala','prosim','ja','ne'] })
  const result = evaluateExerciseAnswerability(legacy, progress)
  assert.equal(result.eligible, false)
  assert.ok(result.reasons.some(reason => reason.startsWith('production:')))
  assert.equal(isEligibleForAdaptiveSession(legacy, progress, createSessionState(), selfAssessmentProfile, Date.now(), diverseExercises), false)
})

test('a production question checks input language and a producible answer structure separately', () => {
  const exercise: Exercise = {
    id:'kje-si-zdaj-safe', lesson:1, type:'free', prompt:'Antworte: Kje si zdaj?', answer:'Sem doma.', evaluationMode:'free',
    level:'A1', skills:['schreiben'], learningPhase:'production', curriculumPhase:8, contentKey:'kje-si-zdaj-safe',
    learningTargets:['pattern:sem-location'], requiredTargetStage:'recall', requirementsComplete:true,
    requiredInputVocabulary:['kje','si','zdaj'], requiredOutputVocabulary:['sem','doma'], requiredChunks:['Kje si?'],
    requiredSentencePatterns:['pattern:sem-location'],
  }
  let progress = emptyProgress({ introducedVocabulary:['kje','si','sem','doma'], learningItems:{
    'pattern:sem-location': learned('pattern:sem-location','recall'),
    'chunk:kje-si': learned('chunk:kje-si','recognition'),
  }})
  const blocked = evaluateExerciseAnswerability(exercise, progress)
  assert.equal(blocked.eligible, false)
  assert.ok(blocked.reasons.includes('input-vocabulary:zdaj:not-introduced'))

  progress = { ...progress, introducedVocabulary:[...(progress.introducedVocabulary ?? []),'zdaj'] }
  const ready = evaluateExerciseAnswerability(exercise, progress)
  assert.equal(ready.eligible, true)
})

test('an introduction without German meaning is blocked globally', () => {
  const bad: Exercise = {
    id:'bad-intro', lesson:1, type:'introduce', prompt:'Neu', answer:'hiša', introSl:'hiša', introDe:'',
    introducesVocabulary:['hiša'], learningTargets:['vocab:hiša'], contentKey:'bad-intro', learningPhase:'new', curriculumPhase:11,
  }
  const result = evaluateExerciseAnswerability(bad, emptyProgress())
  assert.equal(result.eligible, false)
  assert.ok(result.reasons.includes('introduction:missing-german-meaning'))
})

test('multiword introductions create a modern chunk alias as well as the legacy vocab key', () => {
  const intro = beginnerExercises.find(item => item.id === 'dober-dan')
  assert.ok(intro)
  const progress = registerIntroductions(emptyProgress(), intro)
  assert.ok(progress.learningItems?.['vocab:dober dan'])
  assert.ok(progress.learningItems?.['chunk:dober-dan'])
})

test('all adaptive fallback candidates still pass the same answerability gate for an empty reset learner', () => {
  const all = [...beginnerExercises, ...beginnerReinforcementExercises, ...foundationExercises, ...diverseExercises]
  const progress = emptyProgress()
  const eligible = eligibleAdaptiveContent(all, progress, createSessionState(), selfAssessmentProfile)
  assert.ok(eligible.length > 0)
  for (const exercise of eligible) {
    const result = evaluateExerciseAnswerability(exercise, progress)
    assert.equal(result.eligible, true, `${exercise.id}: ${result.reasons.join(', ')}`)
    assert.equal(exercise.type, 'introduce')
    assert.ok(exercise.introDe?.trim())
  }
})
