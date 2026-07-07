import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getPositionCoordinates } from '@/lib/squad-layout';
import type { PositionCode } from '@/types';

interface EditableSquadPlayer {
  id: string;
  teamNumber: 1 | 2;
  position: PositionCode;
}

function getDuplicatePositions(players: EditableSquadPlayer[]) {
  const counts = new Map<PositionCode, number>();
  players.forEach((p) => {
    counts.set(p.position, (counts.get(p.position) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([position]) => position);
}

async function clearMatchSquads(adminSupabase: Awaited<ReturnType<typeof createAdminClient>>, matchId: string) {
  const { data: existingSquads, error: existingErr } = await adminSupabase
    .from('squads')
    .select('id')
    .eq('match_id', matchId);

  if (existingErr) throw new Error(existingErr.message);
  const squadIds = (existingSquads ?? []).map((s) => s.id);
  if (squadIds.length === 0) return;

  const { error: spErr } = await adminSupabase
    .from('squad_players')
    .delete()
    .in('squad_id', squadIds);
  if (spErr) throw new Error(spErr.message);

  const { error: teamsErr } = await adminSupabase
    .from('squad_teams')
    .delete()
    .in('squad_id', squadIds);
  if (teamsErr) throw new Error(teamsErr.message);

  const { error: squadsErr } = await adminSupabase
    .from('squads')
    .delete()
    .eq('match_id', matchId);
  if (squadsErr) throw new Error(squadsErr.message);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const players = (body.players ?? []) as EditableSquadPlayer[];

  if (!Array.isArray(players) || players.length === 0) {
    return NextResponse.json({ error: 'Oyuncu listesi gerekli.' }, { status: 400 });
  }

  const adminSupabase = await createAdminClient();

  const { data: sourceSquad, error: sourceSquadErr } = await adminSupabase
    .from('squads')
    .select('id, match_id, ai_response_raw')
    .eq('id', id)
    .single();

  if (sourceSquadErr) return NextResponse.json({ error: sourceSquadErr.message }, { status: 500 });
  if (!sourceSquad) return NextResponse.json({ error: 'Kadro bulunamadı.' }, { status: 404 });

  const { data: teams, error: teamsErr } = await adminSupabase
    .from('squad_teams')
    .select('id, team_number, team_name, jersey_color')
    .eq('squad_id', id);

  if (teamsErr) return NextResponse.json({ error: teamsErr.message }, { status: 500 });
  if (!teams || teams.length !== 2) {
    return NextResponse.json({ error: 'Takım kayıtları bulunamadı.' }, { status: 404 });
  }

  const teamMap = new Map<number, string>();
  teams.forEach((t) => teamMap.set(t.team_number, t.id));

  const teamBuckets: Record<1 | 2, EditableSquadPlayer[]> = { 1: [], 2: [] };
  players.forEach((p) => {
    if (p.teamNumber === 1 || p.teamNumber === 2) {
      teamBuckets[p.teamNumber].push(p);
    }
  });

  if (teamBuckets[1].length !== teamBuckets[2].length) {
    return NextResponse.json(
      { error: `Takımlar eşit olmalı. Şu an ${teamBuckets[1].length} - ${teamBuckets[2].length}.` },
      { status: 400 }
    );
  }

  const dupTeam1 = getDuplicatePositions(teamBuckets[1]);
  if (dupTeam1.length > 0) {
    return NextResponse.json(
      { error: `Takım 1 içinde aynı pozisyon tekrar edemez: ${dupTeam1.join(', ')}` },
      { status: 400 }
    );
  }

  const dupTeam2 = getDuplicatePositions(teamBuckets[2]);
  if (dupTeam2.length > 0) {
    return NextResponse.json(
      { error: `Takım 2 içinde aynı pozisyon tekrar edemez: ${dupTeam2.join(', ')}` },
      { status: 400 }
    );
  }

  const inputIds = Array.from(new Set(players.map((p) => p.id)));

  const { data: currentRows, error: currentRowsErr } = await adminSupabase
    .from('squad_players')
    .select('id, player_id')
    .eq('squad_id', id)
    .in('id', inputIds);

  if (currentRowsErr) return NextResponse.json({ error: currentRowsErr.message }, { status: 500 });
  if (!currentRows || currentRows.length !== inputIds.length) {
    return NextResponse.json({ error: 'Kadro oyuncu listesi geçersiz.' }, { status: 400 });
  }

  const rowMap = new Map<string, { id: string; player_id: string }>();
  currentRows.forEach((row) => rowMap.set(row.id, row));

  const inserts: {
    team_number: 1 | 2;
    player_id: string;
    position_on_field: PositionCode;
    field_x: number;
    field_y: number;
  }[] = [];

  ([1, 2] as const).forEach((teamNumber) => {
    const bucket = teamBuckets[teamNumber];

    bucket.forEach((p) => {
      const coords = getPositionCoordinates(p.position, teamNumber, 0, 1);
      const row = rowMap.get(p.id);
      if (!row) return;

      inserts.push({
        team_number: teamNumber,
        player_id: row.player_id,
        position_on_field: p.position,
        field_x: coords.x,
        field_y: coords.y,
      });
    });
  });

  if (inserts.length !== players.length) {
    return NextResponse.json({ error: 'Kadro oyuncuları hazırlanamadı.' }, { status: 400 });
  }

  try {
    await clearMatchSquads(adminSupabase, sourceSquad.match_id);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eski kadrolar temizlenemedi.' },
      { status: 500 }
    );
  }

  const { data: newSquad, error: newSquadErr } = await adminSupabase
    .from('squads')
    .insert({
      match_id: sourceSquad.match_id,
      ai_response_raw: sourceSquad.ai_response_raw,
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (newSquadErr || !newSquad) {
    return NextResponse.json({ error: newSquadErr?.message ?? 'Kadro oluşturulamadı.' }, { status: 500 });
  }

  const sourceTeam1 = teams.find((t) => t.team_number === 1);
  const sourceTeam2 = teams.find((t) => t.team_number === 2);
  if (!sourceTeam1 || !sourceTeam2) {
    return NextResponse.json({ error: 'Takım bilgileri eksik.' }, { status: 400 });
  }

  const { data: createdTeam1, error: team1Err } = await adminSupabase
    .from('squad_teams')
    .insert({
      squad_id: newSquad.id,
      team_number: 1,
      team_name: sourceTeam1.team_name,
      jersey_color: sourceTeam1.jersey_color,
    })
    .select('id')
    .single();

  if (team1Err || !createdTeam1) {
    return NextResponse.json({ error: team1Err?.message ?? 'Takım 1 oluşturulamadı.' }, { status: 500 });
  }

  const { data: createdTeam2, error: team2Err } = await adminSupabase
    .from('squad_teams')
    .insert({
      squad_id: newSquad.id,
      team_number: 2,
      team_name: sourceTeam2.team_name,
      jersey_color: sourceTeam2.jersey_color,
    })
    .select('id')
    .single();

  if (team2Err || !createdTeam2) {
    return NextResponse.json({ error: team2Err?.message ?? 'Takım 2 oluşturulamadı.' }, { status: 500 });
  }

  const teamIdByNumber = new Map<1 | 2, string>([
    [1, createdTeam1.id],
    [2, createdTeam2.id],
  ]);

  const payload = inserts.map((row) => ({
    squad_id: newSquad.id,
    team_id: teamIdByNumber.get(row.team_number)!,
    player_id: row.player_id,
    position_on_field: row.position_on_field,
    field_x: row.field_x,
    field_y: row.field_y,
  }));

  const { error: insertErr } = await adminSupabase
    .from('squad_players')
    .insert(payload);

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  await adminSupabase
    .from('matches')
    .update({ status: 'squad_ready' })
    .eq('id', sourceSquad.match_id);

  return NextResponse.json({ ok: true, squadId: newSquad.id });
}
