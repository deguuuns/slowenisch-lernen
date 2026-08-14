'use client'

import type { CEFRLevel, LearnerProfile, SelfAssessmentLevel, StartMode } from '@/types'

const PROFILES_KEY = 'slovensko-profiles-v1'
const ACTIVE_PROFILE_KEY = 'slovensko-active-profile'

function readProfiles(): LearnerProfile[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeProfiles(profiles: LearnerProfile[]) {
  if (typeof window !== 'undefined') localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

export function listProfiles() {
  return readProfiles()
}

export function replaceProfiles(profiles: LearnerProfile[]) {
  writeProfiles(profiles)
  const active = getActiveProfile()
  if (!active && profiles[0]) setActiveProfile(profiles[0].id)
}

export function upsertLocalProfile(profile: LearnerProfile) {
  writeProfiles([...readProfiles().filter(item => item.id !== profile.id), profile].sort((a,b) => a.createdAt - b.createdAt))
}

export function getActiveProfile(): LearnerProfile | null {
  if (typeof window === 'undefined') return null
  const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY)
  if (!activeId) return null
  return readProfiles().find(profile => profile.id === activeId) ?? null
}

export function setActiveProfile(profileId: string) {
  if (typeof window !== 'undefined') localStorage.setItem(ACTIVE_PROFILE_KEY, profileId)
}

export function createProfile(input: {
  name: string
  startMode: StartMode
  selfAssessment?: SelfAssessmentLevel
  approximateLevel?: CEFRLevel
  placementCompleted?: boolean
}) {
  const now = Date.now()
  const profile: LearnerProfile = {
    id: `profile-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim() || 'Lernprofil',
    startMode: input.startMode,
    selfAssessment: input.selfAssessment,
    approximateLevel: input.approximateLevel ?? approximateLevelFor(input.startMode, input.selfAssessment),
    onboardingCompleted: true,
    placementCompleted: input.placementCompleted ?? input.startMode !== 'placement',
    createdAt: now,
    updatedAt: now,
  }
  const profiles = [...readProfiles(), profile]
  writeProfiles(profiles)
  setActiveProfile(profile.id)
  return profile
}

export function updateProfile(profile: LearnerProfile) {
  writeProfiles([...readProfiles().filter(item => item.id !== profile.id), { ...profile, updatedAt: Date.now() }])
}

export function removeProfile(profileId: string) {
  writeProfiles(readProfiles().filter(profile => profile.id !== profileId))
  if (typeof window !== 'undefined' && localStorage.getItem(ACTIVE_PROFILE_KEY) === profileId) {
    localStorage.removeItem(ACTIVE_PROFILE_KEY)
  }
}

function approximateLevelFor(mode: StartMode, selfAssessment?: SelfAssessmentLevel): CEFRLevel {
  if (mode === 'zero') return 'A1'
  if (selfAssessment === 'A2' || selfAssessment === 'advanced') return 'A2'
  return 'A1'
}
