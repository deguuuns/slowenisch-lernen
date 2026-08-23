import type { TargetContentKey } from '@/types'

export type ListeningStage='word'|'sentence'|'dialogue'|'story'
export type ListeningSpeed='verySlow'|'slow'|'normal'|'native'

export type ListeningItem={
 id:string
 stage:ListeningStage
 title:string
 text:string
 translation:string
 requiredWords:string[]
 prompts:{question:string;options:string[];answer:string}[]
 recommendedSpeed:ListeningSpeed
 targetKeys:TargetContentKey[]
}

export const LISTENING_CURRICULUM:ListeningItem[]=[
 {id:'listen-word-place',stage:'word',title:'Orte erkennen',text:'doma, Slovenija, trgovina, restavracija',translation:'zu Hause, Slowenien, Geschäft, Restaurant',requiredWords:['doma','Slovenija','trgovina','restavracija'],recommendedSpeed:'verySlow',targetKeys:['skill:listening','vocab:places'],prompts:[{question:'Welches Wort bedeutet „zu Hause“?',options:['doma','trgovina','Slovenija'],answer:'doma'}]},
 {id:'listen-sentence-location',stage:'sentence',title:'Ort verstehen',text:'Danes sem v Sloveniji.',translation:'Heute bin ich in Slowenien.',requiredWords:['danes','Slovenija'],recommendedSpeed:'slow',targetKeys:['skill:listening','grammar:case:locative'],prompts:[{question:'Kje sem danes?',options:['V Sloveniji','V Nemčiji','Doma'],answer:'V Sloveniji'}]},
 {id:'listen-sentence-direction',stage:'sentence',title:'Richtung verstehen',text:'Jutri grem v trgovino.',translation:'Morgen gehe ich in das Geschäft.',requiredWords:['jutri','iti','trgovina'],recommendedSpeed:'slow',targetKeys:['skill:listening','grammar:case:accusative'],prompts:[{question:'Kam grem jutri?',options:['V trgovino','V službi','Doma'],answer:'V trgovino'}]},
 {id:'listen-dialogue-restaurant',stage:'dialogue',title:'Im Restaurant',text:'Dober dan. Kaj želite piti? Želim vodo, prosim. Seveda. Želite še kaj? Ne, hvala.',translation:'Guten Tag. Was möchten Sie trinken? Ich möchte Wasser, bitte. Natürlich. Möchten Sie noch etwas? Nein, danke.',requiredWords:['dober dan','želeti','piti','voda','prosim','hvala'],recommendedSpeed:'normal',targetKeys:['skill:listening','grammar:topic:restaurant'],prompts:[{question:'Kaj želi gost piti?',options:['Vodo','Kavo','Čaj'],answer:'Vodo'},{question:'Ali želi še kaj?',options:['Ne','Da','Ne vemo'],answer:'Ne'}]},
 {id:'listen-dialogue-travel',stage:'dialogue',title:'Unterwegs',text:'Kam greš danes? Grem v Ljubljano. Kako greš? Peljem se z avtom.',translation:'Wohin gehst/fährst du heute? Ich fahre nach Ljubljana. Wie fährst du? Ich fahre mit dem Auto.',requiredWords:['kam','danes','iti','Ljubljana','peljati se','avto'],recommendedSpeed:'normal',targetKeys:['skill:listening','grammar:topic:travel','grammar:case:accusative'],prompts:[{question:'Kam gre oseba?',options:['V Ljubljano','Domov','V Maribor'],answer:'V Ljubljano'},{question:'Kako gre?',options:['Z avtom','Z vlakom','Peš'],answer:'Z avtom'}]},
 {id:'listen-story-day',stage:'story',title:'Moj dan',text:'Zjutraj pijem kavo in potem grem v službo. Popoldne grem v trgovino. Zvečer sem doma in kuham večerjo.',translation:'Morgens trinke ich Kaffee und gehe danach zur Arbeit. Nachmittags gehe ich einkaufen. Abends bin ich zu Hause und koche Abendessen.',requiredWords:['zjutraj','piti','kava','služba','popoldne','trgovina','zvečer','doma','kuhati'],recommendedSpeed:'normal',targetKeys:['skill:listening','grammar:topic:daily-routine'],prompts:[{question:'Kam grem zjutraj?',options:['V službo','Domov','V hotel'],answer:'V službo'},{question:'Kje sem zvečer?',options:['Doma','V trgovini','V službi'],answer:'Doma'}]},
]

const stageOrder:ListeningStage[]=['word','sentence','dialogue','story']

export function listeningStageIndex(stage:ListeningStage){return stageOrder.indexOf(stage)}
export function listeningKnownRatio(item:ListeningItem,knownWords:Set<string>){if(!item.requiredWords.length)return 1;const known=new Set(Array.from(knownWords).map(x=>x.toLocaleLowerCase('sl-SI')));return item.requiredWords.filter(word=>known.has(word.toLocaleLowerCase('sl-SI'))).length/item.requiredWords.length}
export function recommendedListeningItems(knownWords:Set<string>,listeningScore=.25){const maxStage=listeningScore<.35?0:listeningScore<.5?1:listeningScore<.7?2:3;return [...LISTENING_CURRICULUM].filter(item=>listeningStageIndex(item.stage)<=maxStage+1).sort((a,b)=>{const stagePenalty=Math.abs(listeningStageIndex(a.stage)-maxStage)*.2-Math.abs(listeningStageIndex(b.stage)-maxStage)*.2;return (listeningKnownRatio(b,knownWords)-listeningKnownRatio(a,knownWords))+stagePenalty})}
export function auditListeningCurriculum(){const errors:string[]=[];const ids=new Set<string>();for(const item of LISTENING_CURRICULUM){if(ids.has(item.id))errors.push(`${item.id}: duplicate id`);ids.add(item.id);if(!item.text.trim())errors.push(`${item.id}: missing text`);if(!item.prompts.length)errors.push(`${item.id}: missing comprehension question`);for(const prompt of item.prompts)if(!prompt.options.includes(prompt.answer))errors.push(`${item.id}: answer missing from options`);if(!item.targetKeys.includes('skill:listening'))errors.push(`${item.id}: missing listening target`)}return errors}
