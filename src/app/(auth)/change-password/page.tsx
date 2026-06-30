'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (next !== confirm) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }
    if (next.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: next });
    if (err) {
      setError(err.message);
    } else {
      setSuccess('Şifreniz güncellendi.');
      setTimeout(() => router.push('/dashboard'), 1500);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-5">Şifre Değiştir</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Mevcut Şifre" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            <Input label="Yeni Şifre" type="password" value={next} onChange={(e) => setNext(e.target.value)} required />
            <Input label="Yeni Şifre (Tekrar)" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{success}</p>}
            <Button type="submit" loading={loading} className="w-full">Güncelle</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
