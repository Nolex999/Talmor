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

function getTimeRemaining(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<DbUser | null>(null);
  const [view, setView] = useState<'profile' | 'key' | 'plus'>('profile');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [usernameEdit, setUsernameEdit] = useState('');
  const [saving, setSaving] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await getAuthUser();
      if (cancelled) return;
      if (!u) { router.replace('/login'); return; }
      setUser(u);
      try {
        const p = await getUserProfile();
        if (cancelled) return;
        setProfile(p);
        if (p?.username) setUsernameEdit(p.username);
        if (p && !p.license_key) {
          const supabase = (await import('../../lib/supabase/client')).createClient();
          const { data } = await supabase.rpc('generate_activation_key');
          if (data?.success) {
            setProfile((prev) => (prev ? { ...prev, license_key: data.key, key_expires_at: data.expires_at } : prev));
          }
        }
        if (p && p.license_key) {
          setView('key');
        }
      } catch {}
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
    } catch { showToast('Failed to save'); }
    finally { setSaving(false); }
  }

  async function handleLogout() {
    await signOut();
    router.replace('/');
  }

  async function handleRegenerateKey() {
    setGeneratingKey(true);
    try {
      const supabase = (await import('../../lib/supabase/client')).createClient();
      const { data, error } = await supabase.rpc('generate_activation_key');
      if (error || !data?.success) {
        showToast(data?.error || 'Failed');
        return;
      }
      setProfile((prev) => (prev ? { ...prev, license_key: data.key, key_expires_at: data.expires_at } : prev));
      showToast('New key generated (24h)');
    } catch { showToast('Network error'); }
    finally { setGeneratingKey(false); }
  }

  const keyExpires = (profile as any)?.key_expires_at ?? null;
  const timeRemaining = getTimeRemaining(keyExpires);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Image src="/logo.svg" alt="Talmor" width={48} height={48} className="opacity-50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-[0.02]"
          style={{ background: 'radial-gradient(ellipse, #7A9E7E 0%, transparent 70%)' }}
        />
      </div>

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-white animate-fade-in shadow-lg">
          {toast}
        </div>
      )}

      {/* Top bar */}
      <div className="relative z-10 border-b border-zinc-900">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
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
                <span className="text-xs text-zinc-300 hidden sm:block">{user?.email}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-zinc-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 z-20 rounded-xl border border-zinc-800 bg-zinc-900 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-800">
                      <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setView('profile'); setMenuOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${view === 'profile' ? 'text-[#7A9E7E] bg-[#7A9E7E]/5' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Profile
                    </button>
                    <button
                      onClick={() => { setView('key'); setMenuOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${view === 'key' ? 'text-[#7A9E7E] bg-[#7A9E7E]/5' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                      Activation Key
                    </button>
                    <button
                      onClick={() => { setView('plus'); setMenuOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${view === 'plus' ? 'text-[#7A9E7E] bg-[#7A9E7E]/5' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      Talmor Plus
                    </button>
                    <div className="border-t border-zinc-800">
                      <Link href="/support" className="block px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                        Support
                      </Link>
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

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">

        {view === 'profile' && (
          <div className="max-w-md mx-auto text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-[#7A9E7E]/10 mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl font-bold text-[#7A9E7E]">
                {(user?.email?.[0] || '?').toUpperCase()}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-white">
              {profile?.username || 'User'}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">{user?.email}</p>
            <p className="text-xs text-zinc-600 mt-1">
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1">
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
          </div>
        )}

        {view === 'key' && (
          <div className="max-w-md mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#7A9E7E]/10 mx-auto mb-4 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A9E7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              </div>
              <h1 className="text-xl font-semibold text-white">Activation Key</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Your key is automatically linked to your account.
              </p>
            </div>

            {profile?.license_key ? (
              <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-xl p-6">
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-black border border-zinc-900 font-mono text-sm text-white tracking-wider">
                  <span className="truncate">{profile.license_key}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(profile.license_key!); showToast('Copied!'); }}
                    className="shrink-0 ml-3 text-[10px] text-zinc-600 hover:text-white transition-colors tracking-wider bg-zinc-900 px-2 py-1 rounded"
                  >
                    COPY
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${timeRemaining && timeRemaining !== 'Expired' ? 'bg-[#7A9E7E]' : 'bg-red-400'}`} />
                    <span className="text-xs text-zinc-500">
                      {timeRemaining ? `${timeRemaining} remaining` : 'No expiry'}
                    </span>
                  </div>
                  <button
                    onClick={handleRegenerateKey}
                    disabled={generatingKey}
                    className="text-xs text-zinc-500 hover:text-[#7A9E7E] transition-colors disabled:opacity-40"
                  >
                    {generatingKey ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl border border-zinc-900 bg-zinc-900/20">
                <p className="text-sm text-zinc-500">Generating your key...</p>
              </div>
            )}

            <p className="text-center text-[11px] text-zinc-600 mt-6">
              Enter this key in the Talmor desktop app to activate. Valid for 24 hours.
            </p>
          </div>
        )}

        {view === 'plus' && (
          <div className="max-w-md mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#7A9E7E]/10 mx-auto mb-4 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7A9E7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <h1 className="text-xl font-semibold text-white">Talmor Plus</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Unlock premium download options.
              </p>
            </div>

            {profile?.raknet_unlocked ? (
              <div className="rounded-2xl border border-[#7A9E7E]/20 bg-[#7A9E7E]/5 p-6 text-center">
                <span className="text-4xl mb-3 block">&#10003;</span>
                <p className="text-[#7A9E7E] font-semibold">Talmor Plus is unlocked</p>
                <p className="text-xs text-zinc-500 mt-2">Premium downloads are available.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <a
                  href={user ? `${(process.env.NEXT_PUBLIC_WORKINK_URL || 'https://work.ink/talmor-plus')}?ref=${user.id?.slice(0, 8)}` : '/login'}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-zinc-900 bg-zinc-900/20 p-4 hover:border-[#7A9E7E]/30 hover:bg-[#7A9E7E]/5 transition-all group"
                >
                  <div>
                    <p className="text-sm font-medium text-white">Work.ink</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Complete an offer to unlock</p>
                  </div>
                  <span className="text-sm text-[#7A9E7E] group-hover:translate-x-1 transition-transform">&#8594;</span>
                </a>
                <a
                  href={user ? `${(process.env.NEXT_PUBLIC_LOOTLABS_URL || 'https://lootlabs.gg/talmor-plus')}?ref=${user.id?.slice(0, 8)}` : '/login'}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-zinc-900 bg-zinc-900/20 p-4 hover:border-[#7A9E7E]/30 hover:bg-[#7A9E7E]/5 transition-all group"
                >
                  <div>
                    <p className="text-sm font-medium text-white">LootLabs</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Complete an offer to unlock</p>
                  </div>
                  <span className="text-sm text-[#7A9E7E] group-hover:translate-x-1 transition-transform">&#8594;</span>
                </a>
              </div>
            )}

            <p className="text-center text-[11px] text-zinc-600 mt-6">
              One-time unlock. No recurring payment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
