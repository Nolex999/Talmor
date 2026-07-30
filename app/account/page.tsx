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
const LOOTLABS_FALLBACK = process.env.NEXT_PUBLIC_LOOTLABS_URL || 'https://lootlabs.gg/talmor-plus';
const DOWNLOAD_URL = process.env.NEXT_PUBLIC_DOWNLOAD_URL || '';

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
          setPlusLinks({
            workink: wData.url || `${WORKINK_FALLBACK}?ref=${u.id.slice(0, 8)}`,
            lootlabs: lData.url || `${LOOTLABS_FALLBACK}?ref=${u.id.slice(0, 8)}`,
          });
        }
      } catch {
        if (!cancelled) {
          setPlusLinks({
            workink: `${WORKINK_FALLBACK}?ref=${u.id.slice(0, 8)}`,
            lootlabs: `${LOOTLABS_FALLBACK}?ref=${u.id.slice(0, 8)}`,
          });
        }
      }

      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router]);

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
      showToast('Download link not configured yet — check back soon.');
      return;
    }
    window.location.href = DOWNLOAD_URL;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative">
        <SiteBackdrop />
        <Image src="/logo.svg" alt="Talmor" width={48} height={48} className="relative z-10 opacity-50 animate-pulse" />
      </div>
    );
  }

  const workinkUrl = plusLinks?.workink || `${WORKINK_FALLBACK}?ref=${user?.id?.slice(0, 8) || ''}`;
  const lootlabsUrl = plusLinks?.lootlabs || `${LOOTLABS_FALLBACK}?ref=${user?.id?.slice(0, 8) || ''}`;

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
            <Image src="/logo.svg" alt="Talmor" width={28} height={28} />
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

        {/* Free download — no keys */}
        <section id="download" className="max-w-md mx-auto animate-fade-in">
          <div className="rounded-2xl border border-zinc-900 bg-black/40 backdrop-blur-xl p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A9E7E]">Free</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Download Talmor</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Your account is enough. No activation key — download and sign in on the desktop app.
            </p>
            <button
              onClick={handleDownload}
              className="mt-5 w-full btn-white py-2.5 text-sm font-semibold"
            >
              Download Windows x64
            </button>
            {!DOWNLOAD_URL && (
              <p className="mt-3 text-[11px] text-zinc-600 text-center">
                Set <code className="text-zinc-500">NEXT_PUBLIC_DOWNLOAD_URL</code> to enable the file link.
              </p>
            )}
          </div>
        </section>

        {/* Plus */}
        <section id="plus" className="max-w-md mx-auto animate-fade-in">
          <div className="text-center mb-5">
            <h2 className="text-lg font-semibold text-white">Talmor Plus</h2>
            <p className="text-sm text-zinc-500 mt-1">Optional premium unlock via partners.</p>
          </div>

          {profile?.raknet_unlocked ? (
            <div className="rounded-2xl border border-[#7A9E7E]/20 bg-[#7A9E7E]/5 p-6 text-center">
              <p className="text-[#7A9E7E] font-semibold">Talmor Plus is unlocked</p>
              <p className="text-xs text-zinc-500 mt-2">Premium options are available on your account.</p>
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
                  <p className="text-xs text-zinc-500 mt-0.5">Complete an offer to unlock</p>
                </div>
                <span className="text-sm text-[#7A9E7E] group-hover:translate-x-1 transition-transform">&#8594;</span>
              </a>
              <a
                href={lootlabsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-zinc-900 bg-black/40 p-4 hover:border-[#7A9E7E]/40 hover:bg-[#7A9E7E]/5 transition-all group"
              >
                <div>
                  <p className="text-sm font-medium text-white">LootLabs</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Complete an offer to unlock</p>
                </div>
                <span className="text-sm text-[#7A9E7E] group-hover:translate-x-1 transition-transform">&#8594;</span>
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
