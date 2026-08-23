import { NextResponse } from 'next/server'
import { conversationScenario, conversationStepForPrompt, nextConversationStep, scenarioForWeakTargets, type ConversationTopic } from '@/lib/conversation-curriculum'

type HistoryItem={role?:string;text?:string}
type TutorContext={topic?:ConversationTopic;hintLevel?:number;knownWords?:string[];weakTargets?:string[]}
type LocalReply={reply:string;translation?:string;correction?:string;hint?:string;status:'correct'|'help'|'correction'|'off-topic';targets?:string[]}

const systemPrompt=`Du bist ein geduldiger Slowenischlehrer für einen deutschsprachigen Anfänger. Arbeite nach dem übergebenen Conversation Curriculum. Stelle genau eine Frage gleichzeitig, akzeptiere semantisch passende Varianten, bestätige niemals Unsinn oder rein deutsche Antworten, erkläre „Ne razumem“ kurz auf Deutsch, korrigiere echte Grammatikfehler knapp und führe danach das Rollenspiel weiter. Wiederhole keine bereits beantwortete Frage. Nutze überwiegend bekannte Wörter und berücksichtige weakTargets gezielt, ohne die Unterhaltung künstlich wirken zu lassen.`

function lastTutorQuestion(history:HistoryItem[]){return [...history].reverse().find(i=>i.role==='tutor')?.text||''}
function hasGermanOnly(text:string){return /\b(ich|bin|hause|heute|morgen|möchte|suche|trinke|esse|nicht|verstehe|bruder|schwester|zimmer)\b/i.test(text)&&!/\b(sem|grem|imam|želim|iščem|pijem|jem|danes|jutri|doma|brata|sestro)\b/i.test(text)}
function matchesAny(text:string,patterns:string[]){const t=text.toLocaleLowerCase('sl-SI');return patterns.some(p=>t.includes(p.toLocaleLowerCase('sl-SI')))}

function correctionFor(message:string):LocalReply|undefined{
 const m=message.toLocaleLowerCase('sl-SI')
 if(/sem\s+v\s+nemčija\b/.test(m))return{status:'correction',correction:'Sem v Nemčiji.',reply:'Skoraj! Pravilno je „Sem v Nemčiji.“',translation:'Fast! Richtig ist: Ich bin in Deutschland.'}
 if(/sem\s+v\s+slovenijo\b/.test(m))return{status:'correction',correction:'Sem v Sloveniji.',reply:'Skoraj! Za kraj uporabimo „v Sloveniji“.'}
 if(/grem\s+v\s+sloveniji\b/.test(m))return{status:'correction',correction:'Grem v Slovenijo.',reply:'Skoraj! Za smer uporabimo „v Slovenijo“.'}
 if(/imam\s+dve\s+brata\b/.test(m))return{status:'correction',correction:'Imam dva brata.',reply:'Skoraj! „brat“ je moškega spola, zato: „Imam dva brata.“'}
 if(/imam\s+dva\s+sestr/.test(m))return{status:'correction',correction:'Imam dve sestri.',reply:'Skoraj! „sestra“ je ženskega spola, zato: „Imam dve sestri.“'}
 return undefined
}

function localFallback(message:string,history:HistoryItem[],context:TutorContext):LocalReply{
 const topic=context.topic||scenarioForWeakTargets(context.weakTargets).id
 const scenario=conversationScenario(topic)
 const last=lastTutorQuestion(history)
 const step=conversationStepForPrompt(topic,last)||scenario.steps[0]
 const m=message.trim()
 if(/ne razumem/i.test(m))return{status:'help',reply:`„${step.prompt}“ bedeutet: ${step.translation}`,translation:step.translation,hint:step.hint,targets:step.grammarTargets}
 if(hasGermanOnly(m))return{status:'off-topic',reply:'Das war noch keine passende slowenische Antwort.',translation:'Versuche die Antwort auf Slowenisch.',hint:step.hint,targets:step.grammarTargets}
 const correction=correctionFor(m)
 if(correction){const next=nextConversationStep(topic,step.id);return{...correction,reply:`${correction.reply} ${next.prompt}`,translation:next.translation,hint:next.hint,targets:[...step.grammarTargets,...next.grammarTargets]}}
 if(!matchesAny(m,step.acceptedPatterns))return{status:'off-topic',reply:'Die Antwort passt noch nicht ganz zur Frage.',translation:step.translation,hint:step.hint,targets:step.grammarTargets}
 const next=nextConversationStep(topic,step.id)
 if(next.id===step.id)return{status:'correct',reply:'Odlično! Cilj pogovora je dosežen.',translation:'Sehr gut! Das Gesprächsziel ist erreicht.',targets:step.grammarTargets}
 return{status:'correct',reply:next.prompt,translation:next.translation,hint:next.hint,targets:[...step.grammarTargets,...next.grammarTargets]}
}

export async function POST(request:Request){
 const {message,history=[],context={}}=await request.json()
 if(!message||typeof message!=='string')return NextResponse.json({error:'message fehlt'},{status:400})
 const endpoint=process.env.AI_TUTOR_ENDPOINT
 const topic:ConversationTopic=context.topic||scenarioForWeakTargets(context.weakTargets).id
 const scenario=conversationScenario(topic)
 if(!endpoint)return NextResponse.json({...localFallback(message,history,{...context,topic}),mode:'local',scenario:{id:scenario.id,goal:scenario.goal,grammarTargets:scenario.grammarTargets}})
 try{
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(process.env.AI_TUTOR_KEY?{Authorization:`Bearer ${process.env.AI_TUTOR_KEY}`}:{})},body:JSON.stringify({system:systemPrompt,message,history,context:{...context,topic,scenario}}),cache:'no-store'})
  if(!response.ok)throw new Error(`Tutor endpoint: ${response.status}`)
  const data=await response.json();const reply=data.reply??data.output??data.message
  if(!reply)throw new Error('Keine Tutor-Antwort erhalten')
  return NextResponse.json({reply,translation:data.translation,hint:data.hint,correction:data.correction,status:data.status||'correct',targets:data.targets||scenario.grammarTargets,mode:'remote'})
 }catch{return NextResponse.json({...localFallback(message,history,{...context,topic}),mode:'local-fallback'})}
}
