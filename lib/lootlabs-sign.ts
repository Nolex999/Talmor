import { createHmac, timingSafeEqual } from 'crypto';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUserUuid(value: string | null | undefined): value is string {
  return !!value && UUID_RE.test(value);
}

/** Signed return URL so LootLabs browser redirect can grant Plus without S2S postback. */
export function signLootlabsReturn(
  uid: string,
  secret: string,
  ttlMs = 6 * 60 * 60 * 1000,
): { exp: string; sig: string } {
  const exp = String(Date.now() + ttlMs);
  const sig = createHmac('sha256', secret).update(`${uid}.${exp}`).digest('hex');
  return { exp, sig };
}

export function verifyLootlabsReturn(
  uid: string,
  exp: string,
  sig: string,
  secret: string,
): boolean {
  if (!isUserUuid(uid) || !exp || !sig || !secret) return false;
  const expN = Number(exp);
  if (!Number.isFinite(expN) || expN < Date.now()) return false;
  const expected = createHmac('sha256', secret).update(`${uid}.${exp}`).digest('hex');
  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(sig, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function lootlabsSigningSecret(): string {
  return (
    process.env.LOOTLABS_POSTBACK_SECRET ||
    process.env.PLUS_WEBHOOK_SECRET ||
    ''
  );
}
