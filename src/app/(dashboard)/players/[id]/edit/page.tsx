export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import EditPlayerClient from './edit-client';

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/players');

  const { data: player } = await supabase
    .from('players')
    .select(`
      *,
      user:users(*),
      field_attributes:player_field_attributes(*),
      gk_attributes:player_gk_attributes(*),
      position_ratings:player_position_ratings(*)
    `)
    .eq('id', id)
    .single();

  if (!player) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <EditPlayerClient player={player as never} />
    </div>
  );
}
