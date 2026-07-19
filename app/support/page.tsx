'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const CATEGORIES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'billing', label: 'Billing' },
  { value: 'account', label: 'Account Issue' },
  { value: 'other', label: 'Other' },
];

export default function SupportPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function getUser() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        router.replace('/');
        return;
      }
      setUser(u);
      setLoading(false);
    }
    getUser();
  }, [supabase, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setStatus('sending');
    setErrorMsg('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg('Session expired. Please log in again.');
        setStatus('error');
        return;
      }

      const res = await fetch('/api/ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ category, subject, message }),
      });

      if (res.ok) {
        setStatus('sent');
        setSubject('');
        setMessage('');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to submit ticket.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white bg-grid flex items-center justify-center">
        <div className="relative w-20 h-20 animate-logo-pulse">
          <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-logo-spin" style={{ borderTopColor: 'rgba(255,255,255,0.4)' }} />
          <div className="absolute inset-2 flex items-center justify-center">
            <img src="/logo.svg" alt="Talmor" className="w-12 h-12 object-contain opacity-80" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white bg-grid flex items-center justify-center px-6 py-16 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[150px] animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-white/[0.02] rounded-full blur-[150px] animate-float"
          style={{ animationDelay: '3s' }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-between mb-6">
          <img src="/logo.svg" alt="Talmor" className="w-8 h-8 object-contain" />
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-zinc-500">{user?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[11px] text-zinc-400 hover:text-white transition-colors"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="gradient-border">
          <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-8 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="font-display text-xl font-bold mb-1.5 text-white tracking-tight">
                Support
              </h1>
              <p className="text-zinc-500 text-xs">
                Submit a ticket and our team will get back to you.
              </p>
            </div>

            {status === 'sent' ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="font-display text-lg font-semibold text-white mb-1">Ticket Sent</h2>
                <p className="text-zinc-500 text-xs mb-6">We&apos;ll get back to you as soon as possible.</p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="text-xs text-zinc-400 hover:text-white transition-colors underline underline-offset-2"
                >
                  Send another ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="category" className="block text-[11px] font-medium text-zinc-400 mb-1.5 tracking-wide">
                    CATEGORY
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm text-white appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value} className="bg-[#111] text-white">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-[11px] font-medium text-zinc-400 mb-1.5 tracking-wide">
                    SUBJECT
                  </label>
                  <input
                    id="subject"
                    type="text"
                    required
                    maxLength={200}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm text-white placeholder-zinc-600"
                    placeholder="Brief description of your issue"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-[11px] font-medium text-zinc-400 mb-1.5 tracking-wide">
                    MESSAGE
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    maxLength={2000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm text-white placeholder-zinc-600 resize-none"
                    placeholder="Describe your issue in detail..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full py-3 bg-white text-black rounded-lg font-semibold text-xs tracking-wider transition-all hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === 'sending' ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                      SENDING
                    </>
                  ) : (
                    'SUBMIT TICKET'
                  )}
                </button>

                {status === 'error' && errorMsg && (
                  <p className="text-center text-xs text-red-400 mt-2">
                    {errorMsg}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-600 mt-6">
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
            &larr; Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
