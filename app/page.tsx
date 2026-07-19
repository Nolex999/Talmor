'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signIn, signUp } from '../lib/supabase';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget as HTMLFormElement);
    const email = String(form.get('email') || '');
    const password = String(form.get('password') || '');

    try {
      if (activeTab === 'login') {
        await signIn(email, password);
      } else {
        const username = String(form.get('username') || '');
        await signUp(email, password, username);
      }
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      if (msg.includes('Invalid login')) setError('Invalid email or password');
      else if (msg.includes('already')) setError('An account with this email already exists');
      else setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white bg-grid flex items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-[128px] animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[128px] animate-float"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Status pill */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-[10px] tracking-[0.2em] text-zinc-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-pulse-glow absolute inline-flex h-full w-full rounded-full bg-white" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
            </span>
            SYSTEM ONLINE
          </div>
        </div>

        <div className="gradient-border">
          <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-8 sm:p-10">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative w-14 h-14">
                <Image 
                  src="/logo.png" 
                  alt="TALMOR" 
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="font-display text-2xl font-bold mb-1.5 text-white tracking-tight glow-text">
                TALMOR
              </h1>
              <p className="text-zinc-500 text-xs tracking-[0.15em]">
                ACCESS YOUR SECURE SPACE
              </p>
            </div>

            {/* Tabs */}
            <div className="relative flex mb-7 border-b border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex-1 pb-3 text-xs font-semibold tracking-wider transition-colors ${
                  activeTab === 'login' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                LOGIN
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 pb-3 text-xs font-semibold tracking-wider transition-colors ${
                  activeTab === 'register' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                REGISTER
              </button>
              <span
                className="absolute bottom-0 h-[2px] w-1/2 bg-white transition-transform duration-300 ease-out"
                style={{ transform: activeTab === 'login' ? 'translateX(0%)' : 'translateX(100%)' }}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {activeTab === 'register' && (
                <div>
                  <label htmlFor="username" className="block text-[11px] font-medium text-zinc-400 mb-1.5 tracking-wide">
                    USERNAME
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm text-white placeholder-zinc-600"
                    placeholder="your_username"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-[11px] font-medium text-zinc-400 mb-1.5 tracking-wide">
                  EMAIL
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm text-white placeholder-zinc-600"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[11px] font-medium text-zinc-400 mb-1.5 tracking-wide">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                    className="w-full px-4 py-3 pr-11 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm text-white placeholder-zinc-600"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5.5 0-9.5-4-11-8 .82-2.1 2.3-4.2 4.2-5.7M9.9 5.09A10.94 10.94 0 0 1 12 5c5.5 0 9.5 4 11 8-.6 1.5-1.5 2.9-2.7 4.06M14.12 14.12a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M1 1l22 22" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-[11px] text-red-400 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-white text-black rounded-lg font-semibold text-xs tracking-wider transition-all hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    {activeTab === 'login' ? 'LOGGING IN' : 'CREATING ACCOUNT'}
                  </>
                ) : activeTab === 'login' ? (
                  'LOG IN'
                ) : (
                  'CREATE ACCOUNT'
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-600 mt-6">
          Need help? <a href="#" className="text-zinc-400 hover:text-white transition-colors">Contact support</a>
        </p>
      </div>
    </div>
  );
}
