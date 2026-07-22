import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Uses the shared `consume_invite` Supabase RPC (atomic single-use burn) so the
// web app and the Talmor desktop app share one invite-consumption code path.
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  );
}

export async function POST(request: NextRequest) {
  try {
    const { code, user_id } = await request.json();

    if (!code || !user_id) {
      return NextResponse.json({ error: 'Missing code or user_id' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('consume_invite', {
      p_code: code,
      p_user_id: user_id,
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to consume code' }, { status: 500 });
    }

    if (data?.success !== true) {
      return NextResponse.json(
        { error: data?.error ?? 'Code invalid or already used' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
