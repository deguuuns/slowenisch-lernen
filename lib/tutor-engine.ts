export type TutorTopicId='location'|'daily'|'restaurant'|'travel'
export type TutorHistoryItem={role?:string;text?:string}
export type TutorReply={reply:string;translation?:string;correct:boolean;kind:'correct'|'correction'|'help'|'off-topic'|'summary';hint?:string;suggestions?:string[];errorKey?:string}

export const TUTOR_TOPICS:{id:TutorTopicId;title:string;description:string;opening:string;openingDe:string}[]=[
  {id:'location',title:'Wo bist du und was machst du?',description:'Ort, Tätigkeit und einfache Folgefragen.',opening:'Živjo! Kje si zdaj?',openingDe:'Hallo! Wo bist du jetzt?'},
  {id:'daily',title:'Dein Tag',description:'Heute, morgen und dein Tagesablauf.',opening:'Kaj delaš danes?',openingDe:'Was machst du heute?'},
  {id:'restaurant',title:'Im Restaurant',description:'Bestellen, Essen und Getränke.',opening:'Kaj bi rad jedel ali pil?',openingDe:'Was möchtest du essen oder trinken?'},
  {id:'travel',title:'Unterwegs',description:'Ziele, Verkehrsmittel und Pläne.',opening:'Kam greš danes?',openingDe:'Wohin gehst oder fährst du heute?'},
]

const clean=(s:string)=>s.trim().toLowerCase().replace(/[.!?,;:]+$/g,'')
const containsGerman=(m:string)=>/\b(ich|du|der|die|das|und|oder|heute|morgen|autobahn|käserei|zuhause|nach hause|verstehe)\b/i.test(m)
const nonsense=(m:string)=>m.length<2||/^(ok|okay|ja|nein|hm+|aha)$/i.test(m)
const lastTutor=(history:TutorHistoryItem[])=>[...history].reverse().find(x=>x.role==='tutor')?.text||''

function helpReply(question:string):TutorReply{
  const q=clean(question)
  if(q.includes('kje si')) return {reply:'Ni problema. „Kje si zdaj?“ pomeni: Wo bist du jetzt?',translation:'Antworte zum Beispiel: Sem doma. / Sem v službi.',correct:false,kind:'help',hint:'Beginne mit „Sem …“',suggestions:['Sem doma.','Sem v službi.','Sem v Nemčiji.']}
  if(q.includes('kaj delaš')) return {reply:'Ni problema. „Kaj delaš?“ pomeni: Was machst du?',translation:'Antworte mit einer Tätigkeit.',correct:false,kind:'help',hint:'Zum Beispiel „Delam.“ oder „Kuham.“',suggestions:['Delam.','Kuham.','Počivam.']}
  if(q.includes('kam greš')) return {reply:'Ni problema. „Kam greš?“ pomeni: Wohin gehst oder fährst du?',translation:'Nenne ein Ziel.',correct:false,kind:'help',hint:'Zum Beispiel „Grem domov.“',suggestions:['Grem domov.','Grem v službo.','Grem v Slovenijo.']}
  return {reply:'Ni problema. Poskusiva lažje.',translation:'Ich formuliere die Frage einfacher. Antworte mit einem kurzen slowenischen Satz.',correct:false,kind:'help',hint:'Du kannst auch den Tipp benutzen.'}
}

export function localTutorReply(message:string,history:TutorHistoryItem[],topic:TutorTopicId='location',turn=0):TutorReply{
  const raw=message.trim(),m=clean(raw),last=clean(lastTutor(history))
  if(/^(ne razumem|ne razumem vprašanja|ne vem)$/i.test(m)) return helpReply(last)

  if(containsGerman(raw)) return {reply:'To ni še slowenski odgovor.',translation:'Das war Deutsch bzw. kein slowenischer Satz. Versuch es auf Slowenisch.',correct:false,kind:'off-topic',hint:'Nutze den Tipp, wenn dir ein Wort fehlt.',suggestions:topic==='travel'?['Grem domov.','Grem v službo.']:['Sem doma.','Danes delam.'],errorKey:'speaking:language-mismatch'}
  if(nonsense(m)) return {reply:'Potrebujem malo več.',translation:'Ich brauche eine passende kurze Antwort auf die Frage.',correct:false,kind:'off-topic',hint:'Ein kurzer vollständiger Satz reicht.',errorKey:'speaking:irrelevant-answer'}

  if(/sem\s+v\s+nemčija\b/.test(m)) return {reply:'Skoraj! Pravilno je: „Sem v Nemčiji.“',translation:'Nach „v“ brauchst du hier die Ortsform Nemčiji. In welchem Ort bist du?',correct:false,kind:'correction',hint:'Sem v Nemčiji.',suggestions:['Sem v Nemčiji.'],errorKey:'grammar:location-static-v-locative'}
  if(/sem\s+v\s+slovenijo\b/.test(m)) return {reply:'Skoraj! Za kraj rečeš: „Sem v Sloveniji.“',translation:'„v Slovenijo“ ist eine Richtung; für den Ort heißt es „v Sloveniji“.',correct:false,kind:'correction',suggestions:['Sem v Sloveniji.'],errorKey:'grammar:location-static-v-locative'}
  if(/sem\s+domov\b/.test(m)) return {reply:'Skoraj! Reci: „Sem doma.“',translation:'„domov“ = nach Hause, „doma“ = zu Hause.',correct:false,kind:'correction',suggestions:['Sem doma.'],errorKey:'grammar:direction-domov'}
  if(/jem\s+pica\b/.test(m)) return {reply:'Skoraj! Reci: „Jem pico.“',translation:'Nach „jem“ steht hier „pico“.',correct:false,kind:'correction',suggestions:['Jem pico.'],errorKey:'grammar:accusative-feminine-a-o'}

  if(turn>=7) return {reply:'Odlično, končajva tukaj.',translation:'Gute Runde. Du hast mehrere freie Antworten produziert. Schwierige Stellen solltest du danach in „Wiederholen“ festigen.',correct:true,kind:'summary'}

  if(last.includes('kje si')){
    if(/\bsem doma\b/.test(m)) return {reply:'Super! Kaj delaš doma?',translation:'Super! Was machst du zu Hause?',correct:true,kind:'correct',hint:'z. B. Kuham. / Počivam.'}
    if(/\bsem v [a-zčšž]+/.test(m)) return {reply:'Odlično! Kaj delaš tam?',translation:'Sehr gut! Was machst du dort?',correct:true,kind:'correct'}
    return {reply:'Odgovor še ne pove, kje si.',translation:'Deine Antwort sagt noch nicht, wo du bist.',correct:false,kind:'off-topic',hint:'Antworte mit „Sem …“',suggestions:['Sem doma.','Sem v službi.'],errorKey:'speaking:question-mismatch'}
  }
  if(last.includes('kaj delaš')){
    if(/\bkuham\b/.test(m)) return {reply:'Lepo! Kaj kuhaš?',translation:'Schön! Was kochst du?',correct:true,kind:'correct'}
    if(/\b(delam|počivam|jem|pijem|gledam|berem)\b/.test(m)) return {reply:'Dobro! Kaj boš delal potem?',translation:'Gut! Was wirst du danach machen?',correct:true,kind:'correct'}
    return {reply:'To ne zveni kot odgovor na „Kaj delaš?“',translation:'Das klingt nicht wie eine Tätigkeit.',correct:false,kind:'off-topic',hint:'Nenne eine Tätigkeit, z. B. „Delam.“',suggestions:['Delam.','Kuham.','Počivam.'],errorKey:'speaking:question-mismatch'}
  }
  if(last.includes('kaj kuhaš')) return {reply:'Odlično. Boš potem ostal doma ali greš ven?',translation:'Sehr gut. Bleibst du danach zu Hause oder gehst du raus?',correct:true,kind:'correct'}
  if(last.includes('kam greš')){
    if(/\b(grem|peljem se)\b/.test(m)) return {reply:'Super! Kako greš tja – peš ali z avtom?',translation:'Super! Wie kommst du dorthin – zu Fuß oder mit dem Auto?',correct:true,kind:'correct'}
    return {reply:'Povej cilj z „grem“ ali „peljem se“.',translation:'Nenne ein Ziel mit „grem“ oder „peljem se“.',correct:false,kind:'off-topic',suggestions:['Grem domov.','Grem v službo.'],errorKey:'speaking:question-mismatch'}
  }

  if(topic==='restaurant'){
    if(/\b(jem|pil|pijem|kavo|vodo|pivo|čaj|pico|kruh|sir)\b/.test(m)) return {reply:'Dobro! Kaj še želiš?',translation:'Gut! Was möchtest du noch?',correct:true,kind:'correct'}
    return {reply:'Poskusi povedati, kaj želiš jesti ali piti.',translation:'Sag, was du essen oder trinken möchtest.',correct:false,kind:'off-topic',suggestions:['Pijem vodo.','Jem pico.'],errorKey:'speaking:question-mismatch'}
  }
  if(topic==='daily') return {reply:'Dobro! Kaj boš delal jutri?',translation:'Gut! Was wirst du morgen machen?',correct:true,kind:'correct'}
  if(topic==='travel') return {reply:'Dobro! Kako greš tja?',translation:'Gut! Wie kommst du dorthin?',correct:true,kind:'correct'}
  return {reply:'Dobro. Povej mi še malo več: kaj delaš zdaj?',translation:'Gut. Erzähl etwas mehr: Was machst du gerade?',correct:true,kind:'correct'}
}
