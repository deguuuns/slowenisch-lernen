import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'speech-service-not-configured' }, { status: 503 })
  }

  try {
    const input = await request.formData()
    const audio = input.get('file')
    if (!(audio instanceof File)) {
      return NextResponse.json({ error: 'missing-audio-file' }, { status: 400 })
    }

    const form = new FormData()
    form.append('file', audio, audio.name || 'speech.webm')
    form.append('model', 'gpt-4o-mini-transcribe')
    form.append('language', 'sl')
    form.append('response_format', 'json')
    form.append('prompt', 'Slowenian language learner. Preserve Slovene words, grammatical endings, č, š and ž accurately. Do not translate.')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error('Speech transcription failed', response.status, detail.slice(0, 500))
      return NextResponse.json({ error: 'transcription-failed' }, { status: 502 })
    }

    const result = await response.json() as { text?: string }
    return NextResponse.json({ text: result.text?.trim() ?? '' })
  } catch (error) {
    console.error('Speech transcription error', error)
    return NextResponse.json({ error: 'transcription-failed' }, { status: 500 })
  }
}
