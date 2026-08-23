import { A1_SKILL_GRAPH } from '@/lib/a1-skill-graph'
import { UserProgress } from '@/types'

export type CompetencyDomain='vocabulary'|'listening'|'speaking'|'production'|'grammar'|'dual'|'cases'
export type CompetencyScore={domain:CompetencyDomain;label:string;score:number;evidence:number;status:'zu-wenig-daten'|'aufbau'|'stabil'|'sicher'}
export type CefrProgress={level:'A1';overall:number;competencies:CompetencyScore[];strongest?:CompetencyScore;weakest?:CompetencyScore;recommendation:string;skillCoverage:number}

const definitions:{domain:CompetencyDomain;label:string;keys:(key:string)=>boolean}[]=[
 {domain:'vocabulary',label:'Wortschatz',keys:key=>key.startsWith('vocab:')},
 {domain:'listening',label:'Hörverständnis',keys:key=>key==='skill:listening'},
 {domain:'speaking',label:'Sprechen',keys:key=>key==='skill:speaking'},
 {domain:'production',label:'Aktive Produktion',keys:key=>key==='skill:production'},
 {domain:'grammar',label:'Grammatik',keys:key=>key.startsWith('grammar:')||key.startsWith('verb:')||key==='skill:grammar-application'},
 {domain:'dual',label:'Dual',keys:key=>/dual|number|numeral/.test(key)},
 {domain:'cases',label:'Fälle',keys:key=>/case|accusative|locative|genitive|dative|instrumental/.test(key)},
]

function clamp(value:number){return Math.max(0,Math.min(1,value))}
function status(score:number,evidence:number):CompetencyScore['status']{if(evidence<2)return'zu-wenig-daten';if(score<.55)return'aufbau';if(score<.78)return'stabil';return'sicher'}

export function competencyScores(progress:UserProgress):CompetencyScore[]{
 const items=Object.values(progress.mastery||{})
 return definitions.map(def=>{
  const relevant=items.filter(item=>def.keys(item.key))
  const evidence=relevant.reduce((sum,item)=>sum+item.attempts,0)
  const weighted=relevant.reduce((sum,item)=>sum+item.score*Math.max(1,item.attempts),0)
  const weight=relevant.reduce((sum,item)=>sum+Math.max(1,item.attempts),0)
  let score=weight?weighted/weight:0
  if(def.domain==='vocabulary'){
   const introduced=Math.max(progress.introducedWords.length,1)
   const learnedRatio=progress.wordsLearned.length/introduced
   const secureRatio=progress.secureWords.length/introduced
   score=weight?score*.65+clamp(learnedRatio*.7+secureRatio*.3)*.35:clamp(learnedRatio*.7+secureRatio*.3)
  }
  return{domain:def.domain,label:def.label,score:clamp(score),evidence,status:status(score,evidence)}
 })
}

export function buildCefrProgress(progress:UserProgress):CefrProgress{
 const competencies=competencyScores(progress)
 const evidenced=competencies.filter(item=>item.evidence>=2||item.domain==='vocabulary')
 const overall=evidenced.length?evidenced.reduce((sum,item)=>sum+item.score,0)/evidenced.length:0
 const ranked=Array.from(evidenced).sort((a,b)=>a.score-b.score)
 const weakest=ranked[0],strongest=ranked[ranked.length-1]
 const requiredTargets=new Set(A1_SKILL_GRAPH.flatMap(skill=>[...(skill.grammarTargets||[]),...(skill.vocabularyTopics||[])]))
 const masteryKeys=Object.keys(progress.mastery||{})
 const covered=Array.from(requiredTargets).filter(target=>masteryKeys.some(key=>key.includes(target)||key.includes(target.replace(/-basic|-present|-core|-introduction/g,''))))
 const skillCoverage=requiredTargets.size?covered.length/requiredTargets.size:0
 const recommendation=!weakest||weakest.evidence<2
  ?'Sammle noch etwas Lernpraxis, damit die App deine Kompetenzen zuverlässig einschätzen kann.'
  :weakest.domain==='dual'?'Dual ist aktuell dein größter Hebel. Priorisiere dva/dve und Dual-Verbformen.'
  :weakest.domain==='cases'?'Fälle sind aktuell dein größter Hebel. Übe besonders Ort/Richtung und die eingeführten Kasusmuster.'
  :`${weakest.label} ist aktuell dein schwächster Bereich und sollte im nächsten Training priorisiert werden.`
 return{level:'A1',overall:clamp(overall),competencies,strongest,weakest,recommendation,skillCoverage:clamp(skillCoverage)}
}

export function percent(value:number){return Math.round(clamp(value)*100)}
