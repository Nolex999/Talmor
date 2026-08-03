import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, grantPlus24h } from '@/lib/plus';
import { isUserUuid, lootlabsSigningSecret } from '@/lib/lootlabs-sign';

/**
 * LootLabs server-to-server postback (GET).
 *
 * In the LootLabs Advanced tab, set ONLY the base URL (they append params):
 *   https://talmor.top/api/plus/lootlabs?secret=YOUR_SECRET
 *
 * Link clicks must include &puid=<supabase_user_uuid> — echoed back as click_id.
 * @see https://help.lootlabs.gg/en/article/postback-api-1ndz3i2/
 */
async function handlePostback(request: NextRequest) {
  const secret = lootlabsSigningSecret();
  const { searchParams } = request.nextUrl;
  const provided = searchParams.get('secret') ?? '';

  if (!secret || provided !== secret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const candidates = [
    searchParams.get('click_id'),
    searchParams.get('puid'),
    searchParams.get('user_id'),
    searchParams.get('uid'),
  ];

  const uid = candidates.find((v) => isUserUuid(v)) ?? '';
  if (!uid) {
    return NextResponse.json(
      { ok: false, error: 'Missing user id (click_id / puid must be a UUID)' },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const grant = await grantPlus24h(supabase, uid);

  return NextResponse.json({
    ok: true,
    key: grant.key,
    expires_at: grant.expires_at,
  });
}

export async function GET(request: NextRequest) {
  try {
    return await handlePostback(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid request';
    const status = msg === 'Server misconfigured' ? 500 : 400;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
