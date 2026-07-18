'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-black text-white bg-grid flex items-center justify-center px-6 relative">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-[128px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[128px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm relative z-10">
        <div className="bg-black/60 backdrop-blur-xl p-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20">
              <Image 
                src="/logo.png" 
                alt="TALMOR" 
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold mb-1 text-white tracking-tight">TALMOR</h1>
            <p className="text-zinc-500 text-xs tracking-wide">ACCESS YOUR SECURE SPACE</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-3 text-xs font-medium transition-all border-b-2 ${
                activeTab === 'login'
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              LOGIN
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 px-3 text-xs font-medium transition-all border-b-2 ${
                activeTab === 'register'
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              REGISTER
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <form className="space-y-4">
              <div>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm text-white placeholder-zinc-600"
                  placeholder="Username"
                />
              </div>
              <div>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm text-white placeholder-zinc-600"
                  placeholder="Password"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-white text-black rounded-lg font-semibold text-xs tracking-wider transition-all hover:bg-gray-200"
              >
                LOG IN
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form className="space-y-4">
              <div>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm text-white placeholder-zinc-600"
                  placeholder="Username"
                />
              </div>
              <div>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm text-white placeholder-zinc-600"
                  placeholder="Password"
                />
              </div>
              <div>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm text-white placeholder-zinc-600"
                  placeholder="Invitation Code"
                  required
                />
                <p className="text-[10px] text-zinc-600 mt-2 leading-relaxed text-center">
                  Registration reserved for official resellers only.
                </p>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-white text-black rounded-lg font-semibold text-xs tracking-wider transition-all hover:bg-gray-200"
              >
                CREATE ACCOUNT
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
