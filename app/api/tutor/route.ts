import { NextResponse } from 'next/server'
import { localTutorReply, TutorTopicId } from '@/lib/tutor-engine'

const systemPrompt = `Du bist ein geduldiger Slowenischlehrer für einen deutschsprachigen Anfänger.
Führe ein kurzes, echtes Gespräch statt einer starren Abfrage. Stelle immer nur eine Frage gleichzeitig.
Akzeptiere keine thematisch unpassenden Antworten als korrekt. Wenn eine Antwort auf Deutsch kommt oder die Frage nicht beantwortet,
sage das freundlich und konkret. Wenn der Nutzer „Ne razumem“ schreibt, erkläre die letzte Frage auf Deutsch und gib 2–3 mögliche slowenische Antworten.
Korrigiere nur tatsächliche Fehler. Erkläre Grammatik kurz auf Deutsch und führe danach das Gespräch fort.
Wiederhole keine bereits sinnvoll beantwortete Frage. Halte dich an das angegebene Gesprächsthema und an einfache A1-Strukturen.
Antworte als JSON mit: reply, translation, correct, kind, hint, suggestions, errorKey.`

type HistoryItem={role?:string;text?:string}

export async function POST(request:Request){
  const {message,history=[],topic='location',turn=0}=await request.json() as {message?:string;history?:HistoryItem[];topic?:TutorTopicId;turn?:number}
  if(!message||typeof message!=='string') return NextResponse.json({error:'message fehlt'},{status:400})

  const endpoint=process.env.AI_TUTOR_ENDPOINT
  if(!endpoint) return NextResponse.json({...localTutorReply(message,history,topic,turn),mode:'local'})

  try{
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(process.env.AI_TUTOR_KEY?{Authorization:`Bearer ${process.env.AI_TUTOR_KEY}`}:{})},body:JSON.stringify({system:systemPrompt,message,history,topic,turn}),cache:'no-store'})
    if(!response.ok) throw new Error(`Tutor endpoint: ${response.status}`)
    const data=await response.json()
    const candidate=typeof data==='string'?JSON.parse(data):data
    if(!candidate?.reply) throw new Error('Keine Tutor-Antwort erhalten')
    return NextResponse.json({...candidate,mode:'remote'})
  }catch{
    return NextResponse.json({...localTutorReply(message,history,topic,turn),mode:'local-fallback'})
  }
}
