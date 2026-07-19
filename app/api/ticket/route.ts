import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL!;

const MAX_TICKETS_PER_HOUR = 5;

function sanitizeInput(str: string): string {
  return str
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 2000);
}

const CATEGORY_EMOJI: Record<string, string> = {
  general: '\u{1F4AC}',
  bug: '\u{1F41B}',
  billing: '\u{1F4B3}',
  account: '\u{1F510}',
  other: '\u{1F4CB}',
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, message, category } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanSubject = sanitizeInput(String(subject).slice(0, 200));
    const cleanMessage = sanitizeInput(String(message).slice(0, 2000));
    const cleanCategory = ['general', 'bug', 'billing', 'account', 'other'].includes(category)
      ? category
      : 'general';

    if (!cleanSubject || !cleanMessage) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if (count && count >= MAX_TICKETS_PER_HOUR) {
      return NextResponse.json(
        { error: `Rate limit: max ${MAX_TICKETS_PER_HOUR} tickets per hour.` },
        { status: 429 }
      );
    }

    const { error: dbError } = await supabaseAdmin.from('tickets').insert({
      user_id: user.id,
      user_email: user.email || 'unknown',
      category: cleanCategory,
      subject: cleanSubject,
      message: cleanMessage,
    });

    if (dbError) {
      return NextResponse.json({ error: 'Failed to save ticket' }, { status: 500 });
    }

    const emoji = CATEGORY_EMOJI[cleanCategory] || '\u{1F4CB}';

    const embed = {
      title: `${emoji} New Support Ticket`,
      color: 0x2b2d31,
      fields: [
        { name: 'Subject', value: cleanSubject, inline: false },
        { name: 'Category', value: cleanCategory, inline: true },
        { name: 'User', value: user.email || 'unknown', inline: true },
        { name: 'Message', value: cleanMessage.length > 1024 ? cleanMessage.slice(0, 1021) + '...' : cleanMessage, inline: false },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'Talmor Support System' },
    };

    const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Talmor Support',
        embeds: [embed],
      }),
    });

    if (!discordRes.ok) {
      return NextResponse.json({ error: 'Failed to send to Discord' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
