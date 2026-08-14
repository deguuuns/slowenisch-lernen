import test from 'node:test'
import assert from 'node:assert/strict'
import { knowledgeStage, updateLearnerStateWithHelp } from '../lib/masteryWithHelp'
import type { Exercise, UserProgress } from '../types'

const exercise: Exercise = {
  id:'help-test', lesson:1, type:'fill', prompt:'Ti ___ doma.', answer:'si', level:'A1', difficulty:1,
  skills:['grammatik'], learningTargets:['conjugation:biti:ti'], contentKey:'help-test', contextTag:'biti',
}

function progress(): UserProgress {
  return {
    schemaVersion:4, completedLessons:[], streak:1, wordsLearned:[], secureWords:[], introducedVocabulary:['si'], introducedGrammar:['biti-basic'],
    mistakes:[], reviews:[], speakingMinutes:0, listeningMinutes:0, skillXp:{}, learningItems:{}, recentSessionHistory:[],
  }
}

test('correct answer without help gains more mastery than answer after hints', () => {
  const clean = updateLearnerStateWithHelp(progress(), exercise, { correct:true, responseMs:2500, hintsUsed:0 }, 1000)
  const helped = updateLearnerStateWithHelp(progress(), exercise, { correct:true, responseMs:2500, hintsUsed:2 }, 1000)
  assert.ok((clean.learningItems?.['exercise:help-test']?.mastery ?? 0) > (helped.learningItems?.['exercise:help-test']?.mastery ?? 0))
  assert.equal(helped.learningItems?.['exercise:help-test']?.lastHintsUsed, 2)
})

test('knowledge stages progress from unseen to mastered and review due', () => {
  assert.equal(knowledgeStage(undefined), 'unseen')
  assert.equal(knowledgeStage({ key:'x', kind:'vocabulary', attempts:1, correctCount:0, incorrectCount:1, correctStreak:0, incorrectStreak:1, mastery:0.1, difficulty:1 }), 'introduced')
  assert.equal(knowledgeStage({ key:'x', kind:'vocabulary', attempts:5, correctCount:5, incorrectCount:0, correctStreak:3, incorrectStreak:0, mastery:0.9, difficulty:1, nextDueAt:9999999999999 }), 'mastered')
  assert.equal(knowledgeStage({ key:'x', kind:'vocabulary', attempts:5, correctCount:5, incorrectCount:0, correctStreak:3, incorrectStreak:0, mastery:0.9, difficulty:1, nextDueAt:1 }, 2), 'review_due')
})
