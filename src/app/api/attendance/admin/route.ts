import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

async function normalizeQueuePositions(adminSupabase: Awaited<ReturnType<typeof createAdminClient>>, matchId: string) {
  const { data: attendingRows } = await adminSupabase
    .from('match_attendance')
    .select('id')
    .eq('match_id', matchId)
    .eq('attendance_status', 'attending')
    .order('queue_position', { ascending: true, nullsFirst: false })
    .order('responded_at', { ascending: true });

  for (let i = 0; i < (attendingRows?.length ?? 0); i += 1) {
    const row = attendingRows![i];
    await adminSupabase
      .from('match_attendance')
      .update({ queue_position: i + 1 })
      .eq('id', row.id);
  }
}

export async function POST(request: NextRequest) {
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
  const { matchId, playerId, action } = body as {
    matchId?: string;
    playerId?: string;
    action?: 'add' | 'remove';
  };

  if (!matchId || !playerId || !action) {
    return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
  }

  const adminSupabase = await createAdminClient();

  const { data: match } = await adminSupabase
    .from('matches')
    .select('id, status')
    .eq('id', matchId)
    .single();

  if (!match) return NextResponse.json({ error: 'Maç bulunamadı' }, { status: 404 });
  if (match.status === 'completed') {
    return NextResponse.json({ error: 'Tamamlanmış maçta değişiklik yapılamaz' }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data: existing } = await adminSupabase
    .from('match_attendance')
    .select('id')
    .eq('match_id', matchId)
    .eq('player_id', playerId)
    .single();

  if (action === 'add') {
    const { count } = await adminSupabase
      .from('match_attendance')
      .select('id', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('attendance_status', 'attending');

    const nextQueue = (count ?? 0) + 1;

    if (existing) {
      const { error } = await adminSupabase
        .from('match_attendance')
        .update({
          attendance_status: 'attending',
          queue_position: nextQueue,
          responded_at: now,
        })
        .eq('id', existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await adminSupabase
        .from('match_attendance')
        .insert({
          match_id: matchId,
          player_id: playerId,
          attendance_status: 'attending',
          queue_position: nextQueue,
          responded_at: now,
        });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (existing) {
    const { error } = await adminSupabase
      .from('match_attendance')
      .update({
        attendance_status: 'not_attending',
        queue_position: null,
        responded_at: now,
      })
      .eq('id', existing.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await normalizeQueuePositions(adminSupabase, matchId);

  return NextResponse.json({ ok: true });
}
