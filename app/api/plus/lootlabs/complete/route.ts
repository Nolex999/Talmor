import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, grantPlus24h } from '@/lib/plus';
import { lootlabsSigningSecret, verifyLootlabsReturn } from '@/lib/lootlabs-sign';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://talmor.top';

/**
 * Browser return after LootLabs tasks.
 * Destination is set per-user when creating the content locker:
 *   /api/plus/lootlabs/complete?uid=…&exp=…&sig=…
 */
export async function GET(request: NextRequest) {
  const site = SITE_URL.replace(/\/$/, '');
  const { searchParams } = request.nextUrl;
  const uid = searchParams.get('uid') ?? '';
  const exp = searchParams.get('exp') ?? '';
  const sig = searchParams.get('sig') ?? '';
  const secret = lootlabsSigningSecret();

  if (!secret || !verifyLootlabsReturn(uid, exp, sig, secret)) {
    return NextResponse.redirect(`${site}/account?plus=1&from=lootlabs&err=sig`);
  }

  try {
    const supabase = createServiceClient();
    await grantPlus24h(supabase, uid);
    return NextResponse.redirect(`${site}/account?plus=1&from=lootlabs`);
  } catch {
    return NextResponse.redirect(`${site}/account?plus=1&from=lootlabs&err=grant`);
  }
}
