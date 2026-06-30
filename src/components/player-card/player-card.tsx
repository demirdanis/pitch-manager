'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Player } from '@/types';
import {
  computeFieldRadar,
  computeGkRadar,
  computeOverall,
  computeGkOverall,
  ratingBgClass,
  ratingBarClass,
  POSITION_LABELS,
} from '@/utils';
import { FieldRadarChart, GkRadarChart } from '@/components/player-radar/player-radar';

interface PlayerCardProps {
  player: Player;
  compact?: boolean;
  onClick?: () => void;
}

interface StatRowProps {
  label: string;
  value: number;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 w-24 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${ratingBarClass(value)} stat-bar-fill`}
          style={{ '--bar-width': `${(value / 99) * 100}%` } as React.CSSProperties}
        />
      </div>
      <span className={`text-xs font-bold w-6 text-right ${value >= 90 ? 'text-yellow-400' : value >= 75 ? 'text-green-400' : value >= 60 ? 'text-yellow-500' : 'text-red-400'}`}>
        {value}
      </span>
    </div>
  );
}

interface StatGroupProps {
  title: string;
  stats: { label: string; value: number }[];
}

function StatGroup({ title, stats }: StatGroupProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
      >
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{title}</span>
        <svg
          className={`w-3 h-3 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-3 py-2 flex flex-col gap-1.5">
          {stats.map((s) => (
            <StatRow key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PlayerCard({ player, compact = false, onClick }: PlayerCardProps) {
  const fa = player.field_attributes;
  const ga = player.gk_attributes;

  const fieldRadar = fa ? computeFieldRadar(fa) : null;
  const gkRadar = ga ? computeGkRadar(ga) : null;
  const ovr = fieldRadar
    ? computeOverall(fieldRadar)
    : gkRadar
    ? computeGkOverall(gkRadar)
    : 0;

  const bestPosition = player.position_ratings?.sort((a, b) => b.rating - a.rating)[0];

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-3 p-3 rounded-xl bg-[#111827] border border-slate-800 hover:border-green-500/40 hover:bg-[#1a2235] cursor-pointer transition-all group"
      >
        {/* Photo */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-800 shrink-0">
          {player.user?.photo_url ? (
            <Image src={player.user.photo_url} alt={player.display_name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-400">
              {player.display_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name & position */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-100 truncate">{player.display_name}</p>
          <p className="text-xs text-slate-500">
            {bestPosition ? POSITION_LABELS[bestPosition.position] : 'Pozisyon yok'}
          </p>
        </div>

        {/* OVR */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black ${ratingBgClass(ovr)}`}>
          {ovr}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* FIFA-style card header */}
      <div className="relative rounded-t-2xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-[#0a0e1a] p-5 pb-3">
        <div className="flex items-start gap-4">
          {/* Photo */}
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-800 shrink-0 ring-2 ring-slate-700">
            {player.user?.photo_url ? (
              <Image src={player.user.photo_url} alt={player.display_name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-500">
                {player.display_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h3 className="text-lg font-black text-white">{player.display_name}</h3>
            <p className="text-sm text-slate-400">{player.user?.username}</p>
            {bestPosition && (
              <span className="mt-1 inline-block text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-md px-2 py-0.5">
                {bestPosition.position} — {POSITION_LABELS[bestPosition.position]}
              </span>
            )}

            {/* Position ratings */}
            {player.position_ratings && player.position_ratings.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {player.position_ratings.slice(0, 5).map((pr) => (
                  <span key={pr.position} className={`text-xs font-semibold px-1.5 py-0.5 rounded ${ratingBgClass(pr.rating)}`}>
                    {pr.position} {pr.rating}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* OVR */}
          <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl font-black ${ratingBgClass(ovr)} shrink-0`}>
            <span className="text-2xl leading-none">{ovr}</span>
            <span className="text-[9px] leading-tight opacity-80">OVR</span>
          </div>
        </div>

        {/* 6-stat mini row */}
        {fieldRadar && (
          <div className="mt-4 grid grid-cols-6 gap-1 border-t border-slate-700 pt-3">
            {Object.entries(fieldRadar).map(([k, v]) => (
              <div key={k} className="flex flex-col items-center">
                <span className={`text-sm font-black ${v >= 90 ? 'text-yellow-400' : v >= 75 ? 'text-green-400' : v >= 60 ? 'text-yellow-500' : 'text-red-400'}`}>
                  {v}
                </span>
                <span className="text-[9px] text-slate-500 font-semibold">{k}</span>
              </div>
            ))}
          </div>
        )}
        {gkRadar && !fieldRadar && (
          <div className="mt-4 grid grid-cols-5 gap-1 border-t border-slate-700 pt-3">
            {Object.entries(gkRadar).map(([k, v]) => (
              <div key={k} className="flex flex-col items-center">
                <span className={`text-sm font-black ${v >= 90 ? 'text-yellow-400' : v >= 75 ? 'text-green-400' : v >= 60 ? 'text-yellow-500' : 'text-red-400'}`}>
                  {v}
                </span>
                <span className="text-[9px] text-slate-500 font-semibold">{k}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Radar + stats */}
      <div className="border-x border-b border-slate-800 rounded-b-2xl bg-[#111827]">
        <div className="flex items-center justify-center p-4 border-b border-slate-800">
          {fieldRadar && <FieldRadarChart stats={fieldRadar} size={220} />}
          {gkRadar && !fieldRadar && <GkRadarChart stats={gkRadar} size={220} />}
          {!fieldRadar && !gkRadar && (
            <p className="text-sm text-slate-500 italic py-8">Henüz özellik girilmemiş</p>
          )}
        </div>

        {/* Detailed stats */}
        {fa && (
          <div className="p-4 flex flex-col gap-2">
            <StatGroup
              title="Hız"
              stats={[
                { label: 'Hız', value: fa.pace },
                { label: 'İvme', value: fa.acceleration },
                { label: 'Sprint Hızı', value: fa.sprint_speed },
              ]}
            />
            <StatGroup
              title="Şut"
              stats={[
                { label: 'Şut', value: fa.shooting },
                { label: 'Bitiricilik', value: fa.finishing },
                { label: 'Şut Gücü', value: fa.shot_power },
                { label: 'Uzaktan Şut', value: fa.long_shots },
                { label: 'Vole', value: fa.volleys },
                { label: 'Penaltı', value: fa.penalties },
              ]}
            />
            <StatGroup
              title="Pas"
              stats={[
                { label: 'Kısa Pas', value: fa.short_passing },
                { label: 'Uzun Pas', value: fa.long_passing },
                { label: 'Vizyon', value: fa.vision },
                { label: 'Orta', value: fa.crossing },
                { label: 'Frikik', value: fa.free_kick },
                { label: 'Eğri', value: fa.curve },
              ]}
            />
            <StatGroup
              title="Çalım"
              stats={[
                { label: 'Çalım', value: fa.dribbling },
                { label: 'Top Kontrolü', value: fa.ball_control },
                { label: 'Çeviklik', value: fa.agility },
                { label: 'Denge', value: fa.balance },
                { label: 'Reaksiyon', value: fa.reactions },
              ]}
            />
            <StatGroup
              title="Fizik"
              stats={[
                { label: 'Fizik', value: fa.physicality },
                { label: 'Mücadele', value: fa.aggression },
                { label: 'Güç', value: fa.strength },
                { label: 'Zıplama', value: fa.jumping },
                { label: 'Kondisyon', value: fa.stamina },
              ]}
            />
            <StatGroup
              title="Defans"
              stats={[
                { label: 'Defans', value: fa.defending },
                { label: 'Markaj', value: fa.marking },
                { label: 'Top Kapma', value: fa.interceptions },
                { label: 'Hücuma Müdahale', value: fa.standing_tackle },
                { label: 'Kayarak Müdahale', value: fa.sliding_tackle },
              ]}
            />
            <StatGroup
              title="Zihin & Kafa"
              stats={[
                { label: 'Kafa Vuruşu', value: fa.heading_accuracy },
                { label: 'Azim', value: fa.determination },
                { label: 'Hırs', value: fa.ambition },
                { label: 'Takım Oyunu', value: fa.teamwork },
                { label: 'Liderlik', value: fa.leadership },
                { label: 'Baskıya Dayanıklılık', value: fa.composure },
              ]}
            />
          </div>
        )}

        {ga && (
          <div className="p-4 flex flex-col gap-2">
            <StatGroup
              title="Kaleci"
              stats={[
                { label: 'Dalış', value: ga.gk_diving },
                { label: 'Yakalama', value: ga.gk_handling },
                { label: 'Kale Vuruşu', value: ga.gk_kicking },
                { label: 'Refleksler', value: ga.gk_reflexes },
                { label: 'Yerleşim', value: ga.gk_positioning },
                { label: 'Dağıtım', value: ga.gk_distribution },
                { label: 'Zıplama', value: ga.gk_jumping },
                { label: 'Konsantrasyon', value: ga.gk_concentration },
                { label: 'İletişim', value: ga.gk_communication },
                { label: 'Penaltı Kurtarma', value: ga.gk_penalty_saving },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
