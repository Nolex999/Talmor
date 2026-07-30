'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';

function VerifyContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const uid = params.get('uid');
  const source = params.get('source') || 'work.ink';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || !uid) {
      setStatus('error');
      setMessage('Missing verification parameters.');
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/plus/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, uid, source }),
        });
        const data = await res.json();
        if (data.ok) {
          setStatus('success');
          setMessage('Talmor Plus unlocked successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      } catch {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    })();
  }, [token, uid, source]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-5">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] opacity-[0.03]"
          style={{ background: 'radial-gradient(ellipse, #7A9E7E 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 text-center max-w-md">
        <Image src="/logo.svg" alt="Talmor" width={64} height={64} className="mx-auto mb-6 opacity-90" />

        {status === 'loading' && (
          <div>
            <div className="h-10 w-10 rounded-full border-2 border-[#7A9E7E] border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">Verifying your unlock...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-16 h-16 rounded-full bg-[#7A9E7E]/10 mx-auto mb-4 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7A9E7E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Talmor Plus</h1>
            <p className="text-[#7A9E7E] font-semibold mb-6">{message}</p>
            <Link href="/account" className="btn-primary inline-flex px-6 py-3 text-sm">
              Go to Account
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verification failed</h1>
            <p className="text-zinc-400 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Link href="/account" className="btn-ghost px-5 py-2.5 text-sm">Account</Link>
              <Link href="/raknet" className="btn-primary px-5 py-2.5 text-sm">Try again</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[#7A9E7E] border-t-transparent animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
