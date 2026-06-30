export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMatchDate } from '@/utils';

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users').select('is_admin').eq('id', user.id).single();
  const isAdmin = profile?.is_admin ?? false;

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: false });

  const statusLabel: Record<string, string> = {
    upcoming: 'Yaklaşıyor',
    open: 'Katılım Açık',
    closed: 'Katılım Kapandı',
    squad_ready: 'Kadro Hazır',
    completed: 'Tamamlandı',
  };
  const statusVariant: Record<string, 'green' | 'yellow' | 'slate' | 'blue' | 'red'> = {
    upcoming: 'slate',
    open: 'yellow',
    closed: 'red',
    squad_ready: 'green',
    completed: 'slate',
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Maçlar</h1>
          <p className="text-slate-500 text-sm mt-0.5">{matches?.length ?? 0} maç</p>
        </div>
        {isAdmin && (
          <Link href="/matches/new">
            <Button size="sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Maç Oluştur
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {matches?.map((m) => (
          <Link key={m.id} href={`/matches/${m.id}`}>
            <div className="flex items-center gap-4 px-4 py-4 rounded-xl bg-[#111827] border border-slate-800 hover:border-slate-600 hover:bg-[#1a2235] transition-all">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-xl shrink-0">
                ⚽
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white">{formatMatchDate(m.match_date)}</p>
                <p className="text-sm text-slate-500">{m.player_count} kişilik{m.location ? ` · ${m.location}` : ''}</p>
              </div>
              <Badge variant={statusVariant[m.status] ?? 'slate'}>
                {statusLabel[m.status] ?? m.status}
              </Badge>
            </div>
          </Link>
        ))}

        {!matches?.length && (
          <div className="text-center py-16 text-slate-500">
            <p>Henüz maç yok.</p>
          </div>
        )}
      </div>
    </div>
  );
}
