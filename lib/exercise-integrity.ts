import { Exercise, Vocabulary } from '@/types'
import { GRAMMAR_RULES } from '@/lib/curriculum-access'

export type IntegrityIssue={exerciseId:string;message:string}

export function validateExerciseIntegrity(ex:Exercise,vocabulary:Vocabulary[]=[]):IntegrityIssue[]{const issues:IntegrityIssue[]=[];const add=(m:string)=>issues.push({exerciseId:ex.id,message:m});if(!ex.id?.trim())add('exercise id missing');if(!ex.prompt?.trim())add('prompt missing');if(!ex.answer?.trim())add('answer missing');if(ex.type==='choice'){const options=[ex.answer,...(ex.alternatives||[])].map(x=>x.trim()).filter(Boolean),normalized=options.map(x=>x.toLocaleLowerCase('sl'));if(!ex.alternatives?.length)add('choice alternatives missing');if(normalized.filter(x=>x===ex.answer.trim().toLocaleLowerCase('sl')).length!==1)add('correct choice must occur exactly once');if(new Set(normalized).size!==normalized.length)add('duplicate choice options')}
 if(ex.acceptedAnswers?.some(x=>!x.trim()))add('empty accepted answer');if(vocabulary.length){const ids=new Set(vocabulary.map(v=>v.id));for(const id of ex.vocabularyIds||[])if(!ids.has(id))add(`unknown vocabulary id ${id}`)}for(const id of ex.grammarRuleIds||[])if(!GRAMMAR_RULES[id])add(`unknown grammar rule ${id}`);for(const r of ex.requiredVerbForms||[]){if(!r.verbId||![1,2,3].includes(r.person)||!['singular','dual','plural'].includes(r.number))add('invalid required verb form')}return issues}

export function validateExerciseSet(exercises:Exercise[],vocabulary:Vocabulary[]=[]):IntegrityIssue[]{const issues=exercises.flatMap(ex=>validateExerciseIntegrity(ex,vocabulary)),seen=new Set<string>();for(const ex of exercises){if(seen.has(ex.id))issues.push({exerciseId:ex.id,message:'duplicate exercise id'});seen.add(ex.id)}return issues}

export type ChoiceOption={id:string;text:string;correct:boolean}
function hash(s:string){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
export function stableChoiceOptions(ex:Exercise,sessionSeed:string):ChoiceOption[]{const raw=[{id:`${ex.id}:correct`,text:ex.answer,correct:true},...(ex.alternatives||[]).filter(a=>a.trim().toLocaleLowerCase('sl')!==ex.answer.trim().toLocaleLowerCase('sl')).map((text,i)=>({id:`${ex.id}:alt:${i}`,text,correct:false}))];return [...raw].sort((a,b)=>hash(`${sessionSeed}:${a.id}`)-hash(`${sessionSeed}:${b.id}`))}
