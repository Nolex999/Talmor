'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import SiteBackdrop from '@/components/SiteBackdrop';

const WORKINK_URL = process.env.NEXT_PUBLIC_WORKINK_URL || 'https://work.ink/2Na9/talmor-executor';
const LOOTLABS_URL = process.env.NEXT_PUBLIC_LOOTLABS_URL || 'https://lootlabs.gg/talmor-plus';
const DOWNLOAD_URL = process.env.NEXT_PUBLIC_DOWNLOAD_URL || '';

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

  const workinkHref = user?.id
    ? `${WORKINK_URL}?ref=${user.id.slice(0, 8)}`
    : '/login?next=/account#plus';
  const lootlabsHref = user?.id
    ? `${LOOTLABS_URL}?ref=${user.id.slice(0, 8)}`
    : '/login?next=/account#plus';

  const downloadHref = user
    ? (DOWNLOAD_URL || '/account#download')
    : '/login?next=/account#download';

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative overflow-hidden">
      <SiteBackdrop />

      <header className="site-nav sticky top-0 z-50 relative">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-white">
            <Image src="/logo.svg" alt="Talmor" width={36} height={36} className="rounded" />
            <span className="text-lg">Talmor</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-zinc-500 sm:flex">
            <Link href="/#download" className="hover:text-white transition-colors">Download</Link>
            <Link href="/#plus" className="hover:text-white transition-colors">Talmor Plus</Link>
            <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
          </nav>
          <div className="flex items-center gap-2">
            {loading ? null : user ? (
              <Link
                href="/account"
                className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 pl-1.5 pr-3 py-1.5 text-sm hover:border-zinc-700 transition-colors"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7A9E7E]/20 text-xs font-semibold text-[#7A9E7E]">
                  {(user.email?.[0] || '?').toUpperCase()}
                </span>
                <span className="max-w-[140px] truncate text-xs text-zinc-300 hidden sm:block">
                  {user.email}
                </span>
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
        <section className="mx-auto max-w-6xl px-5 pb-24 pt-20 text-center sm:pt-28">
          <div className="mb-10 flex justify-center">
            <Image src="/logo.svg" alt="Talmor" width={160} height={160} className="opacity-90 drop-shadow-[0_0_40px_rgba(122,158,126,0.25)]" priority />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#7A9E7E]/25 bg-[#7A9E7E]/10 px-4 py-1.5 text-xs text-[#7A9E7E] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7A9E7E] animate-pulse" />
            Free forever &mdash; account required
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-7xl">
            Luau scripting.
            <br />
            <span className="text-[#7A9E7E]">Clean. Fast. Free.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-zinc-500 sm:text-lg">
            Talmor is a lightweight desktop executor built for speed and a minimal workflow.
            Create a free account, download, and go. No activation keys.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {loading ? (
              <div className="h-12 w-44 rounded-lg bg-zinc-900 animate-pulse" />
            ) : (
              <a
                href={downloadHref}
                {...(user && DOWNLOAD_URL ? { download: true } : {})}
                className="btn-white px-8 py-3 text-sm font-semibold shadow-lg shadow-white/10"
              >
                {user ? 'Download free' : 'Sign in to download'}
              </a>
            )}
            <a href="#plus" className="btn-ghost px-8 py-3 text-sm">
              Explore Talmor Plus
            </a>
          </div>
        </section>

        <section id="features" className="border-t border-zinc-900/80 py-24">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#7A9E7E]">Features</p>
            <h2 className="mt-3 text-center text-3xl font-semibold text-white">Everything you need</h2>
            <div className="mt-14 grid gap-5 sm:grid-cols-3">
              {[
                {
                  href: '/#download',
                  title: 'Minimal editor',
                  body: 'Line numbers, Luau syntax highlighting, IntelliSense. Built for writing scripts, not decorating windows.',
                  icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
                },
                {
                  href: '/#download',
                  title: 'Free core',
                  body: 'Attach, execute, workspace, AutoExec, multi-instance — every core feature, zero cost, always.',
                  icon: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
                },
                {
                  href: '/#plus',
                  title: 'Talmor Plus',
                  body: 'Unlock premium download options via Work.ink or LootLabs. One-time, no recurring payment.',
                  icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                },
              ].map((f) => (
                <Link
                  key={f.title}
                  href={f.href}
                  className="group rounded-xl border border-zinc-900 bg-black/30 p-6 transition-all hover:border-[#7A9E7E]/35 hover:bg-[#7A9E7E]/5"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#7A9E7E]/10 group-hover:bg-[#7A9E7E]/15 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A9E7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={f.icon} />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-white group-hover:text-[#7A9E7E] transition-colors">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{f.body}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="plus" className="border-t border-zinc-900/80 py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A9E7E]">Premium</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Talmor Plus</h2>
              <p className="mt-3 text-sm text-zinc-500">
                Complete a quick offer through a partner, then unlock premium options.
                Free download always needs only an account — no keys.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 max-w-2xl mx-auto">
              <a
                href={workinkHref}
                target={user ? '_blank' : undefined}
                rel={user ? 'noreferrer' : undefined}
                className="group relative overflow-hidden rounded-xl border border-zinc-900 bg-black/30 p-6 text-left transition-all hover:border-[#7A9E7E]/40 hover:bg-[#7A9E7E]/5"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#7A9E7E]/5 blur-xl transition-all group-hover:bg-[#7A9E7E]/15" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7A9E7E]">Partner</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Work.ink</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Complete a quick offer on Work.ink to unlock Talmor Plus.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#7A9E7E]">
                  {user ? 'Open Work.ink \u2192' : 'Sign in to unlock \u2192'}
                </span>
              </a>

              <a
                href={lootlabsHref}
                target={user ? '_blank' : undefined}
                rel={user ? 'noreferrer' : undefined}
                className="group relative overflow-hidden rounded-xl border border-zinc-900 bg-black/30 p-6 text-left transition-all hover:border-[#7A9E7E]/40 hover:bg-[#7A9E7E]/5"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#7A9E7E]/5 blur-xl transition-all group-hover:bg-[#7A9E7E]/15" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7A9E7E]">Partner</p>
                <h3 className="mt-2 text-xl font-semibold text-white">LootLabs</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Complete a quick offer on LootLabs to unlock Talmor Plus.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#7A9E7E]">
                  {user ? 'Open LootLabs \u2192' : 'Sign in to unlock \u2192'}
                </span>
              </a>
            </div>
          </div>
        </section>

        <section id="download" className="border-t border-zinc-900/80 py-24">
          <div className="mx-auto max-w-6xl px-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A9E7E]">Get started</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Download Talmor</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-500">
              Self-contained Windows x64 installer. Sign in with your free account and download —
              no activation key required.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              {loading ? (
                <div className="h-12 w-48 rounded-lg bg-zinc-900 animate-pulse" />
              ) : user ? (
                <>
                  <a
                    href={DOWNLOAD_URL || '/account#download'}
                    className="btn-white px-8 py-3 text-sm font-semibold shadow-lg shadow-white/10"
                  >
                    Download free
                  </a>
                  <Link href="/account" className="btn-ghost px-8 py-3 text-sm">
                    Open account
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login?next=/account#download" className="btn-white px-8 py-3 text-sm font-semibold shadow-lg shadow-white/10">
                    Sign in to download
                  </Link>
                  <Link href="/login?tab=register&next=/account#download" className="btn-ghost px-8 py-3 text-sm">
                    Create free account
                  </Link>
                </>
              )}
            </div>
            {!user && !loading && (
              <p className="mt-6 text-xs text-zinc-600">
                Free download requires a Talmor account. No keys, no subscriptions.
              </p>
            )}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-zinc-900/80 py-10 text-center text-xs text-zinc-600">
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
