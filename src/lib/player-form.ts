import type { PositionCode } from '@/types';

export const FIELD_STAT_GROUPS = [
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
] as const;

export const GK_STATS = [
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
] as const;

export function defaultFieldStats() {
  const obj: Record<string, number> = {};
  FIELD_STAT_GROUPS.forEach((g) => g.stats.forEach((s) => (obj[s.key] = 70)));
  return obj;
}

export function defaultGkStats() {
  const obj: Record<string, number> = {};
  GK_STATS.forEach((s) => (obj[s.key] = 70));
  return obj;
}

export function clampRating(val: number) {
  return Math.min(99, Math.max(1, val));
}

export function mapPositionRatings(rows: { position: PositionCode; rating: number }[] | undefined) {
  const mapped: Partial<Record<PositionCode, number>> = {};
  (rows ?? []).forEach((row) => {
    mapped[row.position] = row.rating;
  });
  return mapped;
}
