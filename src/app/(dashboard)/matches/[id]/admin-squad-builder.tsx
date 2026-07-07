'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { JERSEY_COLORS, type JerseyColor } from '@/types';

interface Attendance {
  id: string;
  player: {
    id: string;
    display_name: string;
  };
}

interface AdminSquadBuilderProps {
  matchId: string;
  playerCount: number;
  attendances: Attendance[];
  hasExistingSquad?: boolean;
}

const COLORS = Object.keys(JERSEY_COLORS) as JerseyColor[];

export function AdminSquadBuilder({ matchId, playerCount, attendances, hasExistingSquad = false }: AdminSquadBuilderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(
    attendances.slice(0, playerCount).map((a) => a.player.id)
  );
  const [team1Name, setTeam1Name] = useState('Takım 1');
  const [team2Name, setTeam2Name] = useState('Takım 2');
  const [team1Color, setTeam1Color] = useState<JerseyColor>('red');
  const [team2Color, setTeam2Color] = useState<JerseyColor>('blue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggle(playerId: string) {
    setSelected((p) =>
      p.includes(playerId) ? p.filter((id) => id !== playerId) : [...p, playerId]
    );
  }

  async function handleGenerate() {
    if (selected.length !== playerCount) {
      setError(`AI kadro oluşturmak için tam ${playerCount} oyuncu seçmelisin.`);
      return;
    }
    setError('');
    setLoading(true);

    const res = await fetch('/api/squads/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId,
        selectedPlayerIds: selected,
        team1Name,
        team2Name,
        team1Color,
        team2Color,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'AI kadro oluşturulamadı.');
      setLoading(false);
      return;
    }

    // Approve automatically for preview — admin can approve from draft page
    await fetch(`/api/squads/${data.squadId}/approve`, { method: 'POST' });

    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="gold" size="lg" className="w-full" onClick={() => setOpen(true)}>
        {hasExistingSquad ? '🤖 AI ile Kadroyu Yeniden Olustur' : '🤖 AI ile Kadro Olustur'}
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5">
      <h3 className="text-base font-bold text-yellow-400 mb-4">Kadro Oluştur</h3>

      {/* Player selection */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Oynayacakları Seç ({selected.length} seçili / hedef {playerCount})
        </p>
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {attendances.map((a) => (
            <button
              key={a.player.id}
              type="button"
              onClick={() => toggle(a.player.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${
                selected.includes(a.player.id)
                  ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
                  : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                selected.includes(a.player.id) ? 'bg-yellow-500 border-yellow-500' : 'border-slate-600'
              }`}>
                {selected.includes(a.player.id) && (
                  <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {a.player.display_name}
            </button>
          ))}
        </div>
      </div>

      {/* Team names */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-semibold">Takım 1 Adı</label>
          <input
            value={team1Name}
            onChange={(e) => setTeam1Name(e.target.value)}
            className="bg-[#0a0e1a] border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-semibold">Takım 2 Adı</label>
          <input
            value={team2Name}
            onChange={(e) => setTeam2Name(e.target.value)}
            className="bg-[#0a0e1a] border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-yellow-500"
          />
        </div>
      </div>

      {/* Jersey colors */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {([['team1Color', team1Color, setTeam1Color, 'Takım 1 Forma'], ['team2Color', team2Color, setTeam2Color, 'Takım 2 Forma']] as const).map(([, current, setter, label]) => (
          <div key={label} className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold">{label}</label>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setter(c)}
                  title={c}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    current === c ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: JERSEY_COLORS[c] }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>İptal</Button>
        <Button
          variant="gold"
          loading={loading}
          onClick={handleGenerate}
          className="flex-1"
          disabled={selected.length !== playerCount}
        >
          {loading ? 'AI Oluşturuyor...' : '🤖 Kadroyu Oluştur'}
        </Button>
      </div>
    </div>
  );
}
