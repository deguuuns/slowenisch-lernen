import { NextResponse } from 'next/server'

type HistoryItem = { role?:string; text?:string }
type TutorContext = {
  topic?: 'smalltalk'|'restaurant'|'travel'|'shopping'
  hintLevel?: number
  knownWords?: string[]
  weakTargets?: string[]
}

type LocalReply = { reply:string; translation?:string; correction?:string; hint?:string; status:'correct'|'help'|'correction'|'off-topic' }

const systemPrompt = `Du bist ein geduldiger Slowenischlehrer für einen deutschsprachigen Anfänger. Führe ein echtes, kurzes Rollenspiel statt eines freien Chats. Nutze überwiegend bereits bekannte Wörter und Grammatik aus dem übergebenen Lernkontext. Stelle genau eine Frage gleichzeitig. Prüfe zuerst, ob die Antwort semantisch zur Frage passt. Unsinn oder eine rein deutsche Antwort darf niemals mit Lob bestätigt werden. Bei „Ne razumem“ erkläre die Frage kurz auf Deutsch und gib eine kleine Hilfe. Korrigiere echte Grammatikfehler knapp, führe danach den Dialog weiter. Wiederhole keine beantwortete Frage. Bevorzuge aktive Sprachproduktion und Slowenisch; Erklärungen dürfen Deutsch sein.`

const scenarios = {
  smalltalk: { start:'Živjo! Kje si zdaj?', translation:'Hallo! Wo bist du gerade?' },
  restaurant: { start:'Dober dan. Kaj želite piti?', translation:'Guten Tag. Was möchten Sie trinken?' },
  travel: { start:'Kam greš danes?', translation:'Wohin gehst oder fährst du heute?' },
  shopping: { start:'Dober dan. Kaj iščete?', translation:'Guten Tag. Was suchen Sie?' },
} as const

function lastTutorQuestion(history:HistoryItem[]) { return [...history].reverse().find(item => item.role === 'tutor')?.text || '' }
function hasGermanOnly(text:string) { return /\b(ich|bin|hause|autobahn|käserei|heute|morgen|möchte|suche|trinke|esse|nicht|verstehe)\b/i.test(text) && !/\b(sem|grem|imam|želim|iščem|pijem|jem|danes|jutri|doma)\b/i.test(text) }
function helpFor(last:string):LocalReply {
  if (/kje si/.test(last)) return { status:'help', reply:'„Kje si zdaj?“ pomeni: „Wo bist du gerade?“', translation:'Antworte zum Beispiel: Sem doma.', hint:'Sem …' }
  if (/kaj želite piti/.test(last)) return { status:'help', reply:'Vprašanje pomeni: „Was möchten Sie trinken?“', hint:'Želim … / Pil bi …' }
  if (/kam greš/.test(last)) return { status:'help', reply:'„Kam greš?“ fragt nach einer Richtung: „Wohin gehst/fährst du?“', hint:'Grem v … / Grem domov.' }
  if (/kaj iščete/.test(last)) return { status:'help', reply:'Vprašanje pomeni: „Was suchen Sie?“', hint:'Iščem …' }
  return { status:'help', reply:'Ich formuliere es einfacher. Antworte mit einem kurzen slowenischen Satz.', hint:'Versuche einen Satz mit 2–5 Wörtern.' }
}

function localFallback(message:string, history:HistoryItem[], context:TutorContext):LocalReply {
  const m=message.trim().toLowerCase(); const last=lastTutorQuestion(history).toLowerCase(); const topic=context.topic||'smalltalk'
  if (/ne razumem|ne razumijem|ne razumem\.?$/.test(m)) return helpFor(last)
  if (hasGermanOnly(m)) return {status:'off-topic',reply:'Das war noch keine passende slowenische Antwort. Ich helfe dir beim Formulieren.',hint:helpFor(last).hint}
  if (/sem\s+v\s+nemčija\b/.test(m)) return {status:'correction',correction:'Sem v Nemčiji.',reply:'Skoraj! Pravilno je „Sem v Nemčiji.“ V katerem mestu si?',translation:'Fast! Richtig ist „Ich bin in Deutschland.“ In welcher Stadt bist du?'}
  if (/sem\s+v\s+slovenijo\b/.test(m)) return {status:'correction',correction:'Sem v Sloveniji.',reply:'Skoraj! Za kraj uporabimo „v Sloveniji“. Kaj delaš tam?'}
  if (/sem\s+domov\b/.test(m)) return {status:'correction',correction:'Sem doma.',reply:'„domov“ je smer; za kraj rečemo „Sem doma.“ Kaj delaš doma?'}
  if (/jem\s+pica\b/.test(m)) return {status:'correction',correction:'Jem pico.',reply:'Skoraj! Rečemo „Jem pico.“ Kaj še rad ješ?'}

  if (/kje si/.test(last)) {
    if (/\bsem doma\b|\bzdaj sem doma\b/.test(m)) return {status:'correct',reply:'Super! Kaj delaš doma?',translation:'Super! Was machst du zu Hause?'}
    if (/\bsem v [a-zčšž]+/.test(m)) return {status:'correct',reply:'Odlično! Kaj delaš tam?',translation:'Sehr gut! Was machst du dort?'}
    return {status:'off-topic',reply:'Odgovori na vprašanje, kje si.',translation:'Antworte darauf, wo du bist.',hint:'Sem doma. / Sem v …'}
  }
  if (/kaj delaš doma|kaj delaš tam/.test(last)) {
    if (/kuham/.test(m)) return {status:'correct',reply:'Lepo! Kaj kuhaš?',translation:'Schön! Was kochst du?'}
    if (/delam/.test(m)) return {status:'correct',reply:'Dobro! Kaj delaš?',translation:'Gut! Was arbeitest/machst du?'}
    if (/počivam/.test(m)) return {status:'correct',reply:'Lepo. Kaj boš delal potem?',translation:'Schön. Was machst du danach?'}
    return {status:'off-topic',reply:'Poskusi povedati, kaj delaš.',hint:'Kuham … / Delam … / Počivam.'}
  }
  if (/kaj kuhaš/.test(last)) return m.length>2 ? {status:'correct',reply:'Odlično. Boš potem ostal doma ali greš ven?',translation:'Sehr gut. Bleibst du danach zu Hause oder gehst du raus?'} : helpFor(last)
  if (/kaj želite piti/.test(last)) return /želim|pil bi|pila bi|vodo|kavo|čaj/.test(m) ? {status:'correct',reply:'Seveda. Želite še kaj?',translation:'Natürlich. Möchten Sie noch etwas?'} : {status:'off-topic',reply:'Povej, kaj želiš piti.',hint:'Želim vodo. / Pil bi kavo.'}
  if (/kam greš/.test(last)) return /grem|peljem se/.test(m) ? {status:'correct',reply:'Lepo. S kom greš?',translation:'Schön. Mit wem gehst/fährst du?'} : {status:'off-topic',reply:'Povej, kam greš.',hint:'Grem domov. / Grem v …'}
  if (/kaj iščete/.test(last)) return /iščem/.test(m) ? {status:'correct',reply:'Razumem. Kakšno?',translation:'Verstanden. Was für eins/eine?'} : {status:'off-topic',reply:'Povej, kaj iščeš.',hint:'Iščem …'}

  const start=scenarios[topic]
  return {status:'help',reply:start.start,translation:start.translation}
}

export async function POST(request:Request) {
  const { message, history=[], context={} }=await request.json()
  if(!message||typeof message!=='string') return NextResponse.json({error:'message fehlt'},{status:400})
  const endpoint=process.env.AI_TUTOR_ENDPOINT
  if(!endpoint) return NextResponse.json({...localFallback(message,history,context),mode:'local'})
  try {
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(process.env.AI_TUTOR_KEY?{Authorization:`Bearer ${process.env.AI_TUTOR_KEY}`}:{})},body:JSON.stringify({system:systemPrompt,message,history,context}),cache:'no-store'})
    if(!response.ok) throw new Error(`Tutor endpoint: ${response.status}`)
    const data=await response.json(); const reply=data.reply??data.output??data.message
    if(!reply) throw new Error('Keine Tutor-Antwort erhalten')
    return NextResponse.json({reply,translation:data.translation,hint:data.hint,correction:data.correction,status:data.status||'correct',mode:'remote'})
  } catch { return NextResponse.json({...localFallback(message,history,context),mode:'local-fallback'}) }
}
