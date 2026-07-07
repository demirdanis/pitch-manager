import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generateSquad } from '@/lib/gemini/squad-generator';
import type { Player } from '@/types';
import type { PositionCode } from '@/types';
import { getPositionCoordinates } from '@/lib/squad-layout';

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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { matchId, selectedPlayerIds, team1Name, team2Name, team1Color, team2Color } = body;

  if (!matchId || !selectedPlayerIds?.length) {
    return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
  }

  const { data: match } = await supabase
    .from('matches').select('player_count').eq('id', matchId).single();
  if (!match) return NextResponse.json({ error: 'Maç bulunamadı' }, { status: 404 });

  const uniqueSelected = Array.from(new Set(selectedPlayerIds as string[]));
  if (uniqueSelected.length !== match.player_count) {
    return NextResponse.json(
      { error: `AI kadro için tam ${match.player_count} oyuncu seçilmeli.` },
      { status: 400 }
    );
  }

  const { data: attendingRows } = await supabase
    .from('match_attendance')
    .select('player_id')
    .eq('match_id', matchId)
    .eq('attendance_status', 'attending')
    .in('player_id', uniqueSelected);

  if ((attendingRows?.length ?? 0) !== uniqueSelected.length) {
    return NextResponse.json({ error: 'Sadece katılımcı listesindeki oyuncular seçilebilir.' }, { status: 400 });
  }

  // Fetch players with all attributes
  const { data: players } = await supabase
    .from('players')
    .select(`
      *,
      user:users(*),
      field_attributes:player_field_attributes(*),
      gk_attributes:player_gk_attributes(*),
      position_ratings:player_position_ratings(*)
    `)
    .in('id', uniqueSelected);

  if (!players?.length) return NextResponse.json({ error: 'Oyuncular bulunamadı' }, { status: 404 });

  // Call Gemini
  const aiResult = await generateSquad(players as Player[], match.player_count);

  // Clear and persist squad from scratch
  const adminSupabase = await createAdminClient();
  try {
    await clearMatchSquads(adminSupabase, matchId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eski kadrolar temizlenemedi.' },
      { status: 500 }
    );
  }

  const { data: squad, error: squadErr } = await adminSupabase
    .from('squads')
    .insert({
      match_id: matchId,
      ai_response_raw: JSON.stringify(aiResult),
      status: 'draft',
    })
    .select()
    .single();
  if (squadErr) return NextResponse.json({ error: squadErr.message }, { status: 500 });

  // Team 1
  const { data: t1, error: t1Err } = await adminSupabase
    .from('squad_teams')
    .insert({ squad_id: squad.id, team_number: 1, team_name: team1Name ?? 'Takım 1', jersey_color: team1Color ?? 'red' })
    .select().single();
  if (t1Err) return NextResponse.json({ error: t1Err.message }, { status: 500 });

  // Team 2
  const { data: t2, error: t2Err } = await adminSupabase
    .from('squad_teams')
    .insert({ squad_id: squad.id, team_number: 2, team_name: team2Name ?? 'Takım 2', jersey_color: team2Color ?? 'blue' })
    .select().single();
  if (t2Err) return NextResponse.json({ error: t2Err.message }, { status: 500 });

  const toSquadPlayers = (
    team: { playerId: string; position: PositionCode }[],
    teamNumber: 1 | 2,
    teamId: string
  ) => {
    const positionTotals = new Map<PositionCode, number>();
    team.forEach((p) => {
      positionTotals.set(p.position, (positionTotals.get(p.position) ?? 0) + 1);
    });

    const seenByPosition = new Map<PositionCode, number>();

    return team.map((p) => {
      const index = seenByPosition.get(p.position) ?? 0;
      seenByPosition.set(p.position, index + 1);
      const total = positionTotals.get(p.position) ?? 1;
      const coords = getPositionCoordinates(p.position, teamNumber, index, total);

      return {
        squad_id: squad.id,
        team_id: teamId,
        player_id: p.playerId,
        position_on_field: p.position,
        field_x: coords.x,
        field_y: coords.y,
      };
    });
  };

  const squadPlayers = [
    ...toSquadPlayers(aiResult.team1, 1, t1.id),
    ...toSquadPlayers(aiResult.team2, 2, t2.id),
  ];

  const { error: spErr } = await adminSupabase.from('squad_players').insert(squadPlayers);

  console.log('Squad generated:', { squadId: squad.id, aiResult, squadPlayers });
  if (spErr) {
    console.error('Error inserting squad players:', spErr);
    return NextResponse.json({ error: spErr.message }, { status: 500 }); 
  }

  return NextResponse.json({ squadId: squad.id, aiResult }, { status: 201 });
}
