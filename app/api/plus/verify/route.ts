import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, grantPlus24h } from '@/lib/plus';

async function validateWorkinkToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://work.ink/_api/v2/token/isValid/${encodeURIComponent(token)}?deleteToken=1&forbiddenOnFail=1`,
      { method: 'GET' },
    );
    if (res.status === 403) return false;
    const data = await res.json();
    return !!data?.valid;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, uid, source } = await request.json();
    if (!token || !uid) {
      return NextResponse.json({ ok: false, error: 'Missing token or uid' }, { status: 400 });
    }

    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(uid)) {
      return NextResponse.json({ ok: false, error: 'Invalid uid' }, { status: 400 });
    }

    // LootLabs unlocks via postback (/api/plus/lootlabs), not via this token path.
    if (source === 'lootlabs') {
      return NextResponse.json(
        { ok: false, error: 'LootLabs unlocks automatically after the offer. Check your account.' },
        { status: 400 },
      );
    }

    const valid = await validateWorkinkToken(token);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'Token is invalid or expired' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const grant = await grantPlus24h(supabase, uid);

    return NextResponse.json({
      ok: true,
      key: grant.key,
      expires_at: grant.expires_at,
      existing: grant.existing,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid request';
    const status = msg === 'Server misconfigured' ? 500 : 400;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
