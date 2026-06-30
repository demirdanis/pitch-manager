import { PlayerFieldAttributes, PlayerGkAttributes, FieldRadarStats, GkRadarStats } from '@/types';

// ─── Stat computation helpers ─────────────────────────────────────────────────

export function computeFieldRadar(a: PlayerFieldAttributes): FieldRadarStats {
  const avg = (...vals: number[]) =>
    Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  return {
    PAC: avg(a.pace, a.acceleration, a.sprint_speed),
    SHO: avg(a.shooting, a.finishing, a.shot_power, a.long_shots, a.volleys, a.penalties),
    PAS: avg(a.short_passing, a.long_passing, a.vision, a.crossing, a.free_kick, a.curve),
    DRI: avg(a.dribbling, a.ball_control, a.agility, a.balance, a.reactions),
    DEF: avg(a.defending, a.marking, a.interceptions, a.standing_tackle, a.sliding_tackle),
    PHY: avg(a.physicality, a.aggression, a.strength, a.jumping, a.stamina),
  };
}

export function computeGkRadar(a: PlayerGkAttributes): GkRadarStats {
  return {
    DIV: a.gk_diving,
    HAN: a.gk_handling,
    KIC: a.gk_kicking,
    REF: a.gk_reflexes,
    POS: a.gk_positioning,
  };
}

export function computeOverall(radar: FieldRadarStats): number {
  const { PAC, SHO, PAS, DRI, DEF, PHY } = radar;
  return Math.round((PAC + SHO + PAS + DRI + DEF + PHY) / 6);
}

export function computeGkOverall(radar: GkRadarStats): number {
  const vals = Object.values(radar);
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

// ─── Rating colour helpers (FIFA OVR colour system) ───────────────────────────

export function ratingColor(value: number): string {
  if (value >= 90) return '#FFD700'; // gold
  if (value >= 75) return '#22c55e'; // green
  if (value >= 60) return '#eab308'; // yellow
  return '#ef4444';                   // red
}

export function ratingBgClass(value: number): string {
  if (value >= 90) return 'bg-yellow-400 text-black';
  if (value >= 75) return 'bg-green-500 text-white';
  if (value >= 60) return 'bg-yellow-500 text-black';
  return 'bg-red-500 text-white';
}

export function ratingBarClass(value: number): string {
  if (value >= 90) return 'bg-yellow-400';
  if (value >= 75) return 'bg-green-500';
  if (value >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function formatMatchDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function deadlineCountdown(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return 'Süre doldu';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d} gün ${h % 24} saat`;
  }
  return `${h} saat ${m} dakika`;
}

// ─── cn utility ───────────────────────────────────────────────────────────────

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Position label map ───────────────────────────────────────────────────────

export const POSITION_LABELS: Record<string, string> = {
  GK: 'Kaleci',
  LB: 'Sol Bek',
  RB: 'Sağ Bek',
  CB: 'Stoper',
  CDM: 'Def. Orta',
  LM: 'Sol Kanat',
  CM: 'Orta Saha',
  RM: 'Sağ Kanat',
  LW: 'Sol Açık',
  RW: 'Sağ Açık',
  CAM: 'Of. Orta',
  CF: '2. Forvet',
  ST: 'Santrafor',
};

export const ALL_POSITIONS = Object.keys(POSITION_LABELS) as import('@/types').PositionCode[];
