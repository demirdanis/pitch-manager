import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users').select('id').eq('id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const { matchId, status } = body; // status: 'attending' | 'not_attending'

  if (!matchId || !status) return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });

  const adminSupabase = await createAdminClient();

  // Get player for this user
  const { data: player } = await adminSupabase
    .from('players').select('id').eq('user_id', user.id).single();
  if (!player) return NextResponse.json({ error: 'Oyuncu profili bulunamadı' }, { status: 404 });

  // Check match deadline
  const { data: match } = await adminSupabase
    .from('matches').select('attendance_deadline, status').eq('id', matchId).single();
  if (!match) return NextResponse.json({ error: 'Maç bulunamadı' }, { status: 404 });
  if (match.status !== 'open') return NextResponse.json({ error: 'Katılım kapalı' }, { status: 400 });
  if (new Date(match.attendance_deadline) < new Date()) {
    return NextResponse.json({ error: 'Katılım süresi doldu' }, { status: 400 });
  }

  // Upsert attendance
  const { data: existing } = await adminSupabase
    .from('match_attendance')
    .select('id, queue_position')
    .eq('match_id', matchId)
    .eq('player_id', player.id)
    .single();

  if (existing) {
    await adminSupabase
      .from('match_attendance')
      .update({ attendance_status: status, responded_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    // Get next queue position (only for attending)
    let queuePosition: number | null = null;
    if (status === 'attending') {
      const { count } = await adminSupabase
        .from('match_attendance')
        .select('id', { count: 'exact', head: true })
        .eq('match_id', matchId)
        .eq('attendance_status', 'attending');
      queuePosition = (count ?? 0) + 1;
    }
    await adminSupabase.from('match_attendance').insert({
      match_id: matchId,
      player_id: player.id,
      attendance_status: status,
      queue_position: queuePosition,
      responded_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true });
}
