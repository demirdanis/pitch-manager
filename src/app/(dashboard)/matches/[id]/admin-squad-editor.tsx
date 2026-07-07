'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ALL_POSITIONS, POSITION_LABELS } from '@/utils';
import type { Player, PositionCode, SquadPlayer, SquadTeam } from '@/types';

interface EditablePlayer {
  rowId: string;
  playerId: string;
  displayName: string;
  photoUrl: string | null;
  position: PositionCode;
}

interface AdminSquadEditorProps {
  squadId: string;
  team1: SquadTeam & { squad_players: (SquadPlayer & { player: Player })[] };
  team2: SquadTeam & { squad_players: (SquadPlayer & { player: Player })[] };
}

function buildEditable(team: SquadTeam & { squad_players: (SquadPlayer & { player: Player })[] }) {
  return team.squad_players
    .filter((sp) => Boolean(sp.player))
    .map((sp) => ({
      rowId: sp.id,
      playerId: sp.player_id,
      displayName: sp.player!.display_name,
      photoUrl: sp.player!.user?.photo_url ?? null,
      position: sp.position_on_field,
    }));
}

export function AdminSquadEditor({ squadId, team1, team2 }: AdminSquadEditorProps) {
  const router = useRouter();

  const [team1Players, setTeam1Players] = useState<EditablePlayer[]>(() => buildEditable(team1));
  const [team2Players, setTeam2Players] = useState<EditablePlayer[]>(() => buildEditable(team2));
  const [draggingRowId, setDraggingRowId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const total = useMemo(() => team1Players.length + team2Players.length, [team1Players.length, team2Players.length]);

  function onDragStart(rowId: string) {
    setDraggingRowId(rowId);
  }

  function movePlayerTo(teamNumber: 1 | 2, rowId: string) {
    if (!rowId) return;

    const fromTeam1 = team1Players.find((p) => p.rowId === rowId);
    const fromTeam2 = team2Players.find((p) => p.rowId === rowId);
    const moving = fromTeam1 ?? fromTeam2;
    if (!moving) return;

    if (teamNumber === 1) {
      if (fromTeam1) return;
      setTeam2Players((prev) => prev.filter((p) => p.rowId !== rowId));
      setTeam1Players((prev) => (prev.some((p) => p.rowId === rowId) ? prev : [...prev, moving]));
      return;
    }

    if (fromTeam2) return;
    setTeam1Players((prev) => prev.filter((p) => p.rowId !== rowId));
    setTeam2Players((prev) => (prev.some((p) => p.rowId === rowId) ? prev : [...prev, moving]));
  }

  function onDrop(teamNumber: 1 | 2) {
    if (!draggingRowId) return;
    movePlayerTo(teamNumber, draggingRowId);
    setDraggingRowId(null);
  }

  function setPosition(teamNumber: 1 | 2, rowId: string, position: PositionCode) {
    if (teamNumber === 1) {
      setTeam1Players((prev) => prev.map((p) => (p.rowId === rowId ? { ...p, position } : p)));
      return;
    }
    setTeam2Players((prev) => prev.map((p) => (p.rowId === rowId ? { ...p, position } : p)));
  }

  function validateBeforeSave() {
    if (team1Players.length !== team2Players.length) {
      return `Takımlar eşit olmalı. Şu an ${team1Players.length} - ${team2Players.length}.`;
    }

    const dupTeam1 = getDuplicatePositions(team1Players);
    if (dupTeam1.length > 0) {
      return `Takım 1 içinde aynı pozisyon tekrar edemez: ${dupTeam1.join(', ')}`;
    }

    const dupTeam2 = getDuplicatePositions(team2Players);
    if (dupTeam2.length > 0) {
      return `Takım 2 içinde aynı pozisyon tekrar edemez: ${dupTeam2.join(', ')}`;
    }

    return null;
  }

  function getDuplicatePositions(players: EditablePlayer[]) {
    const counts = new Map<PositionCode, number>();
    players.forEach((p) => {
      counts.set(p.position, (counts.get(p.position) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([pos]) => pos);
  }

  async function saveChanges() {
    setError('');
    setMessage('');

    const validationError = validateBeforeSave();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    const players = [
      ...team1Players.map((p) => ({ id: p.rowId, teamNumber: 1, position: p.position })),
      ...team2Players.map((p) => ({ id: p.rowId, teamNumber: 2, position: p.position })),
    ];

    const res = await fetch(`/api/squads/${squadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ players }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Kadro güncellenemedi.');
      setSaving(false);
      return;
    }

    setSaving(false);
    setMessage('Kadro güncellendi.');
    router.refresh();
  }

  function TeamGrid({
    title,
    teamNumber,
    players,
  }: {
    title: string;
    teamNumber: 1 | 2;
    players: EditablePlayer[];
  }) {
    return (
      <div
        className="rounded-lg border border-slate-700 bg-[#0f172a] p-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDrop(teamNumber)}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-white">{title}</p>
          <span className="text-xs text-slate-400">{players.length} oyuncu</span>
        </div>

        <div className="grid grid-cols-[44px_1fr_110px] gap-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-800 mb-2">
          <span>Foto</span>
          <span>Oyuncu</span>
          <span>Pozisyon</span>
        </div>

        <div className="flex flex-col gap-1.5 min-h-24">
          {players.map((p) => (
            <div
              key={p.rowId}
              draggable
              onDragStart={() => onDragStart(p.rowId)}
              onDragEnd={() => setDraggingRowId(null)}
              className="grid grid-cols-[44px_1fr_110px] gap-2 items-center rounded-md border border-slate-800 bg-[#111827] px-2 py-2 cursor-grab active:cursor-grabbing"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                {p.photoUrl ? (
                  <Image src={p.photoUrl} alt={p.displayName} width={32} height={32} className="w-full h-full object-cover" />
                ) : (
                  p.displayName.substring(0, 2).toUpperCase()
                )}
              </div>

              <span className="text-sm text-slate-100 truncate">{p.displayName}</span>

              <select
                value={p.position}
                onChange={(e) => setPosition(teamNumber, p.rowId, e.target.value as PositionCode)}
                className="bg-[#0a0e1a] border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {ALL_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos} - {POSITION_LABELS[pos]}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {players.length === 0 && (
            <p className="text-xs text-slate-500 px-2 py-4">Oyuncuyu bu alana surukleyip birak.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-[#111827] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-white">Admin: Kadro Duzenle</h3>
        <span className="text-xs text-slate-400">Toplam: {total}</span>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Oyunculari surukle-birak ile takimlar arasinda tasiyabilirsin. Pozisyonu listeden degistirip kaydet.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <TeamGrid title={team1.team_name} teamNumber={1} players={team1Players} />
        <TeamGrid title={team2.team_name} teamNumber={2} players={team2Players} />
      </div>

      {message && <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mt-3">{message}</p>}
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mt-3">{error}</p>}

      <div className="mt-3 flex justify-end">
        <Button variant="gold" loading={saving} onClick={saveChanges}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  );
}
