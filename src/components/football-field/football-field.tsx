'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { SquadPlayer, SquadTeam, Player, JERSEY_COLORS, JerseyColor } from '@/types';
import { computeFieldRadar, computeGkRadar, computeOverall, computeGkOverall } from '@/utils';

interface FootballFieldProps {
  team1: SquadTeam & { squad_players: (SquadPlayer & { player: Player })[] };
  team2: SquadTeam & { squad_players: (SquadPlayer & { player: Player })[] };
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  player: Player | null;
  position: string;
}

function PlayerToken({
  squadPlayer,
  jerseyColor,
  onHover,
  onLeave,
}: {
  squadPlayer: SquadPlayer & { player: Player };
  jerseyColor: JerseyColor;
  onHover: (sp: SquadPlayer & { player: Player }, e: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  const color = JERSEY_COLORS[jerseyColor];
  const p = squadPlayer.player;
  const photoUrl = p.user?.photo_url;

  return (
    <g
      transform={`translate(${squadPlayer.field_x}%, ${squadPlayer.field_y}%)`}
      style={{ cursor: 'pointer' }}
      onMouseEnter={(e) => onHover(squadPlayer, e)}
      onMouseLeave={onLeave}
      onClick={(e) => onHover(squadPlayer, e as unknown as React.MouseEvent)}
    >
      {/* shadow */}
      <circle cx="0" cy="2" r="14" fill="rgba(0,0,0,0.4)" />
      {/* circle bg */}
      <circle cx="0" cy="0" r="14" fill={color} stroke="white" strokeWidth="2" />
      {/* initial or image handled via foreignObject below */}
      <text x="0" y="5" textAnchor="middle" fill="white" fontSize="11" fontWeight="900" fontFamily="inherit">
        {p.display_name.substring(0, 2).toUpperCase()}
      </text>
      {/* position label */}
      <text x="0" y="26" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="8" fontWeight="700" fontFamily="inherit">
        {squadPlayer.position_on_field}
      </text>
    </g>
  );
}

export function FootballField({ team1, team2 }: FootballFieldProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    player: null,
    position: '',
  });
  const fieldRef = useRef<SVGSVGElement>(null);

  function handleHover(sp: SquadPlayer & { player: Player }, e: React.MouseEvent) {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      visible: true,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      player: sp.player,
      position: sp.position_on_field,
    });
  }

  const allPlayers = [
    ...team1.squad_players.map((sp) => ({ sp, color: team1.jersey_color })),
    ...team2.squad_players.map((sp) => ({ sp, color: team2.jersey_color })),
  ];

  // Compute tooltip stats
  const tp = tooltip.player;
  const tpFieldRadar = tp?.field_attributes ? computeFieldRadar(tp.field_attributes) : null;
  const tpGkRadar = tp?.gk_attributes ? computeGkRadar(tp.gk_attributes) : null;
  const tpOvr = tpFieldRadar
    ? computeOverall(tpFieldRadar)
    : tpGkRadar
    ? computeGkOverall(tpGkRadar)
    : 0;

  return (
    <div className="relative w-full select-none">
      <svg
        ref={fieldRef}
        viewBox="0 0 100 160"
        className="w-full rounded-xl overflow-hidden"
        style={{ aspectRatio: '100/160' }}
      >
        {/* ── Grass stripes ──────────────────────────────────────────── */}
        <defs>
          <pattern id="grassStripes" x="0" y="0" width="100" height="10" patternUnits="userSpaceOnUse">
            <rect width="100" height="5" fill="#16a34a" />
            <rect y="5" width="100" height="5" fill="#15803d" />
          </pattern>
        </defs>
        <rect width="100" height="160" fill="url(#grassStripes)" />

        {/* ── Pitch markings ─────────────────────────────────────────── */}
        {/* Outer boundary */}
        <rect x="5" y="5" width="90" height="150" fill="none" stroke="white" strokeWidth="0.6" opacity="0.8" />

        {/* Centre line */}
        <line x1="5" y1="80" x2="95" y2="80" stroke="white" strokeWidth="0.5" opacity="0.8" />

        {/* Centre circle */}
        <circle cx="50" cy="80" r="12" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
        <circle cx="50" cy="80" r="0.8" fill="white" opacity="0.8" />

        {/* Top penalty area */}
        <rect x="22" y="5" width="56" height="22" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
        {/* Top goal area */}
        <rect x="34" y="5" width="32" height="10" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
        {/* Top goal */}
        <rect x="41" y="2" width="18" height="4" fill="none" stroke="white" strokeWidth="0.6" opacity="0.9" />
        {/* Top penalty spot */}
        <circle cx="50" cy="21" r="0.7" fill="white" opacity="0.8" />
        {/* Top penalty arc */}
        <path d="M 38 27 A 9 9 0 0 1 62 27" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />

        {/* Bottom penalty area */}
        <rect x="22" y="133" width="56" height="22" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
        {/* Bottom goal area */}
        <rect x="34" y="145" width="32" height="10" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
        {/* Bottom goal */}
        <rect x="41" y="154" width="18" height="4" fill="none" stroke="white" strokeWidth="0.6" opacity="0.9" />
        {/* Bottom penalty spot */}
        <circle cx="50" cy="139" r="0.7" fill="white" opacity="0.8" />
        {/* Bottom penalty arc */}
        <path d="M 38 133 A 9 9 0 0 0 62 133" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />

        {/* Corner arcs */}
        <path d="M 5 8 A 3 3 0 0 1 8 5" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
        <path d="M 92 5 A 3 3 0 0 1 95 8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
        <path d="M 95 152 A 3 3 0 0 1 92 155" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />
        <path d="M 8 155 A 3 3 0 0 1 5 152" fill="none" stroke="white" strokeWidth="0.5" opacity="0.8" />

        {/* Team labels */}
        <text x="50" y="74" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="4" fontWeight="700" letterSpacing="2" fontFamily="inherit">
          {team1.team_name.toUpperCase()}
        </text>
        <text x="50" y="90" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="4" fontWeight="700" letterSpacing="2" fontFamily="inherit">
          {team2.team_name.toUpperCase()}
        </text>

        {/* ── Players ───────────────────────────────────────────────── */}
        {/* We render using foreignObject per token for percentage positioning */}
        {allPlayers.map(({ sp, color }) => {
          const p = sp.player;
          if (!p) return null;
          const tokenColor = JERSEY_COLORS[color];
          const textColor =
            color === 'white' || color === 'yellow' ? '#111827' : 'white';

          // Convert % to viewBox units (100 wide, 160 tall)
          const cx = sp.field_x;
          const cy = (sp.field_y / 100) * 160;

          return (
            <g
              key={sp.id}
              transform={`translate(${cx}, ${cy})`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => handleHover(sp as SquadPlayer & { player: Player }, e as unknown as React.MouseEvent)}
              onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
            >
              {/* drop shadow */}
              <ellipse cx="0" cy="4" rx="7" ry="3" fill="rgba(0,0,0,0.35)" />
              {/* jersey circle */}
              <circle cx="0" cy="0" r="7" fill={tokenColor} stroke="white" strokeWidth="1" />
              {/* initials */}
              <text x="0" y="3" textAnchor="middle" fill={textColor} fontSize="5" fontWeight="900" fontFamily="sans-serif">
                {p.display_name.substring(0, 2).toUpperCase()}
              </text>
              {/* position label below */}
              <text x="0" y="14" textAnchor="middle" fill="white" fontSize="3.5" fontWeight="700" fontFamily="sans-serif"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
                {sp.position_on_field}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Tooltip ──────────────────────────────────────────────────── */}
      {tooltip.visible && tp && (
        <div
          className="absolute z-50 pointer-events-none w-52 rounded-xl border border-slate-700 bg-[#111827]/95 backdrop-blur-sm shadow-2xl p-3"
          style={{
            left: Math.min(tooltip.x + 12, 9999),
            top: Math.max(tooltip.y - 60, 0),
            transform: tooltip.x > 200 ? 'translateX(-110%)' : undefined,
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-black text-slate-300 overflow-hidden shrink-0">
              {tp.user?.photo_url ? (
                <Image src={tp.user.photo_url} alt={tp.display_name} width={36} height={36} className="object-cover rounded-full" />
              ) : (
                tp.display_name.charAt(0)
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">{tp.display_name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{tooltip.position}</p>
            </div>
            {tpOvr > 0 && (
              <div className={`ml-auto text-sm font-black w-9 h-9 rounded-lg flex items-center justify-center ${tpOvr >= 90 ? 'bg-yellow-400 text-black' : tpOvr >= 75 ? 'bg-green-500 text-white' : tpOvr >= 60 ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'}`}>
                {tpOvr}
              </div>
            )}
          </div>

          {/* Stats */}
          {tpFieldRadar && (
            <div className="grid grid-cols-3 gap-1">
              {Object.entries(tpFieldRadar).map(([k, v]) => (
                <div key={k} className="flex flex-col items-center bg-slate-800/60 rounded-md p-1.5">
                  <span className={`text-xs font-black ${v >= 90 ? 'text-yellow-400' : v >= 75 ? 'text-green-400' : v >= 60 ? 'text-yellow-500' : 'text-red-400'}`}>
                    {v}
                  </span>
                  <span className="text-[9px] text-slate-500">{k}</span>
                </div>
              ))}
            </div>
          )}
          {tpGkRadar && !tpFieldRadar && (
            <div className="grid grid-cols-3 gap-1">
              {Object.entries(tpGkRadar).map(([k, v]) => (
                <div key={k} className="flex flex-col items-center bg-slate-800/60 rounded-md p-1.5">
                  <span className={`text-xs font-black ${v >= 90 ? 'text-yellow-400' : v >= 75 ? 'text-green-400' : v >= 60 ? 'text-yellow-500' : 'text-red-400'}`}>
                    {v}
                  </span>
                  <span className="text-[9px] text-slate-500">{k}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Team Legend ─────────────────────────────────────────────── */}
      <div className="mt-3 flex gap-3 justify-center">
        {[team1, team2].map((team) => (
          <div key={team.id} className="flex items-center gap-2 bg-[#111827] border border-slate-800 rounded-lg px-3 py-1.5">
            <div
              className="w-4 h-4 rounded-full border-2 border-white/40"
              style={{ backgroundColor: JERSEY_COLORS[team.jersey_color] }}
            />
            <span className="text-sm font-semibold text-slate-300">{team.team_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
