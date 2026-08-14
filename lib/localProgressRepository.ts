'use client'

import type { ExerciseAttempt } from '@/types'
import type { ProgressRepository } from './progressRepository'
import { loadProgress, saveProgress } from './storage'

const ATTEMPT_KEY = 'slovensko-attempts-v1'

function readAttempts(profileId: string): ExerciseAttempt[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`${ATTEMPT_KEY}:${profileId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const localProgressRepository: ProgressRepository = {
  async loadLearnerState(profileId) {
    return loadProgress(profileId)
  },
  async saveLearnerState(profileId, state) {
    saveProgress(state, profileId)
  },
  async recordAttempt(attempt) {
    if (typeof window === 'undefined') return
    const attempts = readAttempts(attempt.profileId)
    if (attempts.some(item => item.id === attempt.id)) return
    localStorage.setItem(`${ATTEMPT_KEY}:${attempt.profileId}`, JSON.stringify([...attempts, attempt].slice(-3000)))
  },
  async syncProgress(profileId) {
    return { state: loadProgress(profileId), syncedAt: Date.now() }
  },
}

export function listLocalAttempts(profileId: string) {
  return readAttempts(profileId)
}
