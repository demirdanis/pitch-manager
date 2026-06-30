-- ─── Enable UUID extension ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT UNIQUE NOT NULL,
  email        TEXT UNIQUE NOT NULL,
  is_admin     BOOLEAN DEFAULT FALSE,
  display_name TEXT NOT NULL,
  photo_url    TEXT,
  push_notifications_enabled BOOLEAN DEFAULT FALSE,
  push_subscription_json TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Players ──────────────────────────────────────────────────────────────────
CREATE TABLE players (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Player Field Attributes ──────────────────────────────────────────────────
CREATE TABLE player_field_attributes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id        UUID UNIQUE NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  -- Pace
  pace             SMALLINT DEFAULT 70 CHECK (pace BETWEEN 1 AND 99),
  acceleration     SMALLINT DEFAULT 70 CHECK (acceleration BETWEEN 1 AND 99),
  sprint_speed     SMALLINT DEFAULT 70 CHECK (sprint_speed BETWEEN 1 AND 99),
  -- Shooting
  shooting         SMALLINT DEFAULT 70 CHECK (shooting BETWEEN 1 AND 99),
  finishing        SMALLINT DEFAULT 70 CHECK (finishing BETWEEN 1 AND 99),
  shot_power       SMALLINT DEFAULT 70 CHECK (shot_power BETWEEN 1 AND 99),
  long_shots       SMALLINT DEFAULT 70 CHECK (long_shots BETWEEN 1 AND 99),
  volleys          SMALLINT DEFAULT 70 CHECK (volleys BETWEEN 1 AND 99),
  penalties        SMALLINT DEFAULT 70 CHECK (penalties BETWEEN 1 AND 99),
  -- Passing
  short_passing    SMALLINT DEFAULT 70 CHECK (short_passing BETWEEN 1 AND 99),
  long_passing     SMALLINT DEFAULT 70 CHECK (long_passing BETWEEN 1 AND 99),
  vision           SMALLINT DEFAULT 70 CHECK (vision BETWEEN 1 AND 99),
  crossing         SMALLINT DEFAULT 70 CHECK (crossing BETWEEN 1 AND 99),
  free_kick        SMALLINT DEFAULT 70 CHECK (free_kick BETWEEN 1 AND 99),
  curve            SMALLINT DEFAULT 70 CHECK (curve BETWEEN 1 AND 99),
  -- Dribbling
  dribbling        SMALLINT DEFAULT 70 CHECK (dribbling BETWEEN 1 AND 99),
  ball_control     SMALLINT DEFAULT 70 CHECK (ball_control BETWEEN 1 AND 99),
  agility          SMALLINT DEFAULT 70 CHECK (agility BETWEEN 1 AND 99),
  balance          SMALLINT DEFAULT 70 CHECK (balance BETWEEN 1 AND 99),
  reactions        SMALLINT DEFAULT 70 CHECK (reactions BETWEEN 1 AND 99),
  -- Physicality
  physicality      SMALLINT DEFAULT 70 CHECK (physicality BETWEEN 1 AND 99),
  aggression       SMALLINT DEFAULT 70 CHECK (aggression BETWEEN 1 AND 99),
  strength         SMALLINT DEFAULT 70 CHECK (strength BETWEEN 1 AND 99),
  jumping          SMALLINT DEFAULT 70 CHECK (jumping BETWEEN 1 AND 99),
  stamina          SMALLINT DEFAULT 70 CHECK (stamina BETWEEN 1 AND 99),
  -- Defending
  defending        SMALLINT DEFAULT 70 CHECK (defending BETWEEN 1 AND 99),
  marking          SMALLINT DEFAULT 70 CHECK (marking BETWEEN 1 AND 99),
  interceptions    SMALLINT DEFAULT 70 CHECK (interceptions BETWEEN 1 AND 99),
  standing_tackle  SMALLINT DEFAULT 70 CHECK (standing_tackle BETWEEN 1 AND 99),
  sliding_tackle   SMALLINT DEFAULT 70 CHECK (sliding_tackle BETWEEN 1 AND 99),
  -- Mentality & Headers
  heading_accuracy SMALLINT DEFAULT 70 CHECK (heading_accuracy BETWEEN 1 AND 99),
  determination    SMALLINT DEFAULT 70 CHECK (determination BETWEEN 1 AND 99),
  ambition         SMALLINT DEFAULT 70 CHECK (ambition BETWEEN 1 AND 99),
  teamwork         SMALLINT DEFAULT 70 CHECK (teamwork BETWEEN 1 AND 99),
  leadership       SMALLINT DEFAULT 70 CHECK (leadership BETWEEN 1 AND 99),
  composure        SMALLINT DEFAULT 70 CHECK (composure BETWEEN 1 AND 99),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Player GK Attributes ─────────────────────────────────────────────────────
CREATE TABLE player_gk_attributes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id          UUID UNIQUE NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  gk_diving          SMALLINT DEFAULT 70 CHECK (gk_diving BETWEEN 1 AND 99),
  gk_handling        SMALLINT DEFAULT 70 CHECK (gk_handling BETWEEN 1 AND 99),
  gk_kicking         SMALLINT DEFAULT 70 CHECK (gk_kicking BETWEEN 1 AND 99),
  gk_reflexes        SMALLINT DEFAULT 70 CHECK (gk_reflexes BETWEEN 1 AND 99),
  gk_positioning     SMALLINT DEFAULT 70 CHECK (gk_positioning BETWEEN 1 AND 99),
  gk_distribution    SMALLINT DEFAULT 70 CHECK (gk_distribution BETWEEN 1 AND 99),
  gk_jumping         SMALLINT DEFAULT 70 CHECK (gk_jumping BETWEEN 1 AND 99),
  gk_concentration   SMALLINT DEFAULT 70 CHECK (gk_concentration BETWEEN 1 AND 99),
  gk_communication   SMALLINT DEFAULT 70 CHECK (gk_communication BETWEEN 1 AND 99),
  gk_penalty_saving  SMALLINT DEFAULT 70 CHECK (gk_penalty_saving BETWEEN 1 AND 99),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Player Position Ratings ──────────────────────────────────────────────────
CREATE TABLE player_position_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  position   TEXT NOT NULL CHECK (position IN ('GK','LB','RB','CB','CDM','LM','CM','RM','LW','RW','CAM','CF','ST')),
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 99),
  UNIQUE (player_id, position)
);

-- ─── Matches ──────────────────────────────────────────────────────────────────
CREATE TABLE matches (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by           UUID NOT NULL REFERENCES users(id),
  match_date           DATE NOT NULL,
  match_day            TEXT NOT NULL,
  player_count         SMALLINT NOT NULL CHECK (player_count > 0),
  location             TEXT,
  status               TEXT DEFAULT 'open' CHECK (status IN ('upcoming','open','closed','squad_ready','completed')),
  attendance_deadline  TIMESTAMPTZ NOT NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Match Attendance ─────────────────────────────────────────────────────────
CREATE TABLE match_attendance (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id          UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  attendance_status TEXT NOT NULL DEFAULT 'pending' CHECK (attendance_status IN ('attending','not_attending','pending')),
  queue_position    SMALLINT,
  responded_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (match_id, player_id)
);

-- ─── Squads ───────────────────────────────────────────────────────────────────
CREATE TABLE squads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id         UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  ai_prompt_used   TEXT,
  ai_response_raw  TEXT,
  status           TEXT DEFAULT 'draft' CHECK (status IN ('draft','approved')),
  approved_by      UUID REFERENCES users(id),
  approved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Squad Teams ──────────────────────────────────────────────────────────────
CREATE TABLE squad_teams (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id     UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  team_number  SMALLINT NOT NULL CHECK (team_number IN (1, 2)),
  team_name    TEXT NOT NULL DEFAULT 'Team',
  jersey_color TEXT NOT NULL DEFAULT 'red'
);

-- ─── Squad Players ────────────────────────────────────────────────────────────
CREATE TABLE squad_players (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id          UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  team_id           UUID NOT NULL REFERENCES squad_teams(id) ON DELETE CASCADE,
  player_id         UUID NOT NULL REFERENCES players(id),
  position_on_field TEXT NOT NULL,
  field_x           NUMERIC(5,2) NOT NULL DEFAULT 50,
  field_y           NUMERIC(5,2) NOT NULL DEFAULT 50
);

-- ─── Push Notification Logs ───────────────────────────────────────────────────
CREATE TABLE push_notification_logs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id          UUID NOT NULL REFERENCES players(id),
  match_id           UUID NOT NULL REFERENCES matches(id),
  notification_type  TEXT NOT NULL,
  sent_successfully  BOOLEAN DEFAULT FALSE,
  sent_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS Policies ─────────────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_field_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_gk_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_position_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_logs ENABLE ROW LEVEL SECURITY;

-- Everyone can read all data (it's a private group app, auth-gated at middleware)
CREATE POLICY "authenticated_read_all" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON players FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON player_field_attributes FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON player_gk_attributes FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON player_position_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON match_attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON squads FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON squad_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_read_all" ON squad_players FOR SELECT TO authenticated USING (true);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Attendance: users can insert/update their own
CREATE POLICY "attendance_insert_own" ON match_attendance FOR INSERT TO authenticated WITH CHECK (
  player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
);
CREATE POLICY "attendance_update_own" ON match_attendance FOR UPDATE TO authenticated USING (
  player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
);

-- ─── Storage bucket for avatars ───────────────────────────────────────────────
-- Run this in Supabase Dashboard > Storage after creating the 'avatars' bucket
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
