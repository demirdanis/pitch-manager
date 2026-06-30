'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ALL_POSITIONS, POSITION_LABELS } from '@/utils';
import type { PositionCode } from '@/types';

const FIELD_STAT_GROUPS = [
  {
    title: 'Hız',
    stats: [
      { key: 'pace', label: 'Hız' },
      { key: 'acceleration', label: 'İvme' },
      { key: 'sprint_speed', label: 'Sprint Hızı' },
    ],
  },
  {
    title: 'Şut',
    stats: [
      { key: 'shooting', label: 'Şut' },
      { key: 'finishing', label: 'Bitiricilik' },
      { key: 'shot_power', label: 'Şut Gücü' },
      { key: 'long_shots', label: 'Uzaktan Şut' },
      { key: 'volleys', label: 'Vole' },
      { key: 'penalties', label: 'Penaltı' },
    ],
  },
  {
    title: 'Pas',
    stats: [
      { key: 'short_passing', label: 'Kısa Pas' },
      { key: 'long_passing', label: 'Uzun Pas' },
      { key: 'vision', label: 'Vizyon' },
      { key: 'crossing', label: 'Orta' },
      { key: 'free_kick', label: 'Frikik' },
      { key: 'curve', label: 'Eğri' },
    ],
  },
  {
    title: 'Çalım',
    stats: [
      { key: 'dribbling', label: 'Çalım' },
      { key: 'ball_control', label: 'Top Kontrolü' },
      { key: 'agility', label: 'Çeviklik' },
      { key: 'balance', label: 'Denge' },
      { key: 'reactions', label: 'Reaksiyon' },
    ],
  },
  {
    title: 'Fizik',
    stats: [
      { key: 'physicality', label: 'Fizik' },
      { key: 'aggression', label: 'Mücadele' },
      { key: 'strength', label: 'Güç' },
      { key: 'jumping', label: 'Zıplama' },
      { key: 'stamina', label: 'Kondisyon' },
    ],
  },
  {
    title: 'Defans',
    stats: [
      { key: 'defending', label: 'Defans' },
      { key: 'marking', label: 'Markaj' },
      { key: 'interceptions', label: 'Top Kapma' },
      { key: 'standing_tackle', label: 'Hücuma Müdahale' },
      { key: 'sliding_tackle', label: 'Kayarak Müdahale' },
    ],
  },
  {
    title: 'Zihin & Kafa',
    stats: [
      { key: 'heading_accuracy', label: 'Kafa Vuruşu' },
      { key: 'determination', label: 'Azim' },
      { key: 'ambition', label: 'Hırs' },
      { key: 'teamwork', label: 'Takım Oyunu' },
      { key: 'leadership', label: 'Liderlik' },
      { key: 'composure', label: 'Baskıya Dayanıklılık' },
    ],
  },
];

const GK_STATS = [
  { key: 'gk_diving', label: 'Dalış' },
  { key: 'gk_handling', label: 'Yakalama' },
  { key: 'gk_kicking', label: 'Kale Vuruşu' },
  { key: 'gk_reflexes', label: 'Refleksler' },
  { key: 'gk_positioning', label: 'Yerleşim' },
  { key: 'gk_distribution', label: 'Dağıtım' },
  { key: 'gk_jumping', label: 'Zıplama' },
  { key: 'gk_concentration', label: 'Konsantrasyon' },
  { key: 'gk_communication', label: 'İletişim' },
  { key: 'gk_penalty_saving', label: 'Penaltı Kurtarma' },
];

function defaultFieldStats() {
  const obj: Record<string, number> = {};
  FIELD_STAT_GROUPS.forEach((g) => g.stats.forEach((s) => (obj[s.key] = 70)));
  return obj;
}

function defaultGkStats() {
  const obj: Record<string, number> = {};
  GK_STATS.forEach((s) => (obj[s.key] = 70));
  return obj;
}

export default function NewPlayerPage() {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hasField, setHasField] = useState(true);
  const [hasGk, setHasGk] = useState(false);
  const [fieldStats, setFieldStats] = useState<Record<string, number>>(defaultFieldStats());
  const [gkStats, setGkStats] = useState<Record<string, number>>(defaultGkStats());
  const [positionRatings, setPositionRatings] = useState<Partial<Record<PositionCode, number>>>({ CM: 75 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function setField(key: string, val: number) {
    setFieldStats((p) => ({ ...p, [key]: Math.min(99, Math.max(1, val)) }));
  }
  function setGk(key: string, val: number) {
    setGkStats((p) => ({ ...p, [key]: Math.min(99, Math.max(1, val)) }));
  }
  function setPosRating(pos: PositionCode, val: number | undefined) {
    setPositionRatings((p) => {
      const next = { ...p };
      if (val === undefined) delete next[pos];
      else next[pos] = Math.min(99, Math.max(1, val));
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName,
        username,
        password,
        hasField,
        hasGk,
        fieldStats: hasField ? fieldStats : null,
        gkStats: hasGk ? gkStats : null,
        positionRatings,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Bir hata oluştu.');
      setLoading(false);
      return;
    }

    router.push('/players');
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-white mb-6">Yeni Oyuncu Ekle</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Account info */}
        <Card>
          <CardHeader><span className="font-bold text-white">Hesap Bilgileri</span></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input label="Görünen Ad" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="Ahmet Yılmaz" />
            <Input label="Kullanıcı Adı" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="ahmetyilmaz" />
            <Input label="Geçici Şifre" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="En az 6 karakter" />
          </CardContent>
        </Card>

        {/* Position ratings */}
        <Card>
          <CardHeader>
            <span className="font-bold text-white">Pozisyon Puanları</span>
            <p className="text-xs text-slate-500 mt-0.5">Bir oyuncunun birden fazla pozisyonu olabilir</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ALL_POSITIONS.map((pos) => (
                <div key={pos} className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {pos} <span className="text-slate-600">({POSITION_LABELS[pos]})</span>
                  </label>
                  <input
                    type="number"
                    min={1} max={99}
                    value={positionRatings[pos] ?? ''}
                    placeholder="—"
                    onChange={(e) => {
                      const v = e.target.value;
                      setPosRating(pos, v === '' ? undefined : Number(v));
                    }}
                    className="w-full bg-[#0a0e1a] border border-slate-700 rounded-md px-2 py-1.5 text-sm text-center text-slate-100 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Type toggles */}
        <div className="flex gap-3">
          <button type="button" onClick={() => setHasField(!hasField)}
            className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${hasField ? 'bg-green-500/15 border-green-500/40 text-green-400' : 'bg-transparent border-slate-700 text-slate-500'}`}>
            ⚽ Saha Oyuncusu
          </button>
          <button type="button" onClick={() => setHasGk(!hasGk)}
            className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${hasGk ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400' : 'bg-transparent border-slate-700 text-slate-500'}`}>
            🧤 Kaleci
          </button>
        </div>

        {/* Field stats */}
        {hasField && FIELD_STAT_GROUPS.map((group) => (
          <Card key={group.title}>
            <CardHeader><span className="font-bold text-white">{group.title}</span></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {group.stats.map((s) => (
                  <div key={s.key} className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{s.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range" min={1} max={99}
                        value={fieldStats[s.key]}
                        onChange={(e) => setField(s.key, Number(e.target.value))}
                        className="flex-1 accent-green-500"
                      />
                      <input
                        type="number" min={1} max={99}
                        value={fieldStats[s.key]}
                        onChange={(e) => setField(s.key, Number(e.target.value))}
                        className="w-12 bg-[#0a0e1a] border border-slate-700 rounded px-1.5 py-1 text-xs text-center text-slate-100 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* GK stats */}
        {hasGk && (
          <Card>
            <CardHeader><span className="font-bold text-yellow-400">🧤 Kaleci Özellikleri</span></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GK_STATS.map((s) => (
                  <div key={s.key} className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{s.label}</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min={1} max={99}
                        value={gkStats[s.key]}
                        onChange={(e) => setGk(s.key, Number(e.target.value))}
                        className="flex-1 accent-yellow-500"
                      />
                      <input type="number" min={1} max={99}
                        value={gkStats[s.key]}
                        onChange={(e) => setGk(s.key, Number(e.target.value))}
                        className="w-12 bg-[#0a0e1a] border border-slate-700 rounded px-1.5 py-1 text-xs text-center text-slate-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>}

        <Button type="submit" loading={loading} size="lg">Oyuncu Oluştur</Button>
      </form>
    </div>
  );
}
