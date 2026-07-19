import { createClient } from './client';

export type AuthUser = {
  id: string;
  email?: string;
  created_at?: string;
};

export type DbUser = {
  id: string;
  username: string | null;
  role: 'owner' | 'admin' | 'user';
  license_key: string | null;
  created_at: string;
};

const SESSION_KEY = 'talmor_session';

export function loadSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id) return null;
    return parsed as AuthUser;
  } catch {
    return null;
  }
}

export function saveSession(user: AuthUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export async function getUserProfile(): Promise<DbUser | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data as DbUser | null;
}

export async function upsertUserProfile(username: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, username }, { onConflict: 'id' });

  if (error) throw error;
}

export async function signOut() {
  const supabase = createClient();
  clearSession();
  await supabase.auth.signOut();
}
