import type { ExerciseAttempt, UserProgress } from '@/types'

export interface ProgressRepository {
  loadLearnerState(profileId: string): Promise<UserProgress>
  saveLearnerState(profileId: string, state: UserProgress): Promise<void>
  recordAttempt(attempt: ExerciseAttempt): Promise<void>
  syncProgress(profileId: string): Promise<{ state: UserProgress; syncedAt: number }>
}

/**
 * Contract for a future authenticated cloud repository. The adaptive engine must only
 * depend on this interface, never directly on a particular database vendor.
 *
 * Recommended merge strategy: attempts are immutable events with unique IDs. Merge
 * event sets first, then derive/master learning state; never overwrite a newer whole
 * state with an older device snapshot.
 */
export type SyncEnvelope = {
  profileId: string
  revision: number
  updatedAt: number
  state: UserProgress
  attempts: ExerciseAttempt[]
}
