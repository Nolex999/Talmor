'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialTab = params.get('tab') === 'register' ? 'register' : 'login';
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setInfo('');

    try {
      if (activeTab === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) {
          setError(authError.message === 'Invalid login credentials'
            ? 'Invalid email or password.'
            : authError.message);
          setIsSubmitting(false);
          return;
        }
        router.push('/dashboard');
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { username: email.split('@')[0] },
          },
        });
        if (authError) {
          setError(authError.message === 'User already registered'
            ? 'An account with this email already exists.'
            : authError.message);
          setIsSubmitting(false);
          return;
        }
        setInfo('Account created. Confirm your email, then sign in. Talmor core is free.');
        setActiveTab('login');
        setIsSubmitting(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  }

  const title = useMemo(
    () => (activeTab === 'login' ? 'Sign in' : 'Create free account'),
    [activeTab],
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col">
      <header className="site-nav">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <Image src="/logo.png" alt="Talmor" width={28} height={28} className="rounded" />
            Talmor
          </Link>
          <Link href="/" className="text-sm text-zinc-400 hover:text-white">← Back</Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#111113] p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Free forever. RakNet unlock is optional via Work.ink / LootLabs.
          </p>

          <div className="mt-6 flex gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setError(''); setInfo(''); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                  activeTab === tab ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="text-zinc-400">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                placeholder="you@email.com"
              />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-400">Password</span>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 pr-16 text-sm outline-none focus:border-blue-500"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {info && <p className="text-sm text-emerald-400">{info}</p>}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5 text-sm disabled:opacity-50">
              {isSubmitting ? 'Please wait…' : activeTab === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <LoginForm />
    </Suspense>
  );
}
