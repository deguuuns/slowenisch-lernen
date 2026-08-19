import test from 'node:test'
import assert from 'node:assert/strict'
import { beginnerExercises } from '../data/beginnerContent'
import { beginnerReinforcementExercises } from '../data/beginnerReinforcement'
import { foundationExercises } from '../data/foundationCurriculum'
import { exercises as diverseExercises } from '../data/diverseContent'
import { getCurrentBeginnerPhase } from '../data/beginnerCurriculum'
import { evaluateExerciseAnswerability } from '../lib/answerability'
import { createSessionState, registerSessionOutcome, selectNextExercise } from '../lib/learningEngine'
import { updateLearnerStateWithHelp } from '../lib/masteryWithHelp'
import { registerIntroductions } from '../lib/prerequisites'
import { eligibleAdaptiveContent } from '../lib/sessionEligibility'
import type { LearnerProfile, UserProgress } from '../types'

const profile: LearnerProfile = {
  id:'simulation', name:'Beginner', startMode:'zero', approximateLevel:'A1', onboardingCompleted:true, placementCompleted:true, createdAt:1, updatedAt:1,
}

const all = [...beginnerExercises, ...beginnerReinforcementExercises, ...foundationExercises, ...diverseExercises]

function emptyProgress(): UserProgress {
  return {
    schemaVersion:4, resetGeneration:1, progressResetAt:1,
    completedLessons:[], streak:1, wordsLearned:[], secureWords:[], mistakes:[], reviews:[], speakingMinutes:0, listeningMinutes:0,
    introducedVocabulary:[], introducedGrammar:[], skillXp:{}, learningItems:{}, recentSessionHistory:[],
  }
}

test('30 seeded zero-knowledge runs never select an unanswerable or legacy production task', () => {
  for (let seed = 1; seed <= 30; seed++) {
    let progress = emptyProgress()
    let session = createSessionState()
    session.startedAt = seed * 10_000
    let now = new Date(2026, 7, 19, 9, 0, 0).getTime()
    let steps = 0

    while (getCurrentBeginnerPhase(progress).id <= 10 && steps < 180) {
      const pool = eligibleAdaptiveContent(all, progress, session, profile, now)
      const candidate = selectNextExercise(progress, pool, session)

      if (!candidate) {
        session = createSessionState()
        session.startedAt = seed * 10_000 + steps + 1
        now += 24 * 60 * 60_000
        steps++
        continue
      }

      const exercise = candidate.exercise
      const answerability = evaluateExerciseAnswerability(exercise, progress)
      assert.equal(answerability.eligible, true, `seed ${seed}, step ${steps}, ${exercise.id}: ${answerability.reasons.join(', ')}`)
      assert.notEqual(exercise.id, 'e07', `legacy Kje si zdaj leaked for seed ${seed}`)
      if (exercise.type !== 'introduce') {
        assert.ok(exercise.curriculumPhase, `unversioned exercise leaked: ${exercise.id}`)
      }

      if (exercise.type === 'introduce') {
        progress = registerIntroductions(progress, exercise)
      } else {
        progress = updateLearnerStateWithHelp(progress, exercise, { correct:true, responseMs:900, hintsUsed:0 }, now)
      }
      session = registerSessionOutcome(session, candidate, { correct:true, responseMs:900 })

      steps++
      now += 25 * 60 * 60_000
      if (session.answered >= 12) {
        session = createSessionState()
        session.startedAt = seed * 10_000 + steps
      }
    }

    assert.ok(steps < 180, `seed ${seed} did not make curriculum progress`)
  }
})
