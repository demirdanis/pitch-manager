import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!callerProfile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { displayName, hasField, hasGk, fieldStats, gkStats, positionRatings } = body;

  if (!displayName) {
    return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
  }

  const adminSupabase = await createAdminClient();

  const { data: player, error: playerFindErr } = await adminSupabase
    .from('players')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (playerFindErr || !player) {
    return NextResponse.json({ error: 'Oyuncu bulunamadı' }, { status: 404 });
  }

  const { error: playerErr } = await adminSupabase
    .from('players')
    .update({ display_name: displayName })
    .eq('id', id);

  if (playerErr) return NextResponse.json({ error: playerErr.message }, { status: 500 });

  const { error: userErr } = await adminSupabase
    .from('users')
    .update({ display_name: displayName })
    .eq('id', player.user_id);

  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });

  if (hasField && fieldStats) {
    const { error: faErr } = await adminSupabase
      .from('player_field_attributes')
      .upsert({ player_id: id, ...fieldStats }, { onConflict: 'player_id' });
    if (faErr) return NextResponse.json({ error: faErr.message }, { status: 500 });
  } else {
    const { error: faDeleteErr } = await adminSupabase
      .from('player_field_attributes')
      .delete()
      .eq('player_id', id);
    if (faDeleteErr) return NextResponse.json({ error: faDeleteErr.message }, { status: 500 });
  }

  if (hasGk && gkStats) {
    const { error: gkErr } = await adminSupabase
      .from('player_gk_attributes')
      .upsert({ player_id: id, ...gkStats }, { onConflict: 'player_id' });
    if (gkErr) return NextResponse.json({ error: gkErr.message }, { status: 500 });
  } else {
    const { error: gkDeleteErr } = await adminSupabase
      .from('player_gk_attributes')
      .delete()
      .eq('player_id', id);
    if (gkDeleteErr) return NextResponse.json({ error: gkDeleteErr.message }, { status: 500 });
  }

  const { error: posDeleteErr } = await adminSupabase
    .from('player_position_ratings')
    .delete()
    .eq('player_id', id);

  if (posDeleteErr) return NextResponse.json({ error: posDeleteErr.message }, { status: 500 });

  if (positionRatings && Object.keys(positionRatings).length > 0) {
    const rows = Object.entries(positionRatings).map(([position, rating]) => ({
      player_id: id,
      position,
      rating,
    }));

    const { error: posErr } = await adminSupabase.from('player_position_ratings').insert(rows);
    if (posErr) return NextResponse.json({ error: posErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
