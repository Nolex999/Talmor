'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (activeTab === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) {
          setError(authError.message === 'Invalid login credentials'
            ? 'Invalid email or password.'
            : authError.message);
          setIsSubmitting(false);
          return;
        }
        router.push('/dashboard');
      } else {
        if (!inviteCode.trim()) {
          setError('Invitation code is required.');
          setIsSubmitting(false);
          return;
        }

        const validateRes = await fetch('/api/invite/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: inviteCode }),
        });
        const validateData = await validateRes.json();
        if (!validateData.valid) {
          setError(validateData.error || 'Invalid invite code.');
          setIsSubmitting(false);
          return;
        }

        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { invite_code: inviteCode.trim().toUpperCase() },
          },
        });
        if (authError) {
          setError(authError.message === 'User already registered'
            ? 'An account with this email already exists.'
            : authError.message);
          setIsSubmitting(false);
          return;
        }

        setError('');
        alert('Account created. Confirm your email, then sign in to generate your desktop activation key.');
        setActiveTab('login');
        setIsSubmitting(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white bg-grid flex items-center justify-center px-6 py-16 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#2e7dff]/[0.10] rounded-full blur-[150px] animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#1e5fe0]/[0.07] rounded-full blur-[150px] animate-float"
          style={{ animationDelay: '3s' }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="gradient-border">
          <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-8 sm:p-10">
            <div className="flex justify-center mb-5">
              {isSubmitting ? (
                <div className="relative w-24 h-24">
                  <div className="liquid-logo">
                    <div className="liquid-wave" />
                  </div>
                </div>
              ) : (
                <img src="/logo.svg" alt="Talmor" className="w-24 h-24 object-contain" />
              )}
            </div>

            <div className="text-center mb-8">
              <h1 className="font-display text-2xl font-bold mb-1.5 text-white tracking-tight glow-text">
                Talmor
              </h1>
              <p className="text-zinc-500 text-xs">
                Sign in to your Talmor account to continue.
              </p>
            </div>

            <div className="relative flex mb-7 border-b border-white/10">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`flex-1 pb-3 text-xs font-semibold tracking-wider transition-colors ${
                  activeTab === 'login' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                LOGIN
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(''); }}
                className={`flex-1 pb-3 text-xs font-semibold tracking-wider transition-colors ${
                  activeTab === 'register' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                REGISTER
              </button>
              <span
                className="absolute bottom-0 h-[2px] w-1/2 bg-[#2e7dff] shadow-[0_0_12px_rgba(46,125,255,0.7)] transition-transform duration-300 ease-out"
                style={{ transform: activeTab === 'login' ? 'translateX(0%)' : 'translateX(100%)' }}
              />
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#2e7dff]/70 focus:bg-[#2e7dff]/[0.06] transition-all text-sm text-white placeholder-zinc-600"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-[11px] font-medium text-zinc-400 tracking-wide">
                    PASSWORD
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#2e7dff]/70 focus:bg-[#2e7dff]/[0.06] transition-all text-sm text-white placeholder-zinc-600"
                    placeholder="Min. 8 characters"
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

              {activeTab === 'register' && (
                <div>
                  <label htmlFor="invite" className="block text-[11px] font-medium text-zinc-400 mb-1.5 tracking-wide">
                    INVITATION CODE
                  </label>
                  <input
                    id="invite"
                    name="invite"
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#2e7dff]/70 focus:bg-[#2e7dff]/[0.06] transition-all text-sm text-white placeholder-zinc-600"
                    placeholder="Your invite code"
                  />
                  <p className="text-[10px] text-zinc-600 mt-2 leading-relaxed text-center">
                    Enter the invitation code provided to you.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-3 rounded-lg font-semibold text-xs tracking-wider disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
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
          Need help?{' '}
          <a href="/support" className="text-zinc-400 hover:text-white transition-colors">
            Contact support
          </a>
        </p>

        <p className="text-center text-[10px] text-zinc-700 mt-3">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
