import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Uses the shared `validate_invite` Supabase RPC so the web app and the Talmor
// desktop app enforce identical invite rules from a single source of truth.
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  );
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('validate_invite', { p_code: code });

    if (error) {
      return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
    }

    const valid = data?.valid === true;
    return NextResponse.json(
      { valid, error: valid ? undefined : (data?.error ?? 'Invalid invite code') },
      { status: valid ? 200 : 400 }
    );
  } catch {
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}
