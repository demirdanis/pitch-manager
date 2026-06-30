import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generateSquad } from '@/lib/gemini/squad-generator';
import type { Player } from '@/types';

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
    .in('id', selectedPlayerIds);

  if (!players?.length) return NextResponse.json({ error: 'Oyuncular bulunamadı' }, { status: 404 });

  // Call Gemini
  const aiResult = await generateSquad(players as Player[], match.player_count);

  // Persist squad
  const adminSupabase = await createAdminClient();
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

  // Squad players
  const squadPlayers = [
    ...aiResult.team1.map((p) => ({
      squad_id: squad.id,
      team_id: t1.id,
      player_id: p.playerId,
      position_on_field: p.position,
      field_x: p.x,
      field_y: p.y,
    })),
    ...aiResult.team2.map((p) => ({
      squad_id: squad.id,
      team_id: t2.id,
      player_id: p.playerId,
      position_on_field: p.position,
      field_x: p.x,
      field_y: p.y,
    })),
  ];

  const { error: spErr } = await adminSupabase.from('squad_players').insert(squadPlayers);
  if (spErr) return NextResponse.json({ error: spErr.message }, { status: 500 });

  return NextResponse.json({ squadId: squad.id, aiResult }, { status: 201 });
}
