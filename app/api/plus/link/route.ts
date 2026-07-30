import { NextRequest, NextResponse } from 'next/server';

const WORKINK_API_KEY = process.env.WORKINK_API_KEY ?? '';
const WORKINK_LINK_ID = process.env.WORKINK_LINK_ID ?? '';
const WORKINK_BASE_URL = process.env.NEXT_PUBLIC_WORKINK_URL || 'https://work.ink/talmor-plus';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const { uid, source } = await request.json();
    if (!uid) {
      return NextResponse.json({ ok: false, error: 'Missing uid' }, { status: 400 });
    }

    const platform = source === 'lootlabs' ? 'lootlabs' : 'workink';

    // Build the verify URL that Work.ink will redirect to after completion
    const redirectUrl = `${SITE_URL}/verify?token={TOKEN}&uid=${encodeURIComponent(uid)}&source=${platform}`;

    // If Work.ink API key is configured, use Link Override API
    if (WORKINK_API_KEY && WORKINK_LINK_ID) {
      try {
        const overrideRes = await fetch(
          `https://work.ink/_api/link/${WORKINK_LINK_ID}/override`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WORKINK_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ destination: redirectUrl }),
          }
        );

        if (overrideRes.ok) {
          const overrideData = await overrideRes.json();
          const sr = overrideData.sr || overrideData.token || '';
          const linkUrl = sr
            ? `${WORKINK_BASE_URL}?sr=${sr}`
            : `${WORKINK_BASE_URL}?ref=${uid.slice(0, 8)}`;
          return NextResponse.json({ ok: true, url: linkUrl });
        }
      } catch {
        // fall through to fallback
      }
    }

    // Fallback: direct link with ref param
    return NextResponse.json({
      ok: true,
      url: `${WORKINK_BASE_URL}?ref=${uid.slice(0, 8)}`,
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
