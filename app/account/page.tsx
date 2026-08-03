'use client';

import { useState, useEffect, useCallback } from 'react';
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

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [usernameEdit, setUsernameEdit] = useState('');
  const [saving, setSaving] = useState(false);
  const [plusLinks, setPlusLinks] = useState<{ workink: string; lootlabs: string } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await getAuthUser();
      if (cancelled) return;
      if (!u) { router.replace('/login?next=/account'); return; }
      setUser(u);
      try {
        const p = await getUserProfile();
        if (cancelled) return;
        setProfile(p);
        if (p?.username) setUsernameEdit(p.username);
      } catch {}

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

      // LootLabs returns here with ?plus=1 — refresh profile a few times.
      if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('plus') === '1') {
        for (let i = 0; i < 4; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          if (cancelled) return;
          try {
            const p = await getUserProfile();
            if (p) setProfile(p);
            if (
              p?.license_key &&
              p.key_expires_at &&
              new Date(p.key_expires_at).getTime() > Date.now()
            ) {
              showToast('Talmor Plus unlocked');
              break;
            }
          } catch {}
        }
      }
    })();
    return () => { cancelled = true; };
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
      showToast('Download will be available soon.');
      return;
    }
    window.location.href = DOWNLOAD_URL;
  }

  const plusActive =
    !!profile?.license_key &&
    !!profile.key_expires_at &&
    new Date(profile.key_expires_at).getTime() > Date.now();

  async function copyPlusKey() {
    if (!profile?.license_key) return;
    try {
      await navigator.clipboard.writeText(profile.license_key);
      showToast('Key copied');
    } catch {
      showToast('Could not copy');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative">
        <SiteBackdrop />
        <Image src="/logo.png" alt="Talmor" width={48} height={48} className="relative z-10 opacity-50 animate-pulse" />
      </div>
    );
  }

  const workinkUrl = plusLinks?.workink || `${WORKINK_FALLBACK}?ref=${user?.id?.slice(0, 8) || ''}`;
  const lootlabsUrl = plusLinks?.lootlabs || '';
  const lootlabsReady = !!lootlabsUrl && isExternalPartnerUrl(lootlabsUrl);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <SiteBackdrop />

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-white animate-fade-in shadow-lg">
          {toast}
        </div>
      )}

      <div className="relative z-10 border-b border-zinc-900/80 site-nav">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Talmor" width={28} height={28} />
            <span className="text-sm font-semibold tracking-tight">Talmor</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">Home</Link>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-sm hover:border-zinc-700 transition-colors"
              >
                <div className="h-7 w-7 rounded-full bg-[#7A9E7E]/20 flex items-center justify-center text-xs font-semibold text-[#7A9E7E]">
                  {(user?.email?.[0] || '?').toUpperCase()}
                </div>
                <span className="text-xs text-zinc-300 hidden sm:block max-w-[160px] truncate">{user?.email}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-zinc-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 z-20 rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-800">
                      <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                    </div>
                    <a href="#download" onClick={() => setMenuOpen(false)} className="block w-full text-left px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                      Download
                    </a>
                    <a href="#plus" onClick={() => setMenuOpen(false)} className="block w-full text-left px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                      Talmor Plus
                    </a>
                    <Link href="/support" className="block px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                      Support
                    </Link>
                    <div className="border-t border-zinc-800">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 space-y-10">
        {/* Profile */}
        <section className="max-w-md mx-auto text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-[#7A9E7E]/10 mx-auto mb-4 flex items-center justify-center border border-[#7A9E7E]/20">
            <span className="text-3xl font-bold text-[#7A9E7E]">
              {(user?.email?.[0] || '?').toUpperCase()}
            </span>
          </div>
          <h1 className="text-xl font-semibold text-white">
            {profile?.username || 'Your account'}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">{user?.email}</p>
          <p className="text-xs text-zinc-600 mt-1">
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1 border border-zinc-800">
            <span className={`h-1.5 w-1.5 rounded-full ${profile?.role === 'owner' ? 'bg-yellow-400' : profile?.role === 'admin' ? 'bg-blue-400' : 'bg-[#7A9E7E]'}`} />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{profile?.role || 'user'}</span>
          </div>

          <div className="mt-8 text-left">
            <label className="block text-xs text-zinc-600 mb-1.5 tracking-wide">USERNAME</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={usernameEdit}
                onChange={(e) => setUsernameEdit(e.target.value)}
                className="flex-1 px-3 py-2 bg-black border border-zinc-900 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#7A9E7E] transition-colors"
                placeholder="your_username"
              />
              <button
                onClick={handleSaveUsername}
                disabled={saving || !usernameEdit.trim()}
                className="px-4 py-2 rounded-lg bg-[#7A9E7E]/10 text-[#7A9E7E] text-xs font-semibold hover:bg-[#7A9E7E]/20 transition-colors disabled:opacity-40"
              >
                {saving ? '...' : 'Save'}
              </button>
            </div>
          </div>
        </section>

        {/* Free download */}
        <section id="download" className="max-w-md mx-auto animate-fade-in">
          <div className="rounded-2xl border border-zinc-900 bg-black/40 backdrop-blur-xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A9E7E]">Free</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Download Talmor</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Sign in on the desktop app with the same account. Talmor Plus is optional.
            </p>
            <button
              onClick={handleDownload}
              className="mt-5 w-full btn-white py-2.5 text-sm font-semibold"
            >
              Download Windows x64
            </button>
          </div>
        </section>

        {/* Plus */}
        <section id="plus" className="max-w-md mx-auto animate-fade-in">
          <div className="text-center mb-5">
            <h2 className="text-lg font-semibold text-white">Talmor Plus</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Complete a partner offer to get a 24-hour activation key.
            </p>
          </div>

          {plusActive ? (
            <div className="rounded-2xl border border-[#7A9E7E]/20 bg-[#7A9E7E]/5 p-6">
              <p className="text-[#7A9E7E] font-semibold text-center">Talmor Plus active</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-4 mb-2">Activation key</p>
              <p className="font-mono text-base text-white tracking-wider break-all select-all">
                {profile?.license_key}
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                Expires {profile?.key_expires_at ? new Date(profile.key_expires_at).toLocaleString() : '—'}
              </p>
              <button
                type="button"
                onClick={copyPlusKey}
                className="mt-4 w-full rounded-lg border border-zinc-800 bg-black/40 py-2 text-xs text-zinc-300 hover:text-white transition-colors"
              >
                Copy key
              </button>
              <p className="text-[11px] text-zinc-600 mt-3 text-center">
                Paste this key in the Talmor desktop app after signing in.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <a
                href={workinkUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-zinc-900 bg-black/40 p-4 hover:border-[#7A9E7E]/40 hover:bg-[#7A9E7E]/5 transition-all group"
              >
                <div>
                  <p className="text-sm font-medium text-white">Work.ink</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Complete an offer · get a 24h key</p>
                </div>
                <span className="text-sm text-[#7A9E7E] group-hover:translate-x-1 transition-transform">&#8594;</span>
              </a>
              {lootlabsReady ? (
                <a
                  href={lootlabsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-zinc-900 bg-black/40 p-4 hover:border-[#7A9E7E]/40 hover:bg-[#7A9E7E]/5 transition-all group"
                >
                  <div>
                    <p className="text-sm font-medium text-white">LootLabs</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Complete an offer · get a 24h key</p>
                  </div>
                  <span className="text-sm text-[#7A9E7E] group-hover:translate-x-1 transition-transform">&#8594;</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => showToast('LootLabs link not configured yet')}
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-900 bg-black/40 p-4 text-left opacity-60 cursor-not-allowed"
                >
                  <div>
                    <p className="text-sm font-medium text-white">LootLabs</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Unavailable until locker URL / API token is set</p>
                  </div>
                  <span className="text-sm text-zinc-600">—</span>
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
