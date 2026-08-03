import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

function randomKey16(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < 16; i++) out += ALPHABET[bytes[i]! % 36];
  return out;
}

export type PlusGrant = {
  key: string;
  expires_at: string;
  existing: boolean;
};

/** Grant (or reuse) a 24h Talmor Plus activation key for a user. */
export async function grantPlus24h(
  supabase: SupabaseClient,
  uid: string,
): Promise<PlusGrant> {
  await supabase.from('profiles').upsert({ id: uid }, { onConflict: 'id' });

  const { data: existing } = await supabase
    .from('profiles')
    .select('license_key, key_expires_at')
    .eq('id', uid)
    .maybeSingle();

  const expiresAt = existing?.key_expires_at
    ? new Date(existing.key_expires_at)
    : null;
  if (
    existing?.license_key &&
    expiresAt &&
    !Number.isNaN(expiresAt.getTime()) &&
    expiresAt.getTime() > Date.now()
  ) {
    return {
      key: existing.license_key,
      expires_at: expiresAt.toISOString(),
      existing: true,
    };
  }

  let key = randomKey16();
  // rare collision retry
  for (let attempt = 0; attempt < 5; attempt++) {
    const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('profiles')
      .update({
        license_key: key,
        key_expires_at: newExpiry,
        raknet_unlocked: true,
      })
      .eq('id', uid);

    if (!error) {
      return { key, expires_at: newExpiry, existing: false };
    }
    key = randomKey16();
  }

  throw new Error('Failed to grant Plus key');
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !key) throw new Error('Server misconfigured');
  return createClient(url, key);
}

export function isPlusActive(profile: {
  license_key?: string | null;
  key_expires_at?: string | null;
  raknet_unlocked?: boolean | null;
} | null): boolean {
  if (!profile) return false;
  if (profile.key_expires_at) {
    const t = new Date(profile.key_expires_at).getTime();
    if (!Number.isNaN(t) && t > Date.now() && profile.license_key) return true;
  }
  // legacy permanent flag without expiry — treat as inactive for key display
  return false;
}
