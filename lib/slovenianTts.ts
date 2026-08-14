export type VoiceLike = {
  name: string
  lang: string
  localService?: boolean
  default?: boolean
}

export type SlovenianVoiceResult<T extends VoiceLike = VoiceLike> = {
  voice: T | null
  exactLocale: boolean
  availableSlovenianVoices: T[]
  reason: 'exact-sl-si' | 'slovenian-fallback' | 'no-slovenian-voice'
}

function normalizeLang(lang: string) {
  return lang.trim().toLowerCase().replace('_', '-')
}

export function isSlovenianVoice(voice: VoiceLike) {
  const lang = normalizeLang(voice.lang)
  return lang === 'sl' || lang.startsWith('sl-')
}

export function chooseSlovenianVoice<T extends VoiceLike>(voices: T[]): SlovenianVoiceResult<T> {
  const slovenian = voices.filter(isSlovenianVoice)

  const exact = slovenian.find(voice => normalizeLang(voice.lang) === 'sl-si')
  if (exact) {
    return {
      voice: exact,
      exactLocale: true,
      availableSlovenianVoices: slovenian,
      reason: 'exact-sl-si',
    }
  }

  const fallback = slovenian[0] ?? null
  if (fallback) {
    return {
      voice: fallback,
      exactLocale: false,
      availableSlovenianVoices: slovenian,
      reason: 'slovenian-fallback',
    }
  }

  return {
    voice: null,
    exactLocale: false,
    availableSlovenianVoices: [],
    reason: 'no-slovenian-voice',
  }
}

export async function waitForSpeechVoices(timeoutMs = 1800): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []

  const synth = window.speechSynthesis
  const immediate = synth.getVoices()
  if (immediate.length) return immediate

  return new Promise(resolve => {
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      synth.removeEventListener?.('voiceschanged', onVoicesChanged)
      resolve(synth.getVoices())
    }
    const onVoicesChanged = () => finish()
    synth.addEventListener?.('voiceschanged', onVoicesChanged)
    window.setTimeout(finish, timeoutMs)
  })
}

export type SpeakSlovenianResult = {
  ok: boolean
  voiceName?: string
  voiceLang?: string
  exactLocale?: boolean
  error?: 'speech-synthesis-unavailable' | 'no-slovenian-voice'
}

export async function speakWithSlovenianVoice(
  text: string,
  rate = 0.72,
): Promise<SpeakSlovenianResult> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { ok: false, error: 'speech-synthesis-unavailable' }
  }

  const voices = await waitForSpeechVoices()
  const selected = chooseSlovenianVoice(voices)
  if (!selected.voice) {
    return { ok: false, error: 'no-slovenian-voice' }
  }

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'sl-SI'
  utterance.voice = selected.voice
  utterance.rate = rate
  window.speechSynthesis.speak(utterance)

  return {
    ok: true,
    voiceName: selected.voice.name,
    voiceLang: selected.voice.lang,
    exactLocale: selected.exactLocale,
  }
}
