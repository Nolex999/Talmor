import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const POSTBACK_SECRET = process.env.LOOTLABS_POSTBACK_SECRET ?? '';

/**
 * LootLabs Postback (GET).
 * Panel → Advanced postback URL:
 *   https://talmor.top/api/plus/lootlabs?secret=YOUR_SECRET&click_id={CLICK_ID}&ip={IP}&unique_id={UNIQUE_ID}
 *
 * Links must include &puid=<supabase_user_id> (our /api/plus/link adds this).
 * @see https://help.lootlabs.gg/en/article/postback-api-1ndz3i2/
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const secret = searchParams.get('secret') ?? '';
    const clickId = searchParams.get('click_id') ?? '';

    if (POSTBACK_SECRET && secret !== POSTBACK_SECRET) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!clickId) {
      return NextResponse.json({ ok: false, error: 'Missing click_id' }, { status: 400 });
    }

    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(clickId)) {
      return NextResponse.json({ ok: false, error: 'Invalid click_id' }, { status: 400 });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ ok: false, error: 'Server misconfigured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { error } = await supabase
      .from('profiles')
      .update({ raknet_unlocked: true })
      .eq('id', clickId);

    if (error) {
      return NextResponse.json({ ok: false, error: 'Failed to unlock' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
