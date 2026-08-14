'use client'

import type { LearnerProfile, LearningItemState, ReviewItem, UserProgress } from '@/types'
import { defaultProgress, loadProgress, saveProgress } from './storage'
import { listProfiles, replaceProfiles, upsertLocalProfile } from './profileStorage'
import { getValidSupabaseSession, supabaseRest } from './supabaseHttp'

type CloudProfile = {
  id: string
  user_id: string
  client_profile_id: string
  name: string
  start_mode: LearnerProfile['startMode']
  self_assessment?: LearnerProfile['selfAssessment'] | null
  approximate_level: LearnerProfile['approximateLevel']
  onboarding_completed: boolean
  placement_completed: boolean
  created_at: string
  updated_at: string
}

type CloudState = {
  state: UserProgress
  revision: number
  updated_at: string
}

function toLocalProfile(row: CloudProfile): LearnerProfile {
  return {
    id: row.client_profile_id,
    name: row.name,
    startMode: row.start_mode,
    selfAssessment: row.self_assessment ?? undefined,
    approximateLevel: row.approximate_level,
    onboardingCompleted: row.onboarding_completed,
    placementCompleted: row.placement_completed,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
  }
}

function mergeReview(a: ReviewItem | undefined, b: ReviewItem | undefined): ReviewItem | undefined {
  if (!a) return b
  if (!b) return a
  const newer = (a.lastReviewedAt ?? 0) >= (b.lastReviewedAt ?? 0) ? a : b
  return {
    ...newer,
    correctCount: Math.max(a.correctCount ?? 0, b.correctCount ?? 0),
    incorrectCount: Math.max(a.incorrectCount ?? 0, b.incorrectCount ?? 0),
    intervalIndex: Math.max(a.intervalIndex, b.intervalIndex),
    dueAt: Math.max(a.dueAt, b.dueAt),
  }
}

function mergeLearningItem(a: LearningItemState | undefined, b: LearningItemState | undefined): LearningItemState | undefined {
  if (!a) return b
  if (!b) return a
  const newer = (a.lastSeenAt ?? 0) >= (b.lastSeenAt ?? 0) ? a : b
  return {
    ...newer,
    attempts: Math.max(a.attempts, b.attempts),
    correctCount: Math.max(a.correctCount, b.correctCount),
    incorrectCount: Math.max(a.incorrectCount, b.incorrectCount),
    mastery: Math.max(a.mastery, b.mastery),
    receptiveMastery: Math.max(a.receptiveMastery ?? 0, b.receptiveMastery ?? 0),
    productiveMastery: Math.max(a.productiveMastery ?? 0, b.productiveMastery ?? 0),
    introduced: !!(a.introduced || b.introduced),
  }
}

export function mergeProgress(local: UserProgress, cloud: UserProgress): UserProgress {
  const reviewKeys = Array.from(new Set([...local.reviews.map(x => x.key), ...cloud.reviews.map(x => x.key)]))
  const itemKeys = Array.from(new Set([...Object.keys(local.learningItems ?? {}), ...Object.keys(cloud.learningItems ?? {})]))
  const recent = [...(cloud.recentSessionHistory ?? []), ...(local.recentSessionHistory ?? [])]
    .sort((a,b) => a.timestamp - b.timestamp)
    .filter((item, index, all) => all.findIndex(other => other.exerciseId === item.exerciseId && other.timestamp === item.timestamp) === index)
    .slice(-80)

  return {
    ...defaultProgress,
    ...cloud,
    ...local,
    completedLessons: Array.from(new Set([...cloud.completedLessons, ...local.completedLessons])),
    wordsLearned: Array.from(new Set([...cloud.wordsLearned, ...local.wordsLearned])),
    secureWords: Array.from(new Set([...cloud.secureWords, ...local.secureWords])),
    introducedVocabulary: Array.from(new Set([...(cloud.introducedVocabulary ?? []), ...(local.introducedVocabulary ?? [])])),
    introducedGrammar: Array.from(new Set([...(cloud.introducedGrammar ?? []), ...(local.introducedGrammar ?? [])])),
    mistakes: Array.from(new Set([...cloud.mistakes.map(x => x.key), ...local.mistakes.map(x => x.key)])).map(key => {
      const a = cloud.mistakes.find(x => x.key === key)
      const b = local.mistakes.find(x => x.key === key)
      return (a?.lastSeen ?? 0) >= (b?.lastSeen ?? 0) ? a! : b!
    }),
    reviews: reviewKeys.map(key => mergeReview(local.reviews.find(x => x.key === key), cloud.reviews.find(x => x.key === key))!).filter(Boolean),
    learningItems: Object.fromEntries(itemKeys.map(key => [key, mergeLearningItem(local.learningItems?.[key], cloud.learningItems?.[key])]).filter(([,value]) => !!value)),
    recentSessionHistory: recent,
    speakingMinutes: Math.max(local.speakingMinutes, cloud.speakingMinutes),
    listeningMinutes: Math.max(local.listeningMinutes, cloud.listeningMinutes),
    totalLearningMinutes: Math.max(local.totalLearningMinutes ?? 0, cloud.totalLearningMinutes ?? 0),
    lastSessionAt: Math.max(local.lastSessionAt ?? 0, cloud.lastSessionAt ?? 0) || undefined,
    skillXp: Object.fromEntries(['lesen','hören','schreiben','sprechen','grammatik','wortschatz'].map(skill => [skill, Math.max((local.skillXp as any)?.[skill] ?? 0, (cloud.skillXp as any)?.[skill] ?? 0)])),
  }
}

async function ensureCloudProfile(profile: LearnerProfile): Promise<CloudProfile> {
  const session = await getValidSupabaseSession()
  if (!session) throw new Error('Nicht angemeldet.')
  const rows = await supabaseRest<CloudProfile[]>('learner_profiles?on_conflict=user_id,client_profile_id', {
    method: 'POST',
    body: JSON.stringify({
      user_id: session.user.id,
      client_profile_id: profile.id,
      name: profile.name,
      start_mode: profile.startMode,
      self_assessment: profile.selfAssessment ?? null,
      approximate_level: profile.approximateLevel,
      onboarding_completed: profile.onboardingCompleted,
      placement_completed: !!profile.placementCompleted,
      updated_at: new Date(profile.updatedAt).toISOString(),
    }),
  })
  return rows[0]
}

export async function syncProfile(profile: LearnerProfile, localState?: UserProgress) {
  const session = await getValidSupabaseSession()
  if (!session) return null
  const cloudProfile = await ensureCloudProfile(profile)
  const stateRows = await supabaseRest<CloudState[]>(`learner_states?profile_id=eq.${cloudProfile.id}&select=state,revision,updated_at&limit=1`)
  const local = localState ?? loadProgress(profile.id)
  const cloud = stateRows[0]?.state ?? defaultProgress
  const merged = mergeProgress(local, cloud)
  saveProgress(merged, profile.id, { silent: true })

  await supabaseRest('learner_states?on_conflict=user_id,profile_id', {
    method: 'POST',
    body: JSON.stringify({
      user_id: session.user.id,
      profile_id: cloudProfile.id,
      state: merged,
      revision: (stateRows[0]?.revision ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }),
  })
  return merged
}

export async function pushProfileState(profile: LearnerProfile, state: UserProgress) {
  return syncProfile(profile, state)
}

export async function syncAllProfiles() {
  const session = await getValidSupabaseSession()
  if (!session) return { profiles: listProfiles(), imported: 0 }

  const cloudProfiles = await supabaseRest<CloudProfile[]>('learner_profiles?select=*&order=created_at.asc')
  const localProfiles = listProfiles()

  if (localProfiles.length === 0 && cloudProfiles.length > 0) {
    const imported = cloudProfiles.map(toLocalProfile)
    replaceProfiles(imported)
    for (const row of cloudProfiles) {
      const states = await supabaseRest<CloudState[]>(`learner_states?profile_id=eq.${row.id}&select=state,revision,updated_at&limit=1`)
      if (states[0]?.state) saveProgress(states[0].state, row.client_profile_id, { silent: true })
    }
    return { profiles: imported, imported: imported.length }
  }

  for (const profile of localProfiles) {
    upsertLocalProfile(profile)
    await syncProfile(profile)
  }

  const known = new Set(localProfiles.map(p => p.id))
  let importedCount = 0
  for (const row of cloudProfiles.filter(row => !known.has(row.client_profile_id))) {
    const profile = toLocalProfile(row)
    upsertLocalProfile(profile)
    const states = await supabaseRest<CloudState[]>(`learner_states?profile_id=eq.${row.id}&select=state,revision,updated_at&limit=1`)
    if (states[0]?.state) saveProgress(states[0].state, profile.id, { silent: true })
    importedCount += 1
  }

  return { profiles: listProfiles(), imported: importedCount }
}
