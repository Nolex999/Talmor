import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, grantPlus24h } from '@/lib/plus';

const WEBHOOK_SECRET = process.env.PLUS_WEBHOOK_SECRET ?? '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, user_id } = body;

    if (!WEBHOOK_SECRET || !secret || secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const grant = await grantPlus24h(supabase, user_id);

    return NextResponse.json({
      ok: true,
      key: grant.key,
      expires_at: grant.expires_at,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
