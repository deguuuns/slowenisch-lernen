import { NextResponse } from 'next/server'

const systemPrompt = `Du bist ein geduldiger Slowenischlehrer für einen deutschsprachigen Anfänger.
Sprich Slowenisch langsam und natürlich. Erklärungen gibst du auf Deutsch.
Stelle immer nur eine Aufgabe oder Frage gleichzeitig. Korrigiere nur tatsächliche Fehler.
Wenn die Antwort richtig ist, bestätige kurz und gehe mit einer passenden Folgefrage weiter.
Wiederhole keine bereits beantwortete Frage. Nutze den Gesprächsverlauf als Zustand.
Erkläre Grammatik kurz und praktisch. Wenn ein deutsches Wort in einem slowenischen Satz steht,
gib das fehlende slowenische Wort und lasse den Satz erneut formulieren. Bevorzuge aktive Sprachproduktion.`

type HistoryItem = { role?:string; text?:string }

function lastTutorQuestion(history:HistoryItem[]) {
  return [...history].reverse().find(item => item.role === 'tutor')?.text || ''
}

function localFallback(message:string, history:HistoryItem[]) {
  const m=message.trim().toLowerCase()
  const last=lastTutorQuestion(history).toLowerCase()

  if (/sem\s+v\s+nemčija\b/.test(m)) return 'Skoraj! Pravilno je „Sem v Nemčiji.“ V katerem mestu si?'
  if (/sem\s+v\s+slovenijo\b/.test(m)) return 'Skoraj! Pri kraju odgovarjaš na KJE: „Sem v Sloveniji.“ Kaj delaš tam?'
  if (/sem\s+domov\b/.test(m)) return '„domov“ pomeni smer, torej „nach Hause“. Za kraj uporabi „doma“: „Sem doma.“ Kaj delaš doma?'
  if (/jem\s+pica\b/.test(m)) return 'Fast. Nach „jem“ heißt es „pico“: „Jem pico.“ Kaj še rad ješ?'

  if (/kje si zdaj/.test(last)) {
    if (/\bsem doma\b|\bzdaj sem doma\b/.test(m)) return 'Super! Kaj delaš doma?'
    if (/\bsem v [a-zčšž]+/.test(m)) return 'Odlično! Kaj delaš tam?'
  }
  if (/kaj delaš doma/.test(last) || /kaj delaš tam/.test(last)) {
    if (/kuham/.test(m)) return 'Lepo! Kaj kuhaš?'
    if (/delam/.test(m)) return 'Dobro! Kaj delaš?'
    if (/počivam/.test(m)) return 'Lepo. Kaj boš delal potem?'
    return 'Dobro! Kaj boš delal potem?'
  }
  if (/kaj kuhaš/.test(last)) return 'Odlično. Boš potem ostal doma ali greš ven?'
  if (/ostal doma|greš ven/.test(last)) return 'Super. Kam greš jutri?'
  if (/kam greš jutri/.test(last)) return 'Zelo dobro! S kom greš?'

  if (/^živjo\b|^dober dan\b|^dobro\b/.test(m)) return 'Živjo! Kje si zdaj?'
  if (/\bsem doma\b/.test(m)) return 'Super! Kaj delaš doma?'
  if (/\bsem v nemčiji\b/.test(m)) return 'Odlično! V katerem mestu si?'
  if (/\bsem v sloveniji\b/.test(m)) return 'Odlično! Kaj delaš v Sloveniji?'
  return 'Dobro! Povej mi še malo več. Kaj delaš zdaj?'
}

export async function POST(request:Request) {
  const { message, history=[] }=await request.json()
  if(!message||typeof message!=='string') return NextResponse.json({error:'message fehlt'},{status:400})

  const endpoint=process.env.AI_TUTOR_ENDPOINT
  if(!endpoint) return NextResponse.json({reply:localFallback(message,history),mode:'local'})

  try {
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(process.env.AI_TUTOR_KEY?{Authorization:`Bearer ${process.env.AI_TUTOR_KEY}`}:{})},body:JSON.stringify({system:systemPrompt,message,history}),cache:'no-store'})
    if(!response.ok) throw new Error(`Tutor endpoint: ${response.status}`)
    const data=await response.json()
    const reply=data.reply??data.output??data.message
    if(!reply) throw new Error('Keine Tutor-Antwort erhalten')
    return NextResponse.json({reply,mode:'remote'})
  } catch {
    return NextResponse.json({reply:localFallback(message,history),mode:'local-fallback'})
  }
}
