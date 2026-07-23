import { createClient } from './client';
import type { User } from '@supabase/supabase-js';

export type AuthUser = User;

export type DbUser = {
  id: string;
  username: string | null;
  role: 'owner' | 'admin' | 'user';
  license_key: string | null;
  created_at: string;
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
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

export async function updateUserProfile(username: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', user.id);

  if (error) throw error;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
