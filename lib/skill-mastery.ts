import type { MasteryItem, TargetContentKey } from '@/types'

export type ListeningMasteryStage = 'word' | 'sentence' | 'dialogue' | 'story'
export type SpeakingMasteryMode = 'spoken-response' | 'typed-fallback'

export const LISTENING_STAGE_KEYS: Record<ListeningMasteryStage, TargetContentKey> = {
  word: 'skill:listening:word',
  sentence: 'skill:listening:sentence',
  dialogue: 'skill:listening:dialogue',
  story: 'skill:listening:story',
}

export const SPEAKING_MODE_KEYS: Record<SpeakingMasteryMode, TargetContentKey> = {
  'spoken-response': 'skill:speaking:spoken-response',
  'typed-fallback': 'skill:production:typed-fallback',
}

export function listeningStageKey(stage: ListeningMasteryStage): TargetContentKey {
  return LISTENING_STAGE_KEYS[stage]
}

export function speakingModeKey(mode: SpeakingMasteryMode): TargetContentKey {
  return SPEAKING_MODE_KEYS[mode]
}

export function skillMasteryScore(mastery: Record<string, MasteryItem> | undefined, key: string, fallback = .25) {
  return mastery?.[key]?.score ?? fallback
}

export function weakestListeningStage(mastery: Record<string, MasteryItem> | undefined, minimumAttempts = 2) {
  const stages = (Object.keys(LISTENING_STAGE_KEYS) as ListeningMasteryStage[])
    .map(stage => ({ stage, key: LISTENING_STAGE_KEYS[stage], item: mastery?.[LISTENING_STAGE_KEYS[stage]] }))
    .filter(entry => (entry.item?.attempts || 0) >= minimumAttempts)
    .sort((a, b) => (a.item?.score || 0) - (b.item?.score || 0))
  return stages[0] || null
}

export function explicitSkillTargetKeys(keys: TargetContentKey[] | undefined) {
  return Array.from(new Set((keys || []).filter((key): key is TargetContentKey => key.startsWith('skill:'))))
}
