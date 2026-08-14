'use client'

const SESSION_KEY = 'slovensko-supabase-session-v1'

export type SupabaseUser = { id: string; email?: string }
export type SupabaseSession = {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: SupabaseUser
}

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return { url: url.replace(/\/$/, ''), key }
}

export function isSupabaseConfigured() {
  return !!config()
}

export function loadSupabaseSession(): SupabaseSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistSession(session: SupabaseSession | null) {
  if (typeof window === 'undefined') return
  if (!session) localStorage.removeItem(SESSION_KEY)
  else localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in }))
}

async function authRequest(path: string, body: unknown) {
  const cfg = config()
  if (!cfg) throw new Error('Supabase ist nicht konfiguriert.')
  const response = await fetch(`${cfg.url}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: cfg.key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data?.msg || data?.message || data?.error_description || 'Anmeldung fehlgeschlagen.')
  return data
}

export async function signUpWithPassword(email: string, password: string) {
  const data = await authRequest('signup', { email, password })
  if (data.access_token) persistSession(data as SupabaseSession)
  return { session: data.access_token ? data as SupabaseSession : null, user: data.user as SupabaseUser | undefined }
}

export async function signInWithPassword(email: string, password: string) {
  const data = await authRequest('token?grant_type=password', { email, password }) as SupabaseSession
  persistSession(data)
  return data
}

export function signOutLocal() {
  persistSession(null)
}

export async function getValidSupabaseSession(): Promise<SupabaseSession | null> {
  const current = loadSupabaseSession()
  if (!current) return null
  const now = Math.floor(Date.now() / 1000)
  if ((current.expires_at ?? 0) > now + 60) return current
  try {
    const refreshed = await authRequest('token?grant_type=refresh_token', { refresh_token: current.refresh_token }) as SupabaseSession
    persistSession(refreshed)
    return refreshed
  } catch {
    persistSession(null)
    return null
  }
}

export async function supabaseRest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cfg = config()
  if (!cfg) throw new Error('Supabase ist nicht konfiguriert.')
  const session = await getValidSupabaseSession()
  if (!session) throw new Error('Nicht angemeldet.')
  const response = await fetch(`${cfg.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation,resolution=merge-duplicates',
      ...(init.headers ?? {}),
    },
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Supabase request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}
