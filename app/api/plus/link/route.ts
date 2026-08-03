import { NextRequest, NextResponse } from 'next/server';

const WORKINK_BASE_URL =
  process.env.NEXT_PUBLIC_WORKINK_URL || 'https://work.ink/2Na9/talmor-executor';
const LOOTLABS_API_TOKEN = process.env.LOOTLABS_API_TOKEN ?? '';
const LOOTLABS_FALLBACK =
  process.env.NEXT_PUBLIC_LOOTLABS_URL || '';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://talmor.top';

/**
 * Work.ink Link Override (public, no API key):
 * GET https://work.ink/_api/v2/override?destination=<url>
 * → { sr: "..." } appended as ?sr= on your work.ink link
 * @see https://blog.work.ink/how-to-override-link-destinations-on-the-fly/
 */
async function buildWorkinkUrl(uid: string): Promise<string> {
  const destination =
    `${SITE_URL}/verify?token={TOKEN}&uid=${encodeURIComponent(uid)}&source=workink`;

  try {
    const res = await fetch(
      `https://work.ink/_api/v2/override?destination=${encodeURIComponent(destination)}`,
      { method: 'GET', cache: 'no-store' },
    );
    if (res.ok) {
      const data = await res.json();
      const sr = typeof data?.sr === 'string' ? data.sr : '';
      if (sr) {
        const join = WORKINK_BASE_URL.includes('?') ? '&' : '?';
        return `${WORKINK_BASE_URL}${join}sr=${encodeURIComponent(sr)}`;
      }
    }
  } catch {
    // fall through
  }

  const join = WORKINK_BASE_URL.includes('?') ? '&' : '?';
  return `${WORKINK_BASE_URL}${join}ref=${uid.slice(0, 8)}`;
}

function withLootlabsUid(base: string, uid: string): string {
  const join = base.includes('?') ? '&' : '?';
  // puid is what LootLabs echoes back as click_id on postback.
  return `${base}${join}puid=${encodeURIComponent(uid)}`;
}

function isExternalLootUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const siteHost = new URL(SITE_URL).host;
    if (u.host === siteHost) return false;
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * LootLabs content locker:
 * POST https://creators.lootlabs.gg/api/public/content_locker
 * Auth: Bearer LOOTLABS_API_TOKEN
 * Then append &puid=<uid> so postback click_id maps to the user.
 * @see https://help.lootlabs.gg/en/article/lootlabs-api-documentation-1k0hn73/
 *
 * Never returns a same-site URL — that made the LootLabs button look broken.
 */
async function buildLootlabsUrl(uid: string): Promise<string | null> {
  const destination = `${SITE_URL}/account?plus=1`;

  if (LOOTLABS_API_TOKEN) {
    try {
      const res = await fetch(
        'https://creators.lootlabs.gg/api/public/content_locker',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOOTLABS_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Talmor Plus',
            url: destination,
            tier_id: 1,
            number_of_tasks: 1,
            theme: 1,
          }),
          cache: 'no-store',
        },
      );

      if (res.ok) {
        const data = await res.json();
        const lootUrl =
          data?.message?.loot_url ||
          data?.loot_url ||
          (data?.message?.short ? `https://loot-link.com/s?${data.message.short}` : '');
        if (lootUrl && isExternalLootUrl(lootUrl)) {
          return withLootlabsUid(lootUrl, uid);
        }
      }
    } catch {
      // fall through to static locker URL
    }
  }

  if (LOOTLABS_FALLBACK && isExternalLootUrl(LOOTLABS_FALLBACK)) {
    return withLootlabsUid(LOOTLABS_FALLBACK, uid);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { uid, source } = await request.json();
    if (!uid) {
      return NextResponse.json({ ok: false, error: 'Missing uid' }, { status: 400 });
    }

    const platform = source === 'lootlabs' ? 'lootlabs' : 'workink';
    if (platform === 'lootlabs') {
      const url = await buildLootlabsUrl(uid);
      if (!url) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'LootLabs not configured. Set LOOTLABS_API_TOKEN or NEXT_PUBLIC_LOOTLABS_URL (loot-link.com).',
          },
          { status: 503 },
        );
      }
      return NextResponse.json({ ok: true, url });
    }

    const url = await buildWorkinkUrl(uid);
    return NextResponse.json({ ok: true, url });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
