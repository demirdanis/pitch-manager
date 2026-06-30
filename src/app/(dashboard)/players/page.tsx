export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PlayerCard } from '@/components/player-card/player-card';
import { Button } from '@/components/ui/button';

export default async function PlayersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users').select('is_admin').eq('id', user.id).single();
  const isAdmin = profile?.is_admin ?? false;

  const { data: players } = await supabase
    .from('players')
    .select(`
      *,
      user:users(*),
      field_attributes:player_field_attributes(*),
      gk_attributes:player_gk_attributes(*),
      position_ratings:player_position_ratings(*)
    `)
    .eq('is_active', true)
    .order('display_name');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Oyuncular</h1>
          <p className="text-slate-500 text-sm mt-0.5">{players?.length ?? 0} kayıtlı oyuncu</p>
        </div>
        {isAdmin && (
          <Link href="/players/new">
            <Button size="sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Oyuncu Ekle
            </Button>
          </Link>
        )}
      </div>

      {players && players.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {players.map((p) => (
            <Link key={p.id} href={`/players/${p.id}`}>
              <PlayerCard player={p as never} compact />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500">
          <p>Henüz oyuncu yok.</p>
        </div>
      )}
    </div>
  );
}
