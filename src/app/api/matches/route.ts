import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { matchDate, matchDay, playerCount, location } = body;

  if (!matchDate || !matchDay || !playerCount) {
    return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 });
  }

  // Deadline: day before match at 17:00
  const deadline = new Date(matchDate);
  deadline.setDate(deadline.getDate() - 1);
  deadline.setHours(17, 0, 0, 0);

  const adminSupabase = await createAdminClient();
  const { data, error } = await adminSupabase
    .from('matches')
    .insert({
      created_by: user.id,
      match_date: matchDate,
      match_day: matchDay,
      player_count: playerCount,
      location: location ?? null,
      status: 'open',
      attendance_deadline: deadline.toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
