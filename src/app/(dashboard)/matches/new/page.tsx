'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export default function NewMatchPage() {
  const router = useRouter();
  const [matchDate, setMatchDate] = useState('');
  const [matchDay, setMatchDay] = useState('Salı');
  const [playerCount, setPlayerCount] = useState(10);
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchDate, matchDay, playerCount, location }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Hata oluştu');
      setLoading(false);
      return;
    }

    router.push(`/matches/${data.id}`);
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-black text-white mb-6">Maç Oluştur</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-4">
            <Input
              label="Maç Tarihi"
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Maç Günü</label>
              <div className="grid grid-cols-4 gap-1.5">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setMatchDay(day)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                      matchDay === day
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500'
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Oyuncu Sayısı (Toplam)
              </label>
              <div className="flex gap-2 flex-wrap">
                {[8, 10, 12, 14].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPlayerCount(n)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                      playerCount === n
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500'
                    }`}
                  >
                    {n / 2}v{n / 2}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Saha / Konum (Opsiyonel)"
              placeholder="Örn: Kadıköy Halı Saha"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>
        )}

        <Button type="submit" loading={loading} size="lg">Maç Oluştur</Button>
      </form>
    </div>
  );
}
