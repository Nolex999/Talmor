'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getAuthUser,
  getUserProfile,
  updateUserProfile,
  signOut,
  type AuthUser,
  type DbUser,
} from '../../lib/supabase';

type Tab = 'overview' | 'keys' | 'downloads' | 'settings' | 'admin';

function getTimeRemaining(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m remaining`;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<DbUser | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [usernameEdit, setUsernameEdit] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const [inviteCount, setInviteCount] = useState(1);
  const [generatedCodes, setGeneratedCodes] = useState<{ code: string; created_at: string }[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);

  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin';

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await getAuthUser();
      if (cancelled) return;
      if (!u) {
        router.replace('/login');
        return;
      }
      setUser(u);
      try {
        const p = await getUserProfile();
        if (cancelled) return;
        setProfile(p);
        if (p?.username) setUsernameEdit(p.username);
        if (p && !p.license_key) setTab('keys');
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

  async function handleGenerateKey() {
    setGeneratingKey(true);
    try {
      const supabase = (await import('../../lib/supabase/client')).createClient();
      const { data, error } = await supabase.rpc('generate_activation_key');
      if (error || !data?.success) {
        showToast(data?.error || 'Failed to generate key');
        return;
      }
      setProfile((prev) => (prev ? { ...prev, license_key: data.key } : prev));
      showToast(data.existing ? 'Your existing key' : 'Activation key generated (valid 24h)');
    } catch {
      showToast('Network error');
    } finally {
      setGeneratingKey(false);
    }
  }

  async function handleGenerateInvites() {
    setGenerating(true);
    try {
      const supabase = (await import('../../lib/supabase/client')).createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('Session expired');
        return;
      }

      const res = await fetch('/api/invite/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ count: inviteCount }),
      });

      const data = await res.json();
      if (data.codes) {
        setGeneratedCodes((prev) => [...data.codes, ...prev]);
        showToast(`Generated ${data.codes.length} invite code(s)`);
      } else {
        showToast(data.error || 'Failed to generate');
      }
    } catch {
      showToast('Network error');
    } finally {
      setGenerating(false);
    }
  }

  const keyExpires = (profile as any)?.key_expires_at ?? null;
  const timeRemaining = getTimeRemaining(keyExpires);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[#7A9E7E] border-t-transparent animate-spin" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'keys', label: 'KEYS' },
    { id: 'downloads', label: 'DOWNLOADS' },
    { id: 'settings', label: 'SETTINGS' },
    ...(isAdmin ? [{ id: 'admin' as Tab, label: 'ADMIN' }] : []),
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #7A9E7E 0%, transparent 70%)', animation: 'float 6s ease-in-out infinite' }}
        />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #7A9E7E 0%, transparent 70%)', animation: 'float 8s ease-in-out infinite 3s' }}
        />
      </div>

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-zinc-900 backdrop-blur-md border border-zinc-800 text-xs text-white animate-fade-in">
          {toast}
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7A9E7E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <div>
              <h1 className="text-lg font-bold tracking-tight">TALMOR</h1>
              <p className="text-[10px] text-zinc-600 tracking-[0.15em]">DASHBOARD</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-[11px] text-zinc-600 hover:text-white transition-colors tracking-wider px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600"
            >
              HOME
            </Link>
            <a
              href="/support"
              className="text-[11px] text-zinc-600 hover:text-white transition-colors tracking-wider px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600"
            >
              SUPPORT
            </a>
            <button
              onClick={handleLogout}
              className="text-[11px] text-zinc-600 hover:text-white transition-colors tracking-wider px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600"
            >
              LOG OUT
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-zinc-900">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-[11px] font-semibold tracking-wider transition-colors relative ${
                tab === t.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-300'
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#7A9E7E] shadow-[0_0_12px_rgba(122,158,126,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-xl p-6">
              <h2 className="text-xs font-semibold tracking-wider text-zinc-500 mb-4">ACCOUNT</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-zinc-600 tracking-wide mb-1">EMAIL</p>
                  <p className="text-sm text-white">{user?.email ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-600 tracking-wide mb-1">USERNAME</p>
                  <p className="text-sm text-white">{profile?.username ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-600 tracking-wide mb-1">ROLE</p>
                  <p className="text-sm text-white capitalize">{profile?.role ?? 'user'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-600 tracking-wide mb-1">MEMBER SINCE</p>
                  <p className="text-sm text-white">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-xl p-6">
              <h2 className="text-xs font-semibold tracking-wider text-zinc-500 mb-4">PLAN</h2>
              <p className="text-sm text-white mb-2">Talmor &mdash; <span className="text-[#7A9E7E]">Free</span></p>
              <p className="text-xs text-zinc-600 mb-4">
                Plus unlocks premium download options. Complete a Work.ink or LootLabs offer, then
                redeem your code.
              </p>
              <a href="/raknet" className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#7A9E7E]/10 text-[#7A9E7E] text-xs font-semibold hover:bg-[#7A9E7E]/20 transition-colors">
                {profile?.raknet_unlocked ? 'Plus unlocked' : 'Unlock Plus'}
              </a>
            </div>

            <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-xl p-6">
              <h2 className="text-xs font-semibold tracking-wider text-zinc-500 mb-4">ACTIVATION STATUS</h2>
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${profile?.license_key ? 'bg-[#7A9E7E]' : 'bg-zinc-600'}`} />
                <p className="text-sm text-white">
                  {profile?.license_key ? 'Activation key ready' : 'No activation key generated'}
                </p>
              </div>
              {profile?.license_key && (
                <div className="mt-3 space-y-2">
                  <div className="px-3 py-2 rounded-lg bg-black border border-zinc-900 text-xs font-mono text-zinc-400 flex items-center justify-between">
                    <span>{profile.license_key}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(profile.license_key!);
                        showToast('Copied to clipboard');
                      }}
                      className="text-[10px] text-zinc-600 hover:text-white transition-colors tracking-wider ml-3"
                    >
                      COPY
                    </button>
                  </div>
                  {timeRemaining && (
                    <p className="text-[11px] text-zinc-500">
                      Expires in <span className="text-[#7A9E7E]">{timeRemaining}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'keys' && (
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-xl p-6">
            <h2 className="text-xs font-semibold tracking-wider text-zinc-500 mb-4">YOUR ACTIVATION KEY</h2>
            {profile?.license_key ? (
              <div className="space-y-4">
                <div className="px-4 py-3 rounded-lg bg-black border border-zinc-900 font-mono text-sm text-white tracking-wider flex items-center justify-between">
                  <span>{profile.license_key}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(profile.license_key!);
                      showToast('Copied to clipboard');
                    }}
                    className="text-[10px] text-zinc-600 hover:text-white transition-colors tracking-wider"
                  >
                    COPY
                  </button>
                </div>
                {timeRemaining ? (
                  <p className="text-[11px] text-zinc-600">
                    Your key expires in{' '}
                    <span className="text-[#7A9E7E] font-medium">{timeRemaining}</span>.{' '}
                    Regenerate below to reset the timer.
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-600">
                    After signing in to the Talmor app, enter this key to activate.
                  </p>
                )}
                <button
                  onClick={handleGenerateKey}
                  disabled={generatingKey}
                  className="px-4 py-2 rounded-lg border border-zinc-800 text-[11px] font-semibold tracking-wider text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-40"
                >
                  {generatingKey ? 'REGENERATING...' : 'REGENERATE KEY (resets 24h)'}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-zinc-500 mb-4">You haven't generated an activation key yet.</p>
                <button
                  onClick={handleGenerateKey}
                  disabled={generatingKey}
                  className="btn-primary px-6 py-3 rounded-lg text-[11px] font-semibold tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {generatingKey ? 'GENERATING...' : 'GENERATE ACTIVATION KEY'}
                </button>
                <p className="text-[11px] text-zinc-600 mt-4">
                  Required to sign in to the Talmor desktop app. Valid for 24 hours.
                </p>
              </div>
            )}
          </div>
        )}

        {tab === 'downloads' && (
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-xl p-6">
            <h2 className="text-xs font-semibold tracking-wider text-zinc-500 mb-4">DOWNLOAD TALMOR</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-black border border-zinc-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-semibold">Talmor v1.0</p>
                    <p className="text-[10px] text-zinc-600 mt-1">Latest release &bull; Windows 10/11 &bull; x64</p>
                  </div>
                  <a
                    href="#"
                    className="btn-white px-4 py-2 rounded-lg text-[11px] font-semibold tracking-wider"
                  >
                    DOWNLOAD
                  </a>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-black border border-zinc-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-semibold">Talmor Plus</p>
                    <p className="text-[10px] text-zinc-600 mt-1">Unlock via partner offer &bull; Premium download</p>
                  </div>
                  <a
                    href="/raknet"
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#7A9E7E]/10 text-[#7A9E7E] text-[11px] font-semibold hover:bg-[#7A9E7E]/20 transition-colors"
                  >
                    {profile?.raknet_unlocked ? 'Unlocked' : 'Unlock Plus'}
                  </a>
                </div>
              </div>
              <p className="text-[11px] text-zinc-600">
                Requires administrator privileges. Antivirus may flag the executor &mdash; this is expected.
              </p>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-xl p-6">
              <h2 className="text-xs font-semibold tracking-wider text-zinc-500 mb-4">USERNAME</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={usernameEdit}
                  onChange={(e) => setUsernameEdit(e.target.value)}
                  className="flex-1 px-4 py-3 bg-black border border-zinc-900 rounded-lg focus:outline-none focus:border-[#7A9E7E] text-sm text-white placeholder-zinc-600"
                  placeholder="your_username"
                />
                <button
                  onClick={handleSaveUsername}
                  disabled={saving || !usernameEdit.trim()}
                  className="btn-primary px-6 py-3 rounded-lg text-[11px] font-semibold tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? 'SAVING...' : 'SAVE'}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-xl p-6">
              <h2 className="text-xs font-semibold tracking-wider text-zinc-500 mb-4">DANGER ZONE</h2>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg text-[11px] font-semibold tracking-wider hover:bg-red-500/10 transition-colors"
              >
                LOG OUT
              </button>
            </div>
          </div>
        )}

        {tab === 'admin' && isAdmin && (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-xl p-6">
              <h2 className="text-xs font-semibold tracking-wider text-zinc-500 mb-4">GENERATE INVITE CODES</h2>
              <p className="text-[11px] text-zinc-600 mb-4">
                Create invite codes for new users. Each code can only be used once.
              </p>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-[10px] text-zinc-600 tracking-wide mb-1">COUNT</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={inviteCount}
                    onChange={(e) => setInviteCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-4 py-3 bg-black border border-zinc-900 rounded-lg focus:outline-none focus:border-[#7A9E7E] text-sm text-white"
                  />
                </div>
                <button
                  onClick={handleGenerateInvites}
                  disabled={generating}
                  className="btn-primary px-6 py-3 rounded-lg text-[11px] font-semibold tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {generating ? 'GENERATING...' : 'GENERATE'}
                </button>
              </div>
            </div>

            {generatedCodes.length > 0 && (
              <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold tracking-wider text-zinc-500">GENERATED CODES</h2>
                  <button
                    onClick={() => {
                      const all = generatedCodes.map((c) => c.code).join('\n');
                      navigator.clipboard.writeText(all);
                      showToast('All codes copied');
                    }}
                    className="text-[10px] text-zinc-600 hover:text-white transition-colors tracking-wider"
                  >
                    COPY ALL
                  </button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {generatedCodes.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-black border border-zinc-900"
                    >
                      <code className="font-mono text-xs text-zinc-400 tracking-wider">{c.code}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(c.code);
                          showToast('Copied');
                        }}
                        className="text-[10px] text-zinc-600 hover:text-white transition-colors"
                      >
                        COPY
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-xl p-6">
              <h2 className="text-xs font-semibold tracking-wider text-zinc-500 mb-4">ROLE INFO</h2>
              <div className="space-y-2 text-[11px] text-zinc-600">
                <p><span className="text-zinc-300">Owner</span> — Full access. Can manage users, generate codes, assign licenses.</p>
                <p><span className="text-zinc-300">Admin</span> — Can generate invite codes and manage tickets.</p>
                <p><span className="text-zinc-300">User</span> — Standard access. Can submit support tickets and view their license.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


