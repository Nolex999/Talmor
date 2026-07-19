import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  );
}

function generateCode(): string {
  const chars = 'BCDFGHJKLMNPQRSTVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 24; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = getSupabaseAdmin();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'owner' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const count = Math.min(Math.max(parseInt(body.count) || 1, 1), 50);

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(generateCode());
    }

    const { data, error } = await supabase
      .from('invite_codes')
      .insert(codes.map(code => ({ code, created_by: user.id })))
      .select('code, created_at');

    if (error) {
      return NextResponse.json({ error: 'Failed to generate codes' }, { status: 500 });
    }

    return NextResponse.json({ codes: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
