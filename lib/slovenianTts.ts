export type SupportedTtsLanguage = 'sl-SI' | 'de-DE'

export type VoiceLike = {
  name: string
  lang: string
  localService?: boolean
  default?: boolean
}

export type VoiceSelectionResult<T extends VoiceLike = VoiceLike> = {
  voice: T | null
  exactLocale: boolean
  availableVoices: T[]
  reason: 'exact-locale' | 'language-fallback' | 'no-matching-voice'
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

function languagePrefix(locale: SupportedTtsLanguage) {
  return normalizeLang(locale).split('-')[0]
}

export function isVoiceForLanguage(voice: VoiceLike, locale: SupportedTtsLanguage) {
  const lang = normalizeLang(voice.lang)
  const prefix = languagePrefix(locale)
  return lang === prefix || lang.startsWith(`${prefix}-`)
}

export function chooseVoice<T extends VoiceLike>(voices: T[], locale: SupportedTtsLanguage): VoiceSelectionResult<T> {
  const matching = voices.filter(voice => isVoiceForLanguage(voice, locale))
  const exact = matching.find(voice => normalizeLang(voice.lang) === normalizeLang(locale))
  if (exact) return { voice: exact, exactLocale: true, availableVoices: matching, reason: 'exact-locale' }
  const fallback = matching[0] ?? null
  if (fallback) return { voice: fallback, exactLocale: false, availableVoices: matching, reason: 'language-fallback' }
  return { voice: null, exactLocale: false, availableVoices: [], reason: 'no-matching-voice' }
}

export function isSlovenianVoice(voice: VoiceLike) {
  return isVoiceForLanguage(voice, 'sl-SI')
}

export function chooseSlovenianVoice<T extends VoiceLike>(voices: T[]): SlovenianVoiceResult<T> {
  const selected = chooseVoice(voices, 'sl-SI')
  return {
    voice: selected.voice,
    exactLocale: selected.exactLocale,
    availableSlovenianVoices: selected.availableVoices,
    reason: selected.reason === 'exact-locale' ? 'exact-sl-si' : selected.reason === 'language-fallback' ? 'slovenian-fallback' : 'no-slovenian-voice',
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

export type SpeakResult = {
  ok: boolean
  voiceName?: string
  voiceLang?: string
  exactLocale?: boolean
  error?: 'speech-synthesis-unavailable' | 'no-matching-voice'
}

export async function speakWithVoice(text: string, locale: SupportedTtsLanguage, rate = 0.72): Promise<SpeakResult> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return { ok: false, error: 'speech-synthesis-unavailable' }
  const voices = await waitForSpeechVoices()
  const selected = chooseVoice(voices, locale)
  if (!selected.voice) return { ok: false, error: 'no-matching-voice' }

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = locale
  utterance.voice = selected.voice
  utterance.rate = rate
  window.speechSynthesis.speak(utterance)
  return { ok: true, voiceName: selected.voice.name, voiceLang: selected.voice.lang, exactLocale: selected.exactLocale }
}

export async function speakWithSlovenianVoice(text: string, rate = 0.72) {
  const result = await speakWithVoice(text, 'sl-SI', rate)
  return result.ok ? result : {
    ...result,
    error: result.error === 'no-matching-voice' ? 'no-slovenian-voice' as const : result.error,
  }
}
