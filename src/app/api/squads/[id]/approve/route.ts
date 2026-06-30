import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const adminSupabase = await createAdminClient();
  const { error } = await adminSupabase
    .from('squads')
    .update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update match status
  const { data: squad } = await adminSupabase.from('squads').select('match_id').eq('id', id).single();
  if (squad) {
    await adminSupabase.from('matches').update({ status: 'squad_ready' }).eq('id', squad.match_id);
  }

  return NextResponse.json({ ok: true });
}
