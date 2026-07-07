'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Player, PositionCode } from '@/types';
import { ALL_POSITIONS, POSITION_LABELS } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { GK_STATS, FIELD_STAT_GROUPS, clampRating, defaultFieldStats, defaultGkStats, mapPositionRatings } from '@/lib/player-form';

interface EditPlayerClientProps {
  player: Player;
}

export default function EditPlayerClient({ player }: EditPlayerClientProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(player.display_name);
  const [photoUrl, setPhotoUrl] = useState(player.user?.photo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [hasField, setHasField] = useState(Boolean(player.field_attributes));
  const [hasGk, setHasGk] = useState(Boolean(player.gk_attributes));
  const [fieldStats, setFieldStats] = useState<Record<string, number>>({
    ...defaultFieldStats(),
    ...(player.field_attributes ?? {}),
  });
  const [gkStats, setGkStats] = useState<Record<string, number>>({
    ...defaultGkStats(),
    ...(player.gk_attributes ?? {}),
  });
  const [positionRatings, setPositionRatings] = useState<Partial<Record<PositionCode, number>>>(
    mapPositionRatings(player.position_ratings)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const initial = useMemo(() => displayName.charAt(0).toUpperCase(), [displayName]);

  function setField(key: string, val: number) {
    setFieldStats((prev) => ({ ...prev, [key]: clampRating(val) }));
  }

  function setGk(key: string, val: number) {
    setGkStats((prev) => ({ ...prev, [key]: clampRating(val) }));
  }

  function setPosRating(pos: PositionCode, val: number | undefined) {
    setPositionRatings((prev) => {
      const next = { ...prev };
      if (val === undefined) delete next[pos];
      else next[pos] = clampRating(val);
      return next;
    });
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError('');
    setMessage('');

    const form = new FormData();
    form.set('photo', file);

    const res = await fetch(`/api/players/${player.id}/photo`, {
      method: 'POST',
      body: form,
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Fotoğraf yüklenemedi.');
      setUploading(false);
      return;
    }

    setPhotoUrl(data.photoUrl);
    setUploading(false);
    setMessage('Fotoğraf güncellendi.');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const res = await fetch(`/api/players/${player.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName,
        hasField,
        hasGk,
        fieldStats: hasField ? fieldStats : null,
        gkStats: hasGk ? gkStats : null,
        positionRatings,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Güncelleme sırasında hata oluştu.');
      setSaving(false);
      return;
    }

    router.push(`/players/${player.id}`);
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Oyuncu Düzenle</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader><span className="font-bold text-white">Fotoğraf</span></CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full bg-slate-800 overflow-hidden ring-2 ring-slate-700">
              {photoUrl ? (
                <Image src={photoUrl} alt={displayName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-500">{initial || 'O'}</div>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPhoto(f);
                }}
              />
              <Button type="button" size="sm" variant="secondary" loading={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? 'Yükleniyor...' : 'Fotoğraf Değiştir'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><span className="font-bold text-white">Oyuncu Bilgisi</span></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input label="Görünen Ad" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            <Input label="Kullanıcı Adı" value={player.user?.username ?? ''} readOnly />
          </CardContent>
        </Card>

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
                    min={1}
                    max={99}
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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setHasField(!hasField)}
            className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${hasField ? 'bg-green-500/15 border-green-500/40 text-green-400' : 'bg-transparent border-slate-700 text-slate-500'}`}
          >
            ⚽ Saha Oyuncusu
          </button>
          <button
            type="button"
            onClick={() => setHasGk(!hasGk)}
            className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${hasGk ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400' : 'bg-transparent border-slate-700 text-slate-500'}`}
          >
            🧤 Kaleci
          </button>
        </div>

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
                        type="range"
                        min={1}
                        max={99}
                        value={fieldStats[s.key]}
                        onChange={(e) => setField(s.key, Number(e.target.value))}
                        className="flex-1 accent-green-500 w-full"
                      />
                      <input
                        type="number"
                        min={1}
                        max={99}
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

        {hasGk && (
          <Card>
            <CardHeader><span className="font-bold text-yellow-400">🧤 Kaleci Özellikleri</span></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GK_STATS.map((s) => (
                  <div key={s.key} className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{s.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={99}
                        value={gkStats[s.key]}
                        onChange={(e) => setGk(s.key, Number(e.target.value))}
                        className="flex-1 accent-yellow-500"
                      />
                      <input
                        type="number"
                        min={1}
                        max={99}
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

        {message && <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">{message}</p>}
        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>}

        <Button type="submit" loading={saving} size="lg">Kaydet</Button>
      </form>
    </div>
  );
}
