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
    const { code, user_id } = await request.json();

    if (!code || !user_id) {
      return NextResponse.json({ error: 'Missing code or user_id' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const cleanCode = code.trim().toUpperCase();

    const { data, error } = await supabase
      .from('invite_codes')
      .select('id, used')
      .eq('code', cleanCode)
      .single();

    if (error || !data || data.used) {
      return NextResponse.json({ error: 'Code invalid or already used' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('invite_codes')
      .update({ used: true, used_by: user_id })
      .eq('id', data.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to consume code' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
