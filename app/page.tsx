'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import SiteBackdrop from '@/components/SiteBackdrop';

const DOWNLOAD_URL = process.env.NEXT_PUBLIC_DOWNLOAD_URL || '';
const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL || 'http://localhost:3001';

const TOUR = [
  {
    id: 'editor',
    title: 'An editor that gets out of the way.',
    body: 'Tabs, Luau highlighting, autocomplete, execute and clear — close enough to an IDE that you stop noticing the chrome.',
    tag: 'Editor',
  },
  {
    id: 'hub',
    title: 'A library. Built in.',
    body: 'Browse what\'s new, run scripts in one click, keep your workspace tidy. Script Hub lives inside Talmor.',
    tag: 'Script Hub',
  },
  {
    id: 'autoexec',
    title: 'AutoExec that sticks.',
    body: 'Queue scripts for every attach. Rename, import, delete — your startup flow stays under control.',
    tag: 'AutoExec',
  },
  {
    id: 'instances',
    title: 'Every instance. One place.',
    body: 'Attach, switch, and keep multi-instance sessions visible without alt-tab chaos.',
    tag: 'Instances',
  },
];

const WHY = [
  {
    title: 'Free core. Always.',
    body: 'Attach, execute, workspace, AutoExec, multi-instance — the real product stays free.',
  },
  {
    title: 'Built for speed.',
    body: 'Minimal UI, Monaco editor, self-contained Windows build. Open it, attach, run.',
  },
  {
    title: 'Plus when you want it.',
    body: 'Optional 24h key via Work.ink or LootLabs. No subscription. No pressure.',
  },
  {
    title: 'Support that answers.',
    body: 'Tickets on the site, Discord for the community. Ask, get unstuck, keep scripting.',
  },
];

export default function HomePage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tour, setTour] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    })();
  }, [supabase]);

  const plusHref = user?.id ? '/account#plus' : '/login?next=/account#plus';
  const downloadHref = user
    ? (DOWNLOAD_URL || '/account#download')
    : '/login?next=/account#download';

  return (
    <div className="min-h-screen text-[var(--fg)] relative overflow-hidden">
      <SiteBackdrop />

      <header className="site-nav sticky top-0 z-50 relative">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Talmor" width={34} height={34} className="opacity-95" priority />
            <span className="font-display text-[1.05rem] font-bold tracking-tight text-white">Talmor</span>
          </Link>

          <nav className="hidden items-center gap-7 text-[13px] text-[var(--muted)] md:flex">
            <a href="#tour" className="hover:text-white transition-colors">Tour</a>
            <a href="#why" className="hover:text-white transition-colors">Why Talmor</a>
            <a href="#plus" className="hover:text-white transition-colors">Plus</a>
            <a href="#download" className="hover:text-white transition-colors">Download</a>
            <a href={DOCS_URL} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Docs</a>
          </nav>

          <div className="flex items-center gap-2">
            {loading ? null : user ? (
              <Link
                href="/account"
                className="flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-white/[0.03] pl-1.5 pr-3 py-1.5 text-sm hover:border-[var(--accent)]/40 transition-colors"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent-bright)]">
                  {(user.email?.[0] || '?').toUpperCase()}
                </span>
                <span className="max-w-[140px] truncate text-xs text-zinc-300 hidden sm:block">
                  {user.email}
                </span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost px-3.5 py-1.5 text-sm hidden sm:inline-flex">Sign in</Link>
                <Link href="/login?tab=register" className="btn-primary px-4 py-1.5 text-sm">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero — brand first, Real-style */}
        <section className="relative min-h-[calc(100svh-4.25rem)] flex items-center">
          <div className="mx-auto w-full max-w-6xl px-5 pt-16 pb-20 sm:pt-20 sm:pb-28">
            <div className="animate-rise flex flex-col items-center text-center">
              <Image
                src="/logo.png"
                alt=""
                width={88}
                height={88}
                className="mb-8 opacity-95 drop-shadow-[0_20px_60px_rgba(122,158,126,0.28)]"
                priority
              />
              <h1 className="font-display text-[clamp(4.2rem,14vw,8.5rem)] font-extrabold leading-[0.88] tracking-[-0.04em] text-white">
                Talmor
              </h1>
              <p className="mt-6 max-w-xl text-base text-[var(--muted)] sm:text-lg">
                A Luau executor for Roblox. Fast, free, built to stay out of your way.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                {loading ? (
                  <div className="h-12 w-44 rounded-full bg-white/5 animate-pulse" />
                ) : (
                  <a href={downloadHref} className="btn-white px-7 py-3 text-sm">
                    {user ? 'Download for Windows' : 'Sign in to download'}
                  </a>
                )}
                <a href={plusHref} className="btn-ghost px-7 py-3 text-sm">
                  Get a free Plus key
                </a>
              </div>
              <p className="mt-6 text-xs text-zinc-600">
                Using Talmor means you agree to the{' '}
                <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-400">Terms</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* Compatibility strip */}
        <section className="section-rule py-14">
          <div className="mx-auto max-w-6xl px-5 grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
            <div className="animate-fade-in">
              <p className="mono-label">Free forever</p>
              <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Core access without a paywall.
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted)]">
                Create an account, download, sign in on desktop. Plus is optional — a 24-hour key if you want the extras.
              </p>
            </div>
            <div className="panel p-6 animate-fade-in" style={{ animationDelay: '80ms' }}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-[var(--muted)]">Windows</span>
                <span className="font-display text-2xl font-bold text-white">x64</span>
              </div>
              <div className="mt-4 h-px bg-[var(--border)]" />
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <span className="text-sm text-[var(--muted)]">Plus key</span>
                <span className="font-display text-2xl font-bold text-[var(--accent-bright)]">24h</span>
              </div>
              <div className="mt-4 h-px bg-[var(--border)]" />
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <span className="text-sm text-[var(--muted)]">Editor</span>
                <span className="font-display text-2xl font-bold text-white">Monaco</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tour */}
        <section id="tour" className="section-rule py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="max-w-2xl">
              <p className="mono-label">Tour</p>
              <h2 className="font-display mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Meet every surface.
              </h2>
              <p className="mt-4 text-[var(--muted)]">
                A guided look at the parts you&apos;ll actually use — inspired by how Real walks the product, kept Talmor-simple.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="flex flex-col gap-2">
                {TOUR.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTour(i)}
                    className={`text-left rounded-2xl border px-5 py-4 transition-all ${
                      tour === i
                        ? 'border-[var(--accent)]/45 bg-[var(--accent-soft)]'
                        : 'border-transparent hover:border-[var(--border-strong)] hover:bg-white/[0.02]'
                    }`}
                  >
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--accent-bright)]">{item.tag}</p>
                    <p className="mt-1.5 font-display text-lg font-semibold text-white">{item.title}</p>
                  </button>
                ))}
              </div>

              <div className="panel relative overflow-hidden min-h-[320px] p-8 sm:p-10 animate-fade-in" key={TOUR[tour].id}>
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl"
                  style={{ background: 'radial-gradient(circle, rgba(122,158,126,0.35), transparent 70%)' }}
                />
                <p className="mono-label relative">{TOUR[tour].tag}</p>
                <h3 className="font-display relative mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {TOUR[tour].title}
                </h3>
                <p className="relative mt-5 max-w-md text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                  {TOUR[tour].body}
                </p>
                <div className="relative mt-10 rounded-xl border border-[var(--border)] bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-zinc-400">
                  <div className="mb-3 flex items-center gap-2 text-zinc-600">
                    <span className="h-2 w-2 rounded-full bg-[#7A9E7E]/80" />
                    <span>workspace · {TOUR[tour].id}.luau</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-[var(--accent-bright)]/90">{`print("talmor ready")
-- ${TOUR[tour].tag.toLowerCase()} flow`}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why */}
        <section id="why" className="section-rule py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="max-w-2xl">
              <p className="mono-label">Why Talmor</p>
              <h2 className="font-display mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Why you&apos;ll open it again.
              </h2>
            </div>
            <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2">
              {WHY.map((item) => (
                <div key={item.title}>
                  <h3 className="font-display text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-12">
              <a href={plusHref} className="btn-primary inline-flex px-6 py-3 text-sm">
                Get a free Plus key
              </a>
            </div>
          </div>
        </section>

        {/* Plus */}
        <section id="plus" className="section-rule py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mono-label justify-center">Talmor Plus</p>
              <h2 className="font-display mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Free key. Twenty-four hours.
              </h2>
              <p className="mt-4 text-sm text-[var(--muted)] sm:text-base">
                Complete a partner offer, get an activation key, paste it in the desktop app.
                Same idea as daily free keys elsewhere — kept simple.
              </p>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
              <a href={plusHref} className="panel group p-7 text-left transition-colors hover:border-[var(--accent)]/40">
                <p className="mono-label">Partner</p>
                <h3 className="font-display mt-3 text-2xl font-bold text-white">Work.ink</h3>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Finish an offer, land on verify, copy your 24h key.
                </p>
                <span className="mt-6 inline-flex text-sm font-semibold text-[var(--accent-bright)] group-hover:translate-x-0.5 transition-transform">
                  Continue →
                </span>
              </a>
              <a href={plusHref} className="panel group p-7 text-left transition-colors hover:border-[var(--accent)]/40">
                <p className="mono-label">Partner</p>
                <h3 className="font-display mt-3 text-2xl font-bold text-white">LootLabs</h3>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Complete tasks, return to account, unlock Plus for a day.
                </p>
                <span className="mt-6 inline-flex text-sm font-semibold text-[var(--accent-bright)] group-hover:translate-x-0.5 transition-transform">
                  Continue →
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* Download */}
        <section id="download" className="section-rule py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="panel overflow-hidden relative px-8 py-14 sm:px-14 sm:py-16 text-center">
              <div
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background:
                    'radial-gradient(700px 280px at 50% 0%, rgba(122,158,126,0.18), transparent 70%)',
                }}
              />
              <div className="relative">
                <p className="mono-label">Download</p>
                <h2 className="font-display mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Get Talmor on Windows.
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-sm text-[var(--muted)]">
                  Self-contained x64 build. Account required. Open on desktop to download.
                </p>
                <div className="mt-10 flex flex-wrap justify-center gap-3">
                  {loading ? (
                    <div className="h-12 w-48 rounded-full bg-white/5 animate-pulse" />
                  ) : user ? (
                    <>
                      <a href={DOWNLOAD_URL || '/account#download'} className="btn-white px-8 py-3 text-sm">
                        Download for Windows
                      </a>
                      <Link href="/account" className="btn-ghost px-8 py-3 text-sm">
                        Open account
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/login?next=/account#download" className="btn-white px-8 py-3 text-sm">
                        Sign in to download
                      </Link>
                      <Link href="/login?tab=register&next=/account#download" className="btn-ghost px-8 py-3 text-sm">
                        Create account
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Community / docs */}
        <section className="section-rule py-20">
          <div className="mx-auto max-w-6xl px-5 grid gap-6 sm:grid-cols-2">
            <a href={DOCS_URL} target="_blank" rel="noreferrer" className="panel p-8 hover:border-[var(--accent)]/35 transition-colors">
              <p className="mono-label">Documentation</p>
              <h3 className="font-display mt-3 text-2xl font-bold text-white">Read the docs.</h3>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Luau API reference — globals, loaders, limits.
              </p>
            </a>
            <Link href="/support" className="panel p-8 hover:border-[var(--accent)]/35 transition-colors">
              <p className="mono-label">Support</p>
              <h3 className="font-display mt-3 text-2xl font-bold text-white">Need help?</h3>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Open a ticket. We&apos;ll get you unstuck.
              </p>
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 section-rule py-12">
        <div className="mx-auto max-w-6xl px-5 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="" width={28} height={28} />
              <span className="font-display font-bold text-white">Talmor</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-[var(--muted)]">
              A fast Luau executor for Roblox. Free core, optional Plus, built to last.
            </p>
            <p className="mt-6 text-xs text-zinc-600">&copy; {new Date().getFullYear()} Talmor</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Product</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-[var(--muted)]">
              <a href="#tour" className="hover:text-white">Tour</a>
              <a href="#download" className="hover:text-white">Download</a>
              <a href="#plus" className="hover:text-white">Plus</a>
              <a href={DOCS_URL} target="_blank" rel="noreferrer" className="hover:text-white">Docs</a>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Legal</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-[var(--muted)]">
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/support" className="hover:text-white">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
