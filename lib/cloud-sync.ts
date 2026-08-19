'use client'

import { UserProgress } from '@/types'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
const SESSION_KEY = 'slovensko-cloud-session-v1'

export type CloudSession = { access_token:string; refresh_token:string; expires_at?:number; user:{id:string;email?:string} }
export type CloudProfile = { id:string; user_id:string; name:string; approximate_level:string }

function configured(){ return Boolean(URL && KEY) }
function headers(token?:string){ return { apikey:KEY, Authorization:`Bearer ${token || KEY}`, 'Content-Type':'application/json' } }
async function json(res:Response){ const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(data?.msg || data?.message || data?.error_description || data?.error || 'Cloud-Anfrage fehlgeschlagen'); return data }

export function cloudConfigured(){ return configured() }
export function loadSession():CloudSession|null { if(typeof window==='undefined') return null; try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null} }
export function saveSession(session:CloudSession|null){ if(typeof window==='undefined') return; session?localStorage.setItem(SESSION_KEY,JSON.stringify(session)):localStorage.removeItem(SESSION_KEY) }

export async function signIn(email:string,password:string):Promise<CloudSession>{
  if(!configured()) throw new Error('Cloud-Synchronisation ist noch nicht konfiguriert.')
  const data=await json(await fetch(`${URL}/auth/v1/token?grant_type=password`,{method:'POST',headers:headers(),body:JSON.stringify({email,password})}))
  const session={...data,expires_at:Date.now()+Number(data.expires_in||3600)*1000} as CloudSession; saveSession(session); return session
}
export async function signUp(email:string,password:string):Promise<CloudSession|null>{
  if(!configured()) throw new Error('Cloud-Synchronisation ist noch nicht konfiguriert.')
  const data=await json(await fetch(`${URL}/auth/v1/signup`,{method:'POST',headers:headers(),body:JSON.stringify({email,password})}))
  if(!data.access_token) return null
  const session={...data,expires_at:Date.now()+Number(data.expires_in||3600)*1000} as CloudSession; saveSession(session); return session
}
export async function signOut(){ const s=loadSession(); if(s) await fetch(`${URL}/auth/v1/logout`,{method:'POST',headers:headers(s.access_token)}).catch(()=>{}); saveSession(null) }

export async function ensureFreshSession(session:CloudSession):Promise<CloudSession>{
  if(!session.expires_at || session.expires_at-Date.now()>60_000) return session
  const data=await json(await fetch(`${URL}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:headers(),body:JSON.stringify({refresh_token:session.refresh_token})}))
  const next={...data,expires_at:Date.now()+Number(data.expires_in||3600)*1000} as CloudSession; saveSession(next); return next
}

export async function ensureProfile(session:CloudSession):Promise<CloudProfile>{
  const s=await ensureFreshSession(session)
  const existing=await json(await fetch(`${URL}/rest/v1/learner_profiles?select=id,user_id,name,approximate_level&client_profile_id=eq.default&limit=1`,{headers:headers(s.access_token)}))
  if(existing[0]) return existing[0]
  const name=s.user.email?.split('@')[0] || 'Lernprofil'
  const created=await json(await fetch(`${URL}/rest/v1/learner_profiles`,{method:'POST',headers:{...headers(s.access_token),Prefer:'return=representation'},body:JSON.stringify({user_id:s.user.id,client_profile_id:'default',name,start_mode:'adaptive',approximate_level:'A1',onboarding_completed:true,placement_completed:false})}))
  return created[0]
}

export async function loadCloudProgress(session:CloudSession,profileId:string):Promise<UserProgress|null>{
  const s=await ensureFreshSession(session)
  const rows=await json(await fetch(`${URL}/rest/v1/learner_states?select=state&profile_id=eq.${encodeURIComponent(profileId)}&limit=1`,{headers:headers(s.access_token)}))
  return rows[0]?.state || null
}

export async function saveCloudProgress(session:CloudSession,profileId:string,progress:UserProgress){
  const s=await ensureFreshSession(session)
  const current=await json(await fetch(`${URL}/rest/v1/learner_states?select=id,revision&profile_id=eq.${encodeURIComponent(profileId)}&limit=1`,{headers:headers(s.access_token)}))
  if(current[0]) await json(await fetch(`${URL}/rest/v1/learner_states?id=eq.${current[0].id}`,{method:'PATCH',headers:{...headers(s.access_token),Prefer:'return=representation'},body:JSON.stringify({state:progress,revision:Number(current[0].revision||0)+1,updated_at:new Date().toISOString()})}))
  else await json(await fetch(`${URL}/rest/v1/learner_states`,{method:'POST',headers:{...headers(s.access_token),Prefer:'return=representation'},body:JSON.stringify({user_id:s.user.id,profile_id:profileId,state:progress,revision:1})}))
}

export function mergeProgress(local:UserProgress,cloud:UserProgress):UserProgress{
  const union=(a:string[]=[],b:string[]=[])=>Array.from(new Set([...a,...b]))
  const lessons=Array.from(new Set([...(local.completedLessons||[]),...(cloud.completedLessons||[])]))
  const mistakeMap=new Map<string,any>(); [...(local.mistakes||[]),...(cloud.mistakes||[])].forEach(m=>{const old=mistakeMap.get(m.key); if(!old||m.count>old.count||m.lastSeen>old.lastSeen) mistakeMap.set(m.key,m)})
  const reviewMap=new Map<string,any>(); [...(local.reviews||[]),...(cloud.reviews||[])].forEach(r=>{const old=reviewMap.get(r.key); if(!old||r.intervalIndex>old.intervalIndex) reviewMap.set(r.key,r)})
  return {...local,...cloud,completedLessons:lessons,introducedWords:union(local.introducedWords,cloud.introducedWords),wordsLearned:union(local.wordsLearned,cloud.wordsLearned),secureWords:union(local.secureWords,cloud.secureWords),mistakes:[...mistakeMap.values()],reviews:[...reviewMap.values()],streak:Math.max(local.streak||0,cloud.streak||0),speakingMinutes:Math.max(local.speakingMinutes||0,cloud.speakingMinutes||0),listeningMinutes:Math.max(local.listeningMinutes||0,cloud.listeningMinutes||0),mastery:{...(local.mastery||{}),...(cloud.mastery||{})}}
}
