import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // Verify caller is admin via session-aware client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from('users').select('is_admin').eq('id', user.id).single();
  if (!callerProfile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use admin client (service role, bypasses RLS) for all writes
  const adminSupabase = await createAdminClient();

  const body = await request.json();
  const { displayName, username, password, hasField, hasGk, fieldStats, gkStats, positionRatings } = body;

  if (!displayName || !username || !password) {
    return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
  }

  const email = `${username.toLowerCase().trim()}`;

  // Create Supabase auth user
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName, username },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const userId = authData.user!.id;

  // Insert into users table (upsert in case trigger already created the row)
  const { error: userErr } = await adminSupabase.from('users').upsert({
    id: userId,
    username: username.toLowerCase().trim(),
    email,
    display_name: displayName,
    is_admin: false,
  }, { onConflict: 'id' });
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });

  // Insert player record
  const { data: playerData, error: playerErr } = await adminSupabase
    .from('players').insert({ user_id: userId, display_name: displayName }).select().single();
  if (playerErr) return NextResponse.json({ error: playerErr.message }, { status: 500 });

  const playerId = playerData.id;

  // Field attributes
  if (hasField && fieldStats) {
    const { error: faErr } = await adminSupabase
      .from('player_field_attributes').insert({ player_id: playerId, ...fieldStats });
    if (faErr) return NextResponse.json({ error: faErr.message }, { status: 500 });
  }

  // GK attributes
  if (hasGk && gkStats) {
    const { error: gkErr } = await adminSupabase
      .from('player_gk_attributes').insert({ player_id: playerId, ...gkStats });
    if (gkErr) return NextResponse.json({ error: gkErr.message }, { status: 500 });
  }

  // Position ratings
  if (positionRatings && Object.keys(positionRatings).length > 0) {
    const rows = Object.entries(positionRatings).map(([position, rating]) => ({
      player_id: playerId,
      position,
      rating,
    }));
    const { error: posErr } = await adminSupabase.from('player_position_ratings').insert(rows);
    if (posErr) return NextResponse.json({ error: posErr.message }, { status: 500 });
  }

  return NextResponse.json({ playerId }, { status: 201 });
}
