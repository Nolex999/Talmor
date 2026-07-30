import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

async function validateWorkinkToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://work.ink/_api/v2/token/isValid/${encodeURIComponent(token)}?deleteToken=1&forbiddenOnFail=1`,
      { method: 'GET' }
    );
    if (res.status === 403) return false;
    const data = await res.json();
    return !!data?.valid;
  } catch {
    return false;
  }
}

async function validateLootlabsToken(token: string): Promise<boolean> {
  // TODO: implement LootLabs token validation when their API is known
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const { token, uid, source } = await request.json();
    if (!token || !uid) {
      return NextResponse.json({ ok: false, error: 'Missing token or uid' }, { status: 400 });
    }

    const platform = source === 'lootlabs' ? 'lootlabs' : 'workink';
    const valid = platform === 'lootlabs'
      ? await validateLootlabsToken(token)
      : await validateWorkinkToken(token);

    if (!valid) {
      return NextResponse.json({ ok: false, error: 'Token is invalid or expired' }, { status: 403 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { error } = await supabase
      .from('profiles')
      .update({ raknet_unlocked: true })
      .eq('id', uid);

    if (error) {
      return NextResponse.json({ ok: false, error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
