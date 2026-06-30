'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    // We store users with email as username@pitchmanager.local
    const email = `${username.toLowerCase().trim()}@pitchmanager.local`;
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Kullanıcı adı veya şifre hatalı.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-green-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
            <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 2 L14 7 L12 9 L10 7 Z" fill="currentColor" opacity="0.8"/>
              <path d="M12 22 L14 17 L12 15 L10 17 Z" fill="currentColor" opacity="0.8"/>
              <path d="M2 12 L7 10 L9 12 L7 14 Z" fill="currentColor" opacity="0.8"/>
              <path d="M22 12 L17 10 L15 12 L17 14 Z" fill="currentColor" opacity="0.8"/>
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white">Pitch Manager</h1>
          <p className="text-slate-500 text-sm mt-1">Halı saha yönetim sistemi</p>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-5">Giriş Yap</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              label="Kullanıcı Adı"
              placeholder="kullaniciadi"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
            <Input
              label="Şifre"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
              Giriş Yap
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
