'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

const WORKINK_URL = process.env.NEXT_PUBLIC_WORKINK_URL || 'https://work.ink/talmor-plus';
const LOOTLABS_URL = process.env.NEXT_PUBLIC_LOOTLABS_URL || 'https://lootlabs.gg/talmor-plus';

export default function RakNetPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('raknet_unlocked')
        .eq('id', user.id)
        .maybeSingle();
      setUnlocked(!!data?.raknet_unlocked);
    })();
  }, [supabase]);

  const userWorkspace = user?.id
    ? `${WORKINK_URL}?ref=${user.id.slice(0, 8)}`
    : WORKINK_URL;

  const userLootlabs = user?.id
    ? `${LOOTLABS_URL}?ref=${user.id.slice(0, 8)}`
    : LOOTLABS_URL;

  async function redeem() {
    if (!code.trim()) {
      setStatus('Enter your unlock token.');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const res = await fetch('/api/plus/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: code.trim(),
          uid: user?.id,
          source: 'workink',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setUnlocked(true);
        setStatus('Talmor Plus unlocked!');
      } else {
        setStatus(data.error || 'Token invalid or expired');
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #7A9E7E 0%, transparent 70%)', animation: 'float 8s ease-in-out infinite' }}
        />
      </div>

      <header className="site-nav sticky top-0 z-40 relative">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3 font-semibold text-white">
            <Image src="/logo.svg" alt="Talmor" width={28} height={28} />
            <span>Talmor</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-white transition-colors">Dashboard</Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-5 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A9E7E]">Talmor Plus</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Premium unlock</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Complete a short Work.ink or LootLabs offer, then redeem the code here.
          Your code is automatically linked to your account.
        </p>

        {unlocked ? (
          <div className="mt-8 rounded-xl border border-[#7A9E7E]/30 bg-[#7A9E7E]/10 p-5 text-sm text-[#7A9E7E]">
            Talmor Plus is unlocked{user?.email ? ` for ${user.email}` : ''}. Premium downloads are available in the dashboard.
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <a
                href={user ? userWorkspace : '/login'}
                target={user ? '_blank' : undefined}
                rel={user ? 'noreferrer' : undefined}
                className="btn-primary flex items-center justify-center px-4 py-3 text-sm"
              >
                {user ? 'Unlock via Work.ink' : 'Sign in to unlock'}
              </a>
              <a
                href={user ? userLootlabs : '/login'}
                target={user ? '_blank' : undefined}
                rel={user ? 'noreferrer' : undefined}
                className="btn-ghost flex items-center justify-center px-4 py-3 text-sm"
              >
                {user ? 'Unlock via LootLabs' : 'Sign in to unlock'}
              </a>
            </div>

            <div className="mt-8 rounded-xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-xl p-5">
              <h2 className="text-sm font-semibold text-white">Redeem token</h2>
              <p className="mt-1 text-xs text-zinc-500">
                {user
                  ? 'Paste the token you received on Work.ink after completing the offer.'
                  : 'Sign in first, then redeem the token on this account.'}
              </p>
              {user ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste your Work.ink token"
                    className="flex-1 rounded-lg border border-zinc-900 bg-black px-3 py-2.5 font-mono text-sm outline-none focus:border-[#7A9E7E] text-white placeholder-zinc-600"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={redeem}
                    className="btn-primary px-4 py-2.5 text-sm disabled:opacity-50"
                  >
                    {busy ? 'Redeeming...' : 'Redeem'}
                  </button>
                </div>
              ) : (
                <Link href="/login" className="btn-primary mt-4 inline-flex px-4 py-2 text-sm">
                  Sign in to redeem
                </Link>
              )}
              {status && <p className="mt-3 text-sm text-zinc-300">{status}</p>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
