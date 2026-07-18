'use client';

import { useState } from 'react';
import Link from 'next/link';

const activity = [
  { time: '12:04:01', label: 'session started', tone: 'ok' as const },
  { time: '12:04:01', label: 'license key verified', tone: 'ok' as const },
  { time: '11:58:22', label: 'device fingerprint matched', tone: 'ok' as const },
  { time: '09:12:47', label: 'password changed', tone: 'warn' as const },
  { time: 'yesterday', label: 'login from new device — Paris, FR', tone: 'warn' as const },
];

const changelog = [
  { version: 'v2.4.1', date: 'Jul 14', note: 'Stability fixes, faster startup' },
  { version: 'v2.4.0', date: 'Jun 29', note: 'New workspace layout' },
  { version: 'v2.3.2', date: 'Jun 02', note: 'Minor bug fixes' },
];

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="gradient-border">
      <div className="rounded-2xl bg-black/40 p-5">
        <p className="text-[11px] tracking-wider text-zinc-500 mb-2">{label}</p>
        <p className="font-display text-xl font-semibold text-white">{value}</p>
        {sub && <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const licenseKey = 'TLMR-8F2A-91DC-4B7E';

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div className="min-h-screen bg-black text-white bg-grid relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-white/5 rounded-full blur-[140px]" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-white/15 bg-white/[0.03] flex items-center justify-center">
              <span className="font-display text-sm font-bold">T</span>
            </div>
            <span className="font-display text-sm font-semibold tracking-wide">TALMOR</span>
          </div>

          <nav className="hidden sm:flex items-center gap-6 text-xs text-zinc-400">
            <a href="#overview" className="hover:text-white transition-colors">Overview</a>
            <a href="#license" className="hover:text-white transition-colors">License</a>
            <a href="#downloads" className="hover:text-white transition-colors">Downloads</a>
            <a href="#activity" className="hover:text-white transition-colors">Activity</a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 text-[10px] tracking-wider text-zinc-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-pulse-glow absolute inline-flex h-full w-full rounded-full bg-white" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
              </span>
              ONLINE
            </div>
            <Link
              href="/"
              className="text-[11px] px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-colors"
            >
              Log out
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-10">
        <section id="overview">
          <h1 className="font-display text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-zinc-500 text-sm mb-6">Last login today at 12:04 from Paris, FR</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="LICENSE" value="Active" sub="Renews Sep 12" />
            <StatCard label="DEVICES" value="2 / 3" sub="1 slot available" />
            <StatCard label="VERSION" value="v2.4.1" sub="Up to date" />
            <StatCard label="PLAN" value="Individual" sub="Upgrade available" />
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            <div id="license" className="gradient-border">
              <div className="rounded-2xl bg-black/40 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-sm font-semibold tracking-wide">License key</h2>
                  <span className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-zinc-400">ACTIVE</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm tracking-wider text-zinc-200 font-mono">
                    {revealed ? licenseKey : '••••-••••-••••-••••'}
                  </code>
                  <button
                    onClick={() => setRevealed((v) => !v)}
                    className="px-3 py-3 rounded-lg border border-white/10 text-xs text-zinc-300 hover:border-white/30 transition-colors"
                  >
                    {revealed ? 'Hide' : 'Reveal'}
                  </button>
                  <button
                    onClick={copyKey}
                    className="px-3 py-3 rounded-lg border border-white/10 text-xs text-zinc-300 hover:border-white/30 transition-colors"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-600 mt-3">
                  Keep this key private. Resetting it will sign out all devices.
                </p>
              </div>
            </div>

            <div id="downloads" className="gradient-border">
              <div className="rounded-2xl bg-black/40 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-sm font-semibold tracking-wide">Downloads</h2>
                  <button className="px-4 py-2 bg-white text-black rounded-lg text-xs font-semibold tracking-wide hover:bg-gray-200 transition-colors">
                    Download latest
                  </button>
                </div>
                <ul className="divide-y divide-white/10">
                  {changelog.map((c) => (
                    <li key={c.version} className="flex items-center justify-between py-3 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs px-2 py-1 rounded border border-white/10 text-zinc-300">
                          {c.version}
                        </span>
                        <span className="text-zinc-400">{c.note}</span>
                      </div>
                      <span className="text-[11px] text-zinc-600">{c.date}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right column — signature console */}
          <div id="activity" className="gradient-border h-fit">
            <div className="rounded-2xl bg-black/60 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-sm font-semibold tracking-wide">Activity</h2>
                <span className="text-[10px] text-zinc-600">live</span>
              </div>
              <div className="font-mono text-[11px] leading-relaxed space-y-1.5">
                {activity.map((a, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-zinc-600">[{a.time}]</span>
                    <span className={a.tone === 'ok' ? 'text-zinc-400' : 'text-zinc-300'}>
                      {a.tone === 'ok' ? '✓' : '△'} {a.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
