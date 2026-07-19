const SUPABASE_URL = 'https://ovljjdqczqsyozegdbeg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bGpqZHFjenFzeW96ZWdkYmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzc1MzYsImV4cCI6MjA4ODkxMzUzNn0.iI1O_0khEVY1BqRG7cEsX31bbpCsolxFJLng9A_vC8k';

const headers = {
  apikey: SUPABASE_ANON_KEY,
  'Content-Type': 'application/json',
};

async function rest(path: string, init?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: { ...headers, ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json();
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
  created_at: string;
}

export interface DbUser {
  id: string;
  username: string;
  email: string;
  license_key: string | null;
  hwid: string | null;
  is_admin: boolean;
  created_at: string;
}

const TOKEN_KEY = 'talmor_session';
const USER_KEY = 'talmor_user';

export function saveSession(session: Session, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadSession(): { session: Session; user: AuthUser } | null {
  try {
    const s = localStorage.getItem(TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (!s || !u) return null;
    const session: Session = JSON.parse(s);
    const user: AuthUser = JSON.parse(u);
    if (session.expires_at && session.expires_at * 1000 < Date.now()) return null;
    return { session, user };
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function signIn(email: string, password: string) {
  const data = await rest('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const session: Session = data.session;
  const user: AuthUser = data.user;
  saveSession(session, user);
  return { session, user };
}

export async function signUp(email: string, password: string, username: string) {
  const data = await rest('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      data: { username },
    }),
  });
  const session: Session = data.session;
  const user: AuthUser = data.user;
  saveSession(session, user);
  return { session, user };
}

export async function refreshSession() {
  const stored = loadSession();
  if (!stored) throw new Error('No session');
  const data = await rest('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: stored.session.refresh_token }),
  });
  const session: Session = data.session;
  const user: AuthUser = data.user;
  saveSession(session, user);
  return { session, user };
}

async function authedFetch(path: string, init?: RequestInit) {
  const stored = loadSession();
  if (!stored) throw new Error('Not authenticated');
  return rest(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${stored.session.access_token}`,
      ...init?.headers,
    },
  });
}

export async function getUserProfile(): Promise<DbUser | null> {
  const stored = loadSession();
  if (!stored) return null;
  try {
    const data = await authedFetch(
      `/rest/v1/users?id=eq.${stored.user.id}&select=*`
    );
    return data?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function upsertUserProfile(username: string) {
  const stored = loadSession();
  if (!stored) throw new Error('Not authenticated');
  return authedFetch('/rest/v1/users', {
    method: 'POST',
    body: JSON.stringify({
      id: stored.user.id,
      username,
      email: stored.user.email,
      created_at: new Date().toISOString(),
    }),
    headers: { Prefer: 'resolution=merge-duplicates' },
  });
}

export async function signOut() {
  clearSession();
}
