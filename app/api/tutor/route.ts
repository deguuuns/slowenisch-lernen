import { NextResponse } from 'next/server'

const systemPrompt = `Du bist ein geduldiger Slowenischlehrer für einen deutschsprachigen Anfänger.
Sprich Slowenisch langsam und natürlich. Erklärungen gibst du auf Deutsch.
Stelle immer nur eine Aufgabe oder Frage gleichzeitig. Korrigiere nur tatsächliche Fehler.
Wenn die Antwort richtig ist, bestätige kurz und gehe weiter. Erfinde keine Fehler.
Erkläre Grammatik kurz und praktisch. Wenn ein deutsches Wort in einem slowenischen Satz steht,
gib das fehlende slowenische Wort und lasse den Satz erneut formulieren. Bevorzuge aktive Sprachproduktion.`

function localFallback(message: string) {
  const m = message.trim().toLowerCase()
  if (/slovenijo/.test(m) && /sem\s+v/.test(m)) return 'Fast. Bei einem Ort fragst du KJE? Daher: „Sem v Sloveniji.“ Zdaj ponovi: Sem v Sloveniji.'
  if (/sloveniji/.test(m) && /(grem|peljem)/.test(m)) return 'Hier geht es um eine Richtung: KAM? Daher: „v Slovenijo“. Ponovi: Jutri se peljem v Slovenijo.'
  if (/nemčije/.test(m) && /sem\s+v/.test(m)) return 'Für „in Deutschland“ heißt es „v Nemčiji“. Ponovi počasi: Sem v Nemčiji.'
  if (/domov/.test(m) && /sem\s+/.test(m)) return '„domov“ bedeutet „nach Hause“. Für den Ort brauchst du „doma“: „Sem doma.“'
  if (/pica\b/.test(m) && /jem/.test(m)) return 'Fast. Nach „jem“ heißt es hier „pico“: „Jem pico.“ Ponovi, prosim.'
  if (/^živjo|^dober dan|^dobro/.test(m)) return 'Odlično! Kaj delaš danes?'
  return 'Dobro! Antworte jetzt auf Slowenisch: „Kje si zdaj?“'
}

export async function POST(request: Request) {
  const { message, history = [] } = await request.json()
  if (!message || typeof message !== 'string') return NextResponse.json({ error: 'message fehlt' }, { status: 400 })

  const endpoint = process.env.AI_TUTOR_ENDPOINT
  if (!endpoint) return NextResponse.json({ reply: localFallback(message), mode: 'local' })

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(process.env.AI_TUTOR_KEY ? { Authorization: `Bearer ${process.env.AI_TUTOR_KEY}` } : {}) },
      body: JSON.stringify({ system: systemPrompt, message, history }),
      cache: 'no-store'
    })
    if (!response.ok) throw new Error(`Tutor endpoint: ${response.status}`)
    const data = await response.json()
    const reply = data.reply ?? data.output ?? data.message
    if (!reply) throw new Error('Keine Tutor-Antwort erhalten')
    return NextResponse.json({ reply, mode: 'remote' })
  } catch {
    return NextResponse.json({ reply: localFallback(message), mode: 'local-fallback' })
  }
}
