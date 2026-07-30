'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const WORKINK_URL = process.env.NEXT_PUBLIC_WORKINK_URL || 'https://work.ink/talmor-plus';
const LOOTLABS_URL = process.env.NEXT_PUBLIC_LOOTLABS_URL || 'https://lootlabs.gg/talmor-plus';

export default function HomePage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    })();
  }, [supabase]);

  const userWorkspace = user?.id
    ? `${WORKINK_URL}?ref=${user.id.slice(0, 8)}`
    : WORKINK_URL;

  const userLootlabs = user?.id
    ? `${LOOTLABS_URL}?ref=${user.id.slice(0, 8)}`
    : LOOTLABS_URL;

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative overflow-hidden">

      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #7A9E7E 0%, transparent 70%)', animation: 'float 8s ease-in-out infinite' }}
        />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #7A9E7E 0%, transparent 70%)', animation: 'float 10s ease-in-out infinite 2s' }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-[0.02]"
          style={{ background: 'radial-gradient(ellipse, #7A9E7E 0%, transparent 70%)', animation: 'pulse-glow 6s ease-in-out infinite' }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(122,158,126,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(122,158,126,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Nav */}
      <header className="site-nav sticky top-0 z-50 relative">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7A9E7E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Talmor
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-zinc-500 sm:flex">
            <Link href="/#download" className="hover:text-white transition-colors">Download</Link>
            <Link href="/#plus" className="hover:text-white transition-colors">Talmor Plus</Link>
            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
          </nav>
          <div className="flex items-center gap-2">
            {loading ? null : user ? (
              <Link href="/dashboard" className="btn-primary px-3 py-1.5 text-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost px-3 py-1.5 text-sm">Sign in</Link>
                <Link href="/login?tab=register" className="btn-primary px-3 py-1.5 text-sm">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 pb-24 pt-24 text-center sm:pt-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#7A9E7E]/20 bg-[#7A9E7E]/5 px-4 py-1.5 text-xs text-[#7A9E7E] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7A9E7E] animate-pulse" />
            Free forever &mdash; no subscription
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-7xl">
            Luau scripting.
            <br />
            <span className="text-[#7A9E7E]">Clean. Fast. Free.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-zinc-500 sm:text-lg">
            Talmor is a lightweight desktop executor built for speed and a minimal workflow.
            No bloat, no subscriptions. Core is always free. Unlock Plus for premium downloads.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {loading ? (
              <div className="h-12 w-44 rounded-lg bg-zinc-900 animate-pulse" />
            ) : user ? (
              <Link href="/dashboard" className="btn-white px-8 py-3 text-sm font-semibold shadow-lg shadow-white/10">
                Download now
              </Link>
            ) : (
              <Link href="/login" className="btn-white px-8 py-3 text-sm font-semibold shadow-lg shadow-white/10">
                Download &mdash; Sign in first
              </Link>
            )}
            <a href="#plus" className="btn-ghost px-8 py-3 text-sm">
              Explore Talmor Plus
            </a>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-zinc-900 py-24">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#7A9E7E]">Features</p>
            <h2 className="mt-3 text-center text-3xl font-semibold text-white">Everything you need</h2>
            <div className="mt-14 grid gap-5 sm:grid-cols-3">
              {[
                {
                  title: 'Minimal editor',
                  body: 'Line numbers, Luau syntax highlighting, IntelliSense. Built for writing scripts, not decorating windows.',
                  icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
                },
                {
                  title: 'Free core',
                  body: 'Attach, execute, workspace, AutoExec, multi-instance — every core feature, zero cost, always.',
                  icon: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
                },
                {
                  title: 'Talmor Plus',
                  body: 'Unlock premium download options via Work.ink or LootLabs. One-time, no recurring payment.',
                  icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-zinc-900 bg-zinc-900/20 p-6 transition-colors hover:border-zinc-800"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#7A9E7E]/10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A9E7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={f.icon} />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Talmor Plus */}
        <section id="plus" className="border-t border-zinc-900 py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A9E7E]">Premium</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Talmor Plus</h2>
              <p className="mt-3 text-sm text-zinc-500">
                Complete a quick offer through one of our partners, then unlock premium download
                options. No subscription &mdash; one and done.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 max-w-2xl mx-auto">
              {/* Work.ink */}
              <a
                href={user ? userWorkspace : '/login'}
                className="group relative overflow-hidden rounded-xl border border-zinc-900 bg-zinc-900/20 p-6 text-left transition-all hover:border-[#7A9E7E]/30 hover:bg-[#7A9E7E]/5"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#7A9E7E]/5 blur-xl transition-all group-hover:bg-[#7A9E7E]/10" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7A9E7E]">Partner</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Work.ink</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Complete a quick offer on Work.ink, receive your unlock code, and redeem it for
                  Plus access.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#7A9E7E]">
                  {user ? 'Unlock via Work.ink →' : 'Sign in to unlock →'}
                </span>
              </a>

              {/* LootLabs */}
              <a
                href={user ? userLootlabs : '/login'}
                className="group relative overflow-hidden rounded-xl border border-zinc-900 bg-zinc-900/20 p-6 text-left transition-all hover:border-[#7A9E7E]/30 hover:bg-[#7A9E7E]/5"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#7A9E7E]/5 blur-xl transition-all group-hover:bg-[#7A9E7E]/10" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7A9E7E]">Partner</p>
                <h3 className="mt-2 text-xl font-semibold text-white">LootLabs</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Complete a quick offer on LootLabs, receive your unlock code, and redeem it for
                  Plus access.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#7A9E7E]">
                  {user ? 'Unlock via LootLabs →' : 'Sign in to unlock →'}
                </span>
              </a>
            </div>

            {!user && (
              <div className="mt-8 text-center">
                <Link href="/login" className="text-sm text-zinc-500 hover:text-white transition-colors">
                  Already have a code? Sign in to redeem &rarr;
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Download */}
        <section id="download" className="border-t border-zinc-900 py-24">
          <div className="mx-auto max-w-6xl px-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A9E7E]">Get started</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Download Talmor</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-500">
              Self-contained Windows x64 installer. Sign in, generate your activation key
              (valid 24h), enter it in the app, and you&apos;re ready.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {loading ? (
                <div className="h-12 w-48 rounded-lg bg-zinc-900 animate-pulse" />
              ) : user ? (
                <Link href="/dashboard" className="btn-white px-8 py-3 text-sm font-semibold shadow-lg shadow-white/10">
                  Open dashboard to download
                </Link>
              ) : (
                <>
                  <Link href="/login" className="btn-white px-8 py-3 text-sm font-semibold shadow-lg shadow-white/10">
                    Sign in to download
                  </Link>
                  <Link href="/login?tab=register" className="btn-ghost px-8 py-3 text-sm">
                    Create free account
                  </Link>
                </>
              )}
            </div>
            {!user && !loading && (
              <p className="mt-6 text-xs text-zinc-600">
                Free or Plus — login is required to download.
              </p>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 py-10 text-center text-xs text-zinc-600">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-5">
          <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
          <Link href="/support" className="hover:text-zinc-300 transition-colors">Support</Link>
          <Link href="/raknet" className="hover:text-zinc-300 transition-colors">RakNet</Link>
          <span>&copy; {new Date().getFullYear()} Talmor</span>
        </div>
      </footer>
    </div>
  );
}
