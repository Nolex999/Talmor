'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadSession,
  clearSession,
  getUserProfile,
  upsertUserProfile,
  signOut,
  type AuthUser,
  type DbUser,
} from '../../lib/supabase';

type Tab = 'overview' | 'keys' | 'downloads' | 'settings' | 'admin';

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

  const isAdmin = profile?.role === 'owner' || profile?.role === 'admin';

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  useEffect(() => {
    const stored = loadSession();
    if (!stored) {
      router.replace('/');
      return;
    }
    setUser(stored);
    getUserProfile()
      .then((p) => {
        setProfile(p);
        if (p?.username) setUsernameEdit(p.username);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSaveUsername() {
    if (!usernameEdit.trim()) return;
    setSaving(true);
    try {
      await upsertUserProfile(usernameEdit.trim());
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative w-24 h-24">
          <div className="liquid-logo">
            <div className="liquid-wave" />
          </div>
        </div>
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
    <div className="min-h-screen bg-black text-white bg-grid relative overflow-hidden">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-xs text-white animate-fade-in">
          {toast}
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-[128px] animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/[0.03] rounded-full blur-[128px] animate-float"
          style={{ animationDelay: '3s' }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="Talmor" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight">TALMOR</h1>
              <p className="text-[10px] text-zinc-500 tracking-[0.15em]">DASHBOARD</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/support"
              className="text-[11px] text-zinc-500 hover:text-white transition-colors tracking-wider px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
            >
              SUPPORT
            </a>
            <button
              onClick={handleLogout}
              className="text-[11px] text-zinc-500 hover:text-white transition-colors tracking-wider px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
            >
              LOG OUT
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-white/10">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-[11px] font-semibold tracking-wider transition-colors relative ${
                tab === t.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="gradient-border">
              <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6">
                <h2 className="text-xs font-semibold tracking-wider text-zinc-400 mb-4">ACCOUNT</h2>
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
            </div>

            <div className="gradient-border">
              <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6">
                <h2 className="text-xs font-semibold tracking-wider text-zinc-400 mb-4">LICENSE STATUS</h2>
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      profile?.license_key ? 'bg-emerald-400' : 'bg-zinc-600'
                    }`}
                  />
                  <p className="text-sm text-white">
                    {profile?.license_key ?? 'No license key assigned'}
                  </p>
                </div>
                {profile?.license_key && (
                  <p className="mt-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-xs font-mono text-zinc-400">
                    {profile.license_key}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'keys' && (
          <div className="gradient-border">
            <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6">
              <h2 className="text-xs font-semibold tracking-wider text-zinc-400 mb-4">YOUR LICENSE KEY</h2>
              {profile?.license_key ? (
                <div className="space-y-4">
                  <div className="px-4 py-3 rounded-lg bg-white/[0.03] border border-white/10 font-mono text-sm text-white tracking-wider flex items-center justify-between">
                    <span>{profile.license_key}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(profile.license_key!);
                        showToast('Copied to clipboard');
                      }}
                      className="text-[10px] text-zinc-500 hover:text-white transition-colors tracking-wider"
                    >
                      COPY
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-600">
                    Enter this key in the Talmor executor to activate your license.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-zinc-500 mb-3">No license key assigned yet.</p>
                  <p className="text-[11px] text-zinc-600">
                    Contact an administrator to receive your key.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'downloads' && (
          <div className="gradient-border">
            <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6">
              <h2 className="text-xs font-semibold tracking-wider text-zinc-400 mb-4">DOWNLOAD TALMOR</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white font-semibold">Talmor v1.0</p>
                      <p className="text-[10px] text-zinc-600 mt-1">Latest release &bull; Windows 10/11 &bull; x64</p>
                    </div>
                    <a
                      href="#"
                      className="px-4 py-2 bg-white text-black rounded-lg text-[11px] font-semibold tracking-wider hover:bg-gray-200 transition-colors"
                    >
                      DOWNLOAD
                    </a>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-600">
                  Requires administrator privileges. Antivirus may flag the executor — this is expected.
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-6">
            <div className="gradient-border">
              <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6">
                <h2 className="text-xs font-semibold tracking-wider text-zinc-400 mb-4">USERNAME</h2>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={usernameEdit}
                    onChange={(e) => setUsernameEdit(e.target.value)}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 text-sm text-white placeholder-zinc-600"
                    placeholder="your_username"
                  />
                  <button
                    onClick={handleSaveUsername}
                    disabled={saving || !usernameEdit.trim()}
                    className="px-6 py-3 bg-white text-black rounded-lg text-[11px] font-semibold tracking-wider hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {saving ? 'SAVING...' : 'SAVE'}
                  </button>
                </div>
              </div>
            </div>

            <div className="gradient-border">
              <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6">
                <h2 className="text-xs font-semibold tracking-wider text-zinc-400 mb-4">DANGER ZONE</h2>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg text-[11px] font-semibold tracking-wider hover:bg-red-500/10 transition-colors"
                >
                  LOG OUT
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'admin' && isAdmin && (
          <div className="space-y-6">
            <div className="gradient-border">
              <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6">
                <h2 className="text-xs font-semibold tracking-wider text-zinc-400 mb-4">GENERATE INVITE CODES</h2>
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
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 text-sm text-white"
                    />
                  </div>
                  <button
                    onClick={handleGenerateInvites}
                    disabled={generating}
                    className="px-6 py-3 bg-white text-black rounded-lg text-[11px] font-semibold tracking-wider hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {generating ? 'GENERATING...' : 'GENERATE'}
                  </button>
                </div>
              </div>
            </div>

            {generatedCodes.length > 0 && (
              <div className="gradient-border">
                <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-semibold tracking-wider text-zinc-400">GENERATED CODES</h2>
                    <button
                      onClick={() => {
                        const all = generatedCodes.map((c) => c.code).join('\n');
                        navigator.clipboard.writeText(all);
                        showToast('All codes copied');
                      }}
                      className="text-[10px] text-zinc-500 hover:text-white transition-colors tracking-wider"
                    >
                      COPY ALL
                    </button>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {generatedCodes.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10"
                      >
                        <code className="font-mono text-xs text-zinc-300 tracking-wider">{c.code}</code>
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
              </div>
            )}

            <div className="gradient-border">
              <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-6">
                <h2 className="text-xs font-semibold tracking-wider text-zinc-400 mb-4">ROLE INFO</h2>
                <div className="space-y-2 text-[11px] text-zinc-500">
                  <p><span className="text-zinc-300">Owner</span> — Full access. Can manage users, generate codes, assign licenses.</p>
                  <p><span className="text-zinc-300">Admin</span> — Can generate invite codes and manage tickets.</p>
                  <p><span className="text-zinc-300">User</span> — Standard access. Can submit support tickets and view their license.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
