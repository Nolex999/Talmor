import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <header className="site-nav sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <Image src="/logo.png" alt="Talmor" width={28} height={28} className="rounded" />
            Talmor
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-zinc-400 sm:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#pricing" className="hover:text-white">Free &amp; RakNet</a>
            <a href="#download" className="hover:text-white">Download</a>
            <Link href="/raknet" className="hover:text-white">Unlock RakNet</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost px-3 py-1.5 text-sm">Sign in</Link>
            <Link href="/login?tab=register" className="btn-primary px-3 py-1.5 text-sm">Get started</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-5 pb-20 pt-20 text-center sm:pt-28">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            Free forever · optional RakNet unlock
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Luau scripting that stays out of the way
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-zinc-400 sm:text-lg">
            Talmor is a lightweight desktop executor focused on speed and a clean editor —
            not chrome. Core features are free. Advanced RakNet networking unlocks through
            Work.ink or LootLabs.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login?tab=register" className="btn-primary px-5 py-2.5 text-sm">
              Create free account
            </Link>
            <a href="#download" className="btn-ghost px-5 py-2.5 text-sm">
              Download for Windows
            </a>
          </div>
        </section>

        <section id="features" className="border-t border-zinc-800 bg-[#0c0c0e] py-20">
          <div className="mx-auto grid max-w-5xl gap-6 px-5 sm:grid-cols-3">
            {[
              {
                title: "Minimal editor",
                body: "Line numbers, Luau highlighting, IntelliSense. Built for writing scripts, not decorating windows.",
              },
              {
                title: "Free core",
                body: "Attach, execute, workspace, AutoExec, multi-instance — no subscription for the base product.",
              },
              {
                title: "RakNet unlock",
                body: "Optional networking layer. Complete a Work.ink or LootLabs gate, redeem your code, done.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-zinc-800 bg-[#111113] p-5 text-left">
                <h3 className="text-base font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-5xl px-5 py-20">
          <h2 className="text-center text-2xl font-semibold text-white">Simple model</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-[#111113] p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Core</p>
              <p className="mt-2 text-3xl font-semibold text-white">Free</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                <li>Desktop app (Windows)</li>
                <li>Script editor + workspace</li>
                <li>Attach / execute / AutoExec</li>
                <li>Script Hub &amp; settings</li>
              </ul>
              <Link href="/login?tab=register" className="btn-primary mt-6 inline-flex px-4 py-2 text-sm">
                Start free
              </Link>
            </div>
            <div className="rounded-xl border border-blue-500/40 bg-[#111113] p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">RakNet</p>
              <p className="mt-2 text-3xl font-semibold text-white">Link unlock</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                <li>Work.ink or LootLabs offer wall</li>
                <li>One-time redeem code</li>
                <li>Unlocks RakNet in the app</li>
                <li>Keeps the rest of Talmor free</li>
              </ul>
              <Link href="/raknet" className="btn-primary mt-6 inline-flex px-4 py-2 text-sm">
                Unlock RakNet
              </Link>
            </div>
          </div>
        </section>

        <section id="download" className="border-t border-zinc-800 bg-[#0c0c0e] py-20">
          <div className="mx-auto max-w-5xl px-5 text-center">
            <h2 className="text-2xl font-semibold text-white">Download</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400">
              Self-contained Windows x64 installer. Create an account, generate your free
              activation key in the dashboard, then sign in on desktop.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard" className="btn-primary px-5 py-2.5 text-sm">
                Open dashboard / downloads
              </Link>
              <Link href="/login" className="btn-ghost px-5 py-2.5 text-sm">
                Sign in first
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-500">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-4 px-5">
          <Link href="/privacy" className="hover:text-zinc-300">Privacy</Link>
          <Link href="/terms" className="hover:text-zinc-300">Terms</Link>
          <Link href="/support" className="hover:text-zinc-300">Support</Link>
          <span>© {new Date().getFullYear()} Talmor</span>
        </div>
      </footer>
    </div>
  );
}
