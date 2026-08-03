import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, grantPlus24h } from '@/lib/plus';

const POSTBACK_SECRET = process.env.LOOTLABS_POSTBACK_SECRET ?? '';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * LootLabs Postback (GET).
 * Configure in LootLabs panel:
 *   https://talmor.top/api/plus/lootlabs?secret=YOUR_SECRET&puid={CUSTOM_USER_ID}
 * or with click_id if you set click_id to the Supabase user UUID when creating the link.
 *
 * Our /api/plus/link appends &puid=<uid> to locker URLs.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const secret = searchParams.get('secret') ?? '';

    if (!POSTBACK_SECRET || secret !== POSTBACK_SECRET) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const candidates = [
      searchParams.get('puid'),
      searchParams.get('user_id'),
      searchParams.get('uid'),
      searchParams.get('click_id'),
      searchParams.get('unique_id'),
    ];

    const uid = candidates.find((v) => v && UUID_RE.test(v)) ?? '';
    if (!uid) {
      return NextResponse.json(
        { ok: false, error: 'Missing user id (puid / click_id UUID)' },
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid request';
    const status = msg === 'Server misconfigured' ? 500 : 400;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
