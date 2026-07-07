'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { POSITION_LABELS } from '@/utils';

interface PlayerLite {
  id: string;
  display_name: string;
  user: { photo_url: string | null } | null;
  position_ratings: { position: string; rating: number }[];
}

interface AdminAttendanceManagerProps {
  matchId: string;
  playerCount: number;
  attending: PlayerLite[];
  notAttending: PlayerLite[];
}

export function AdminAttendanceManager({ matchId, playerCount, attending, notAttending }: AdminAttendanceManagerProps) {
  const router = useRouter();
  const [loadingPlayerId, setLoadingPlayerId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function movePlayer(playerId: string, action: 'add' | 'remove') {
    setError('');
    setLoadingPlayerId(playerId);

    const res = await fetch('/api/attendance/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, playerId, action }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Güncelleme sırasında hata oluştu.');
      setLoadingPlayerId(null);
      return;
    }

    router.refresh();
    setLoadingPlayerId(null);
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#111827] p-4 mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-base font-bold text-white">Admin: Katılımcı Yönetimi</h2>
        <Badge variant={attending.length >= playerCount ? 'yellow' : 'slate'}>
          {attending.length} / {playerCount} hedef
        </Badge>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Maç {playerCount} kişilik olsa bile daha fazla katılımcı ekleyebilirsin. AI kadro için hedef kadar seçim yapılır.
      </p>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Katılmamış Futbolcular</p>
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {notAttending.map((p) => {
              const bestPos = p.position_ratings?.slice().sort((a, b) => b.rating - a.rating)[0];
              return (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-800 bg-[#0f172a]">
                  <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-400">
                    {p.user?.photo_url ? (
                      <Image src={p.user.photo_url} alt={p.display_name} width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      p.display_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{p.display_name}</p>
                    {bestPos && <p className="text-[11px] text-slate-500">{bestPos.position} · {POSITION_LABELS[bestPos.position]}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={loadingPlayerId === p.id}
                    onClick={() => movePlayer(p.id, 'add')}
                  >
                    Ekle
                  </Button>
                </div>
              );
            })}

            {notAttending.length === 0 && (
              <p className="text-sm text-slate-500 py-3 px-2">Katılmamış futbolcu yok.</p>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Katılımcılar</p>
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {attending.map((p) => {
              const bestPos = p.position_ratings?.slice().sort((a, b) => b.rating - a.rating)[0];
              return (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-800 bg-[#0f172a]">
                  <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-slate-400">
                    {p.user?.photo_url ? (
                      <Image src={p.user.photo_url} alt={p.display_name} width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      p.display_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{p.display_name}</p>
                    {bestPos && <p className="text-[11px] text-slate-500">{bestPos.position} · {POSITION_LABELS[bestPos.position]}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={loadingPlayerId === p.id}
                    onClick={() => movePlayer(p.id, 'remove')}
                  >
                    Çıkar
                  </Button>
                </div>
              );
            })}

            {attending.length === 0 && (
              <p className="text-sm text-slate-500 py-3 px-2">Katılımcı yok.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
