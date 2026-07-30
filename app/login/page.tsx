'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Suspense } from 'react';
import SiteBackdrop from '@/components/SiteBackdrop';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialTab = params.get('tab') === 'register' ? 'register' : 'login';
  const nextPath = params.get('next') || '/account';
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
        router.push(nextPath.startsWith('/') ? nextPath : '/account');
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/account`,
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
        setInfo('Account created. Confirm your email, then sign in.');
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
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col relative overflow-hidden">
      <SiteBackdrop />

      <header className="site-nav relative z-50">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3 font-semibold text-white">
            <Image src="/logo.svg" alt="Talmor" width={32} height={32} />
            <span className="text-base">Talmor</span>
          </Link>
          <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">&larr; Back</Link>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-md rounded-xl border border-zinc-900 bg-black/40 backdrop-blur-xl p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Free forever. Account required to download — no activation keys.
          </p>

          <div className="mt-6 flex gap-2 rounded-lg border border-zinc-900 bg-black p-1">
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setError(''); setInfo(''); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                  activeTab === tab ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {tab === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="text-zinc-500">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-zinc-900 bg-black px-3 py-2.5 text-sm outline-none focus:border-[#7A9E7E] text-white placeholder-zinc-600"
                placeholder="you@email.com"
              />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-500">Password</span>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-900 bg-black px-3 py-2.5 pr-16 text-sm outline-none focus:border-[#7A9E7E] text-white placeholder-zinc-600"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-600 hover:text-zinc-400"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {info && <p className="text-sm text-[#7A9E7E]">{info}</p>}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5 text-sm disabled:opacity-50">
              {isSubmitting ? 'Please wait...' : activeTab === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginForm />
    </Suspense>
  );
}
