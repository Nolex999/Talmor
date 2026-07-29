'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

const WORKINK_URL = process.env.NEXT_PUBLIC_WORKINK_URL || 'https://work.ink/your-talmor-raknet-link';
const LOOTLABS_URL = process.env.NEXT_PUBLIC_LOOTLABS_URL || 'https://lootlabs.gg/your-talmor-raknet-link';

export default function RakNetPage() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('raknet_unlocked')
        .eq('id', user.id)
        .maybeSingle();
      setUnlocked(!!data?.raknet_unlocked);
    })();
  }, [supabase]);

  async function redeem() {
    if (!code.trim()) {
      setStatus('Enter the unlock code from Work.ink or LootLabs.');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const { data, error } = await supabase.rpc('redeem_raknet_code', {
        p_code: code.trim().toUpperCase(),
      });
      if (error) {
        setStatus(error.message);
      } else if (data?.ok || data?.valid || data === true) {
        setUnlocked(true);
        setStatus('RakNet unlocked on your account. Enable it in the Talmor app settings.');
      } else if (typeof data === 'object' && data !== null && 'error' in data) {
        setStatus(String((data as { error?: string }).error || 'Redeem failed'));
      } else {
        setStatus('Code redeemed.');
        setUnlocked(true);
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Redeem failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <header className="site-nav sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <Image src="/logo.png" alt="Talmor" width={28} height={28} className="rounded" />
            Talmor
          </Link>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">Dashboard</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Optional unlock</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">RakNet networking</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Talmor core stays free. RakNet is an optional networking layer for advanced use.
          Complete a short Work.ink or LootLabs wall, then redeem the code here.
          The desktop app only enables RakNet when your account is unlocked.
        </p>

        {unlocked ? (
          <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-300">
            RakNet is unlocked{email ? ` for ${email}` : ''}. Open Talmor → Settings → enable RakNet Hooks.
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <a
                href={WORKINK_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-primary flex items-center justify-center px-4 py-3 text-sm"
              >
                Unlock via Work.ink
              </a>
              <a
                href={LOOTLABS_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost flex items-center justify-center px-4 py-3 text-sm"
              >
                Unlock via LootLabs
              </a>
            </div>

            <div className="mt-8 rounded-xl border border-zinc-800 bg-[#111113] p-5">
              <h2 className="text-sm font-semibold text-white">Redeem code</h2>
              <p className="mt-1 text-xs text-zinc-500">
                {email
                  ? 'Paste the code you received after completing the offers.'
                  : 'Sign in first, then redeem the code on this account.'}
              </p>
              {email ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="RAKNET-XXXX-XXXX"
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 font-mono text-sm outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={redeem}
                    className="btn-primary px-4 py-2.5 text-sm disabled:opacity-50"
                  >
                    {busy ? 'Redeeming…' : 'Redeem'}
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
