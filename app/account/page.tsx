'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  getAuthUser,
  getUserProfile,
  updateUserProfile,
  signOut,
  type AuthUser,
  type DbUser,
} from '../../lib/supabase';
import SiteBackdrop from '@/components/SiteBackdrop';

const WORKINK_FALLBACK = process.env.NEXT_PUBLIC_WORKINK_URL || 'https://work.ink/2Na9/talmor-executor';
const LOOTLABS_FALLBACK = process.env.NEXT_PUBLIC_LOOTLABS_URL || '';
const DOWNLOAD_URL = process.env.NEXT_PUBLIC_DOWNLOAD_URL || '';
const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL || 'http://localhost:3001';

function isExternalPartnerUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (typeof window !== 'undefined' && u.host === window.location.host) return false;
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return false;
    return true;
  } catch {
    return false;
  }
}

function isPlusActive(profile: DbUser | null): boolean {
  if (!profile?.license_key || !profile.key_expires_at) return false;
  const t = new Date(profile.key_expires_at).getTime();
  return !Number.isNaN(t) && t > Date.now();
}

function formatRemaining(expiresAt: string | null | undefined): string {
  if (!expiresAt) return '';
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h left`;
  }
  return `${h}h ${m}m left`;
}

type UnlockPhase = 'idle' | 'waiting' | 'ready' | 'failed';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [usernameEdit, setUsernameEdit] = useState('');
  const [saving, setSaving] = useState(false);
  const [plusLinks, setPlusLinks] = useState<{ workink: string; lootlabs: string } | null>(null);
  const [unlockPhase, setUnlockPhase] = useState<UnlockPhase>('idle');
  const [now, setNow] = useState(() => Date.now());

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await getAuthUser();
      if (cancelled) return;
      if (!u) {
        router.replace('/login?next=/account');
        return;
      }
      setUser(u);

      let p: DbUser | null = null;
      try {
        p = await getUserProfile();
        if (cancelled) return;
        setProfile(p);
        if (p?.username) setUsernameEdit(p.username);
      } catch {
        /* ignore */
      }

      try {
        const [wRes, lRes] = await Promise.all([
          fetch('/api/plus/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: u.id, source: 'workink' }),
          }),
          fetch('/api/plus/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: u.id, source: 'lootlabs' }),
          }),
        ]);
        const wData = await wRes.json();
        const lData = await lRes.json();
        if (!cancelled) {
          const workink =
            (wData.ok && typeof wData.url === 'string' && wData.url) ||
            `${WORKINK_FALLBACK}?ref=${u.id.slice(0, 8)}`;
          const lootlabsCandidate =
            (lData.ok && typeof lData.url === 'string' && lData.url) ||
            (LOOTLABS_FALLBACK
              ? `${LOOTLABS_FALLBACK}${LOOTLABS_FALLBACK.includes('?') ? '&' : '?'}puid=${encodeURIComponent(u.id)}`
              : '');
          setPlusLinks({
            workink,
            lootlabs: isExternalPartnerUrl(lootlabsCandidate) ? lootlabsCandidate : '',
          });
        }
      } catch {
        if (!cancelled) {
          setPlusLinks({
            workink: `${WORKINK_FALLBACK}?ref=${u.id.slice(0, 8)}`,
            lootlabs:
              LOOTLABS_FALLBACK && isExternalPartnerUrl(LOOTLABS_FALLBACK)
                ? `${LOOTLABS_FALLBACK}${LOOTLABS_FALLBACK.includes('?') ? '&' : '?'}puid=${encodeURIComponent(u.id)}`
                : '',
          });
        }
      }

      if (!cancelled) setLoading(false);

      const params = new URLSearchParams(window.location.search);
      const fromPlus = params.get('plus') === '1' || params.get('from') === 'lootlabs';
      if (!fromPlus) return;

      if (isPlusActive(p)) {
        setUnlockPhase('ready');
        showToast('Talmor Plus is active');
        history.replaceState(null, '', '/account#plus');
        return;
      }

      setUnlockPhase('waiting');
      history.replaceState(null, '', '/account#plus');

      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        if (cancelled) return;
        try {
          const next = await getUserProfile();
          if (next) setProfile(next);
          if (isPlusActive(next)) {
            setUnlockPhase('ready');
            showToast('Talmor Plus unlocked');
            return;
          }
        } catch {
          /* ignore */
        }
      }
      if (!cancelled) setUnlockPhase('failed');
    })();
    return () => {
      cancelled = true;
    };
  }, [router, showToast]);

  async function handleSaveUsername() {
    if (!usernameEdit.trim()) return;
    setSaving(true);
    try {
      await updateUserProfile(usernameEdit.trim());
      setProfile((prev) => (prev ? { ...prev, username: usernameEdit.trim() } : prev));
      showToast('Username saved');
    } catch {
      showToast('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await signOut();
    router.replace('/');
  }

  function handleDownload() {
    if (!DOWNLOAD_URL) {
      showToast('Download will be available soon');
      return;
    }
    window.location.href = DOWNLOAD_URL;
  }

  async function copyPlusKey() {
    if (!profile?.license_key) return;
    try {
      await navigator.clipboard.writeText(profile.license_key);
      showToast('Key copied');
    } catch {
      showToast('Could not copy');
    }
  }

  const plusActive = useMemo(() => isPlusActive(profile), [profile, now]);
  const remaining = plusActive ? formatRemaining(profile?.key_expires_at) : '';
  const workinkUrl = plusLinks?.workink || `${WORKINK_FALLBACK}?ref=${user?.id?.slice(0, 8) || ''}`;
  const lootlabsUrl = plusLinks?.lootlabs || '';
  const lootlabsReady = !!lootlabsUrl && isExternalPartnerUrl(lootlabsUrl);
  const displayName = profile?.username || user?.email?.split('@')[0] || 'Operator';
  const initial = (displayName[0] || '?').toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <SiteBackdrop />
        <Image src="/logo.png" alt="Talmor" width={44} height={44} className="relative z-10 opacity-50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-[var(--fg)]">
      <SiteBackdrop />

      {toast && (
        <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)]/95 px-5 py-2.5 text-xs text-white shadow-lg backdrop-blur-xl">
          {toast}
        </div>
      )}

      <header className="site-nav sticky top-0 z-40 relative">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Talmor" width={28} height={28} />
            <span className="font-display text-sm font-bold tracking-tight text-white">Talmor</span>
          </Link>
          <nav className="flex items-center gap-5 text-[13px] text-[var(--muted)]">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <a href={DOCS_URL} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Docs</a>
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
            <button type="button" onClick={handleLogout} className="hover:text-white transition-colors">
              Log out
            </button>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-5 pb-24 pt-12 sm:pt-16">
        {/* Hero */}
        <section className="animate-rise">
          <p className="mono-label">Account</p>
          <div className="mt-5 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent-soft)] font-display text-2xl font-bold text-[var(--accent-bright)]">
                {initial}
              </div>
              <div>
                <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                  {displayName}
                </h1>
                <p className="mt-2 text-sm text-[var(--muted)]">{user?.email}</p>
              </div>
            </div>

            <div
              className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-xs font-semibold sm:self-auto ${
                plusActive
                  ? 'border-[var(--accent)]/35 bg-[var(--accent-soft)] text-[var(--accent-bright)]'
                  : 'border-[var(--border-strong)] bg-white/[0.03] text-[var(--muted)]'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${plusActive ? 'bg-[var(--accent-bright)]' : 'bg-zinc-500'}`} />
              {plusActive ? `Plus · ${remaining}` : 'Free plan'}
            </div>
          </div>
        </section>

        {(unlockPhase === 'waiting' || unlockPhase === 'failed') && (
          <section className="mt-10 animate-fade-in">
            {unlockPhase === 'waiting' ? (
              <div className="panel border-[var(--accent)]/25 bg-[var(--accent-soft)] px-6 py-5">
                <p className="mono-label">LootLabs</p>
                <p className="mt-2 font-display text-xl font-bold text-white">Unlocking Plus…</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Waiting for the partner postback. This usually takes a few seconds.
                </p>
              </div>
            ) : (
              <div className="panel border-amber-500/25 bg-amber-500/[0.06] px-6 py-5">
                <p className="mono-label !text-amber-200/80">LootLabs</p>
                <p className="mt-2 font-display text-xl font-bold text-white">Offer done — Plus not activated</p>
                <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                  Redirect alone does nothing if the locker still points at{' '}
                  <code className="text-white/70">/account</code>. After deploy, click LootLabs again —
                  we now create a fresh locker that returns through a signed unlock URL. Also set this
                  exact postback in LootLabs Advanced (LootLabs appends click_id itself):
                </p>
                <p className="mt-3 break-all font-mono text-[11px] text-amber-100/90">
                  https://talmor.top/api/plus/lootlabs?secret=YOUR_SECRET
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Same value as <code className="text-white/70">LOOTLABS_POSTBACK_SECRET</code> on Vercel.
                  Or use Work.ink below.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Plan + Download */}
        <section className="mt-14 grid gap-5 lg:grid-cols-2">
          <div id="download" className="panel animate-fade-in p-8">
            <p className="mono-label">Download</p>
            <h2 className="font-display mt-3 text-3xl font-bold text-white">Get Talmor</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Windows x64 build. Sign in on desktop with this same account. Core stays free.
            </p>
            <button
              type="button"
              onClick={handleDownload}
              className="btn-white mt-8 inline-flex px-7 py-3 text-sm"
            >
              Download Windows x64
            </button>
          </div>

          <div id="plus" className="panel animate-fade-in p-8 [animation-delay:80ms]">
            <p className="mono-label">Plan</p>
            <h2 className="font-display mt-3 text-3xl font-bold text-white">
              {plusActive ? 'Talmor Plus' : 'Unlock Plus'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              {plusActive
                ? 'Your 24-hour key is ready. Paste it in the desktop app after sign-in.'
                : 'Finish one partner offer. You get a 16-character key valid for 24 hours.'}
            </p>

            {plusActive ? (
              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-[var(--accent)]/30 bg-black/30 px-5 py-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Activation key</p>
                  <p className="mt-2 font-mono text-lg tracking-[0.18em] text-white break-all select-all">
                    {profile?.license_key}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Expires {profile?.key_expires_at ? new Date(profile.key_expires_at).toLocaleString() : '—'}
                    {remaining ? ` · ${remaining}` : ''}
                  </p>
                </div>
                <button type="button" onClick={copyPlusKey} className="btn-primary px-6 py-2.5 text-sm">
                  Copy key
                </button>
              </div>
            ) : (
              <div className="mt-8 space-y-3">
                <a
                  href={workinkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between rounded-2xl border border-[var(--border)] bg-black/25 px-5 py-4 transition-colors hover:border-[var(--accent)]/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">Work.ink</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">Offer wall · lands on verify with your key</p>
                  </div>
                  <span className="text-[var(--accent-bright)] transition-transform group-hover:translate-x-0.5">→</span>
                </a>
                {lootlabsReady ? (
                  <a
                    href={lootlabsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-2xl border border-[var(--border)] bg-black/25 px-5 py-4 transition-colors hover:border-[var(--accent)]/40"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">LootLabs</p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">Tasks · signed return unlocks Plus</p>
                    </div>
                    <span className="text-[var(--accent-bright)] transition-transform group-hover:translate-x-0.5">→</span>
                  </a>
                ) : (
                  <div className="rounded-2xl border border-[var(--border)] bg-black/20 px-5 py-4 opacity-55">
                    <p className="text-sm font-semibold text-white">LootLabs</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">Locker not configured</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Profile settings */}
        <section className="section-rule mt-16 pt-14 animate-fade-in">
          <p className="mono-label">Profile</p>
          <h2 className="font-display mt-3 text-3xl font-bold text-white">Settings</h2>
          <p className="mt-3 max-w-lg text-sm text-[var(--muted)]">
            Display name on this account. Email is managed by your login provider.
          </p>

          <div className="mt-8 max-w-md">
            <label className="mono-label !normal-case !tracking-wide !text-[var(--muted)]">Username</label>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={usernameEdit}
                onChange={(e) => setUsernameEdit(e.target.value)}
                className="flex-1 rounded-full border border-[var(--border-strong)] bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--accent)]/50 focus:outline-none"
                placeholder="your_username"
              />
              <button
                type="button"
                onClick={handleSaveUsername}
                disabled={saving || !usernameEdit.trim()}
                className="btn-ghost px-5 py-2.5 text-sm disabled:opacity-40"
              >
                {saving ? '…' : 'Save'}
              </button>
            </div>
            <p className="mt-4 text-xs text-[var(--muted)]">
              Member since{' '}
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
              {profile?.role && profile.role !== 'user' ? ` · ${profile.role}` : ''}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
