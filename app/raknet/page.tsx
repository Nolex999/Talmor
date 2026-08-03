'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export default function RakNetPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [key, setKey] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [active, setActive] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('license_key, key_expires_at')
        .eq('id', user.id)
        .maybeSingle();
      if (
        data?.license_key &&
        data.key_expires_at &&
        new Date(data.key_expires_at).getTime() > Date.now()
      ) {
        setActive(true);
        setKey(data.license_key);
        setExpiresAt(data.key_expires_at);
      }
    })();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-900">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Talmor" width={28} height={28} />
            <span className="text-sm font-semibold">Talmor</span>
          </Link>
          <Link href="/account#plus" className="text-xs text-zinc-500 hover:text-white">
            Account
          </Link>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Talmor Plus</h1>
        <p className="text-sm text-zinc-500 mb-8">
          Unlock a 24-hour activation key via Work.ink or LootLabs from your account.
        </p>

        {active ? (
          <div className="rounded-2xl border border-[#7A9E7E]/20 bg-[#7A9E7E]/5 p-6 text-left">
            <p className="text-[#7A9E7E] font-semibold text-center mb-4">Plus active</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Activation key</p>
            <p className="font-mono text-base text-white tracking-wider break-all select-all">{key}</p>
            <p className="text-xs text-zinc-500 mt-2">
              Expires {expiresAt ? new Date(expiresAt).toLocaleString() : '—'}
            </p>
          </div>
        ) : (
          <Link href={user ? '/account#plus' : '/login?next=/account#plus'} className="btn-primary inline-flex px-6 py-3 text-sm">
            {user ? 'Unlock on account' : 'Sign in to unlock'}
          </Link>
        )}
      </div>
    </div>
  );
}
