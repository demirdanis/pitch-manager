// ─── User & Auth ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  display_name: string;
  photo_url: string | null;
  push_notifications_enabled: boolean;
  push_subscription_json: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Player ───────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  user_id: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joined relations
  user?: User;
  field_attributes?: PlayerFieldAttributes;
  gk_attributes?: PlayerGkAttributes;
  position_ratings?: PlayerPositionRating[];
}

export interface PlayerFieldAttributes {
  id: string;
  player_id: string;
  // Speed
  pace: number;
  acceleration: number;
  sprint_speed: number;
  // Shooting
  shooting: number;
  finishing: number;
  shot_power: number;
  long_shots: number;
  volleys: number;
  penalties: number;
  // Passing
  short_passing: number;
  long_passing: number;
  vision: number;
  crossing: number;
  free_kick: number;
  curve: number;
  // Dribbling
  dribbling: number;
  ball_control: number;
  agility: number;
  balance: number;
  reactions: number;
  // Physicality
  physicality: number;
  aggression: number;
  strength: number;
  jumping: number;
  stamina: number;
  // Defending
  defending: number;
  marking: number;
  interceptions: number;
  standing_tackle: number;
  sliding_tackle: number;
  // Headers & Mentality
  heading_accuracy: number;
  determination: number;
  ambition: number;
  teamwork: number;
  leadership: number;
  composure: number;
  updated_at: string;
}

export interface PlayerGkAttributes {
  id: string;
  player_id: string;
  gk_diving: number;
  gk_handling: number;
  gk_kicking: number;
  gk_reflexes: number;
  gk_positioning: number;
  gk_distribution: number;
  gk_jumping: number;
  gk_concentration: number;
  gk_communication: number;
  gk_penalty_saving: number;
  updated_at: string;
}

export type PositionCode =
  | 'GK' | 'LB' | 'RB' | 'CB' | 'CDM'
  | 'LM' | 'CM' | 'RM' | 'LW' | 'RW'
  | 'CAM' | 'CF' | 'ST';

export interface PlayerPositionRating {
  id: string;
  player_id: string;
  position: PositionCode;
  rating: number;
}

// ─── Computed stats (radar) ───────────────────────────────────────────────────

export interface FieldRadarStats {
  PAC: number; // pace avg
  SHO: number; // shooting avg
  PAS: number; // passing avg
  DRI: number; // dribbling avg
  DEF: number; // defending avg
  PHY: number; // physicality avg
}

export interface GkRadarStats {
  DIV: number;
  HAN: number;
  KIC: number;
  REF: number;
  POS: number;
}

// ─── Match ────────────────────────────────────────────────────────────────────

export type MatchStatus = 'upcoming' | 'open' | 'closed' | 'squad_ready' | 'completed';

export interface Match {
  id: string;
  created_by: string;
  match_date: string;      // ISO date string
  match_day: string;       // e.g. "Salı"
  player_count: number;    // total players per match (e.g. 10 for 5v5)
  location: string | null;
  status: MatchStatus;
  attendance_deadline: string; // ISO datetime
  created_at: string;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export type AttendanceStatus = 'attending' | 'not_attending' | 'pending';

export interface MatchAttendance {
  id: string;
  match_id: string;
  player_id: string;
  attendance_status: AttendanceStatus;
  queue_position: number | null;
  responded_at: string | null;
  created_at: string;
  // joined
  player?: Player;
}

// ─── Squad ────────────────────────────────────────────────────────────────────

export type SquadStatus = 'draft' | 'approved';

export type JerseyColor =
  | 'white' | 'black' | 'red' | 'blue'
  | 'yellow' | 'green' | 'orange' | 'purple';

export const JERSEY_COLORS: Record<JerseyColor, string> = {
  white: '#F8FAFC',
  black: '#1a1a2e',
  red: '#e63946',
  blue: '#1d6fa4',
  yellow: '#f4d03f',
  green: '#22c55e',
  orange: '#e67e22',
  purple: '#8e44ad',
};

export interface Squad {
  id: string;
  match_id: string;
  ai_prompt_used: string | null;
  ai_response_raw: string | null;
  status: SquadStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  // joined
  teams?: SquadTeam[];
}

export interface SquadTeam {
  id: string;
  squad_id: string;
  team_number: 1 | 2;
  team_name: string;
  jersey_color: JerseyColor;
  // joined
  squad_players?: SquadPlayer[];
}

export interface SquadPlayer {
  id: string;
  squad_id: string;
  team_id: string;
  player_id: string;
  position_on_field: PositionCode;
  field_x: number; // 0-100 percentage
  field_y: number; // 0-100 percentage
  // joined
  player?: Player;
}

// ─── AI Generation ────────────────────────────────────────────────────────────

export interface AiSquadResult {
  team1: AiTeamPlayer[];
  team2: AiTeamPlayer[];
  balance_score: number;
  notes: string;
}

export interface AiTeamPlayer {
  playerId: string;
  playerName: string;
  position: PositionCode;
  x: number;
  y: number;
}

// ─── Push Notifications ───────────────────────────────────────────────────────

export interface PushNotificationLog {
  id: string;
  player_id: string;
  match_id: string;
  notification_type: string;
  sent_successfully: boolean;
  sent_at: string;
}
