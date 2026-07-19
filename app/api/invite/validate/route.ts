import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const cleanCode = code.trim().toUpperCase();

    if (cleanCode.length < 6 || cleanCode.length > 30) {
      return NextResponse.json({ valid: false, error: 'Invalid code format' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('invite_codes')
      .select('id, used')
      .eq('code', cleanCode)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Invalid invite code' }, { status: 404 });
    }

    if (data.used) {
      return NextResponse.json({ valid: false, error: 'This invite code has already been used' }, { status: 410 });
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 });
  }
}
