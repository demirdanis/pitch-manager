'use client';

import { FootballField } from '@/components/football-field/football-field';
import { Badge } from '@/components/ui/badge';
import type { Squad, SquadTeam, SquadPlayer, Player } from '@/types';

interface SquadViewProps {
  squad: Squad & {
    teams: (SquadTeam & {
      squad_players: (SquadPlayer & { player: Player })[];
    })[];
  };
}

export function SquadView({ squad }: SquadViewProps) {
  const team1 = squad.teams.find((t) => t.team_number === 1);
  const team2 = squad.teams.find((t) => t.team_number === 2);

  if (!team1 || !team2) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-white">Onaylı Kadro</h2>
        <Badge variant="green">Onaylandı</Badge>
      </div>

      <FootballField team1={team1 as never} team2={team2 as never} />

      {squad.ai_response_raw && (() => {
        try {
          const raw = JSON.parse(squad.ai_response_raw);
          return raw.notes ? (
            <div className="mt-4 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">AI Notu</p>
              <p className="text-sm text-slate-300">{raw.notes}</p>
              {raw.balance_score && (
                <p className="text-xs text-green-400 mt-1 font-semibold">
                  Denge Skoru: {raw.balance_score}%
                </p>
              )}
            </div>
          ) : null;
        } catch {
          return null;
        }
      })()}
    </div>
  );
}
