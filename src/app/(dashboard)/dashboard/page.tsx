export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMatchDate } from '@/utils';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: profile }, { data: players }, { data: matches }] = await Promise.all([
    supabase.from('users').select('is_admin, display_name').eq('id', user.id).single(),
    supabase.from('players').select('id').eq('is_active', true),
    supabase.from('matches').select('*').order('match_date', { ascending: false }).limit(5),
  ]);

  const isAdmin = profile?.is_admin ?? false;
  const playerCount = players?.length ?? 0;

  // Active match (open / squad_ready)
  const activeMatch = matches?.find((m) => m.status === 'open' || m.status === 'squad_ready');

  // Attendance count for active match
  let attendanceCount = 0;
  if (activeMatch) {
    const { count } = await supabase
      .from('match_attendance')
      .select('id', { count: 'exact', head: true })
      .eq('match_id', activeMatch.id)
      .eq('attendance_status', 'attending');
    attendanceCount = count ?? 0;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">
          Merhaba, {profile?.display_name ?? 'Oyuncu'} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Haftalık maç takip sistemi</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Toplam Oyuncu"
          value={String(playerCount)}
          icon="👥"
          color="blue"
        />
        {activeMatch && (
          <>
            <StatCard
              label="Katılımcı"
              value={`${attendanceCount} / ${activeMatch.player_count}`}
              icon="✅"
              color="green"
            />
            <StatCard
              label="Sonraki Maç"
              value={activeMatch.match_day}
              icon="⚽"
              color="yellow"
              className="col-span-2 lg:col-span-1"
            />
          </>
        )}
      </div>

      {/* Active match card */}
      {activeMatch ? (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-3">Aktif Maç</h2>
          <Link href={`/matches/${activeMatch.id}`}>
            <Card glow className="hover:cursor-pointer">
              <CardContent className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-2xl">
                  ⚽
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{formatMatchDate(activeMatch.match_date)}</span>
                    <Badge variant={activeMatch.status === 'squad_ready' ? 'green' : 'yellow'}>
                      {activeMatch.status === 'squad_ready' ? 'Kadro Hazır' : 'Katılım Açık'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {activeMatch.player_count} kişilik maç
                    {activeMatch.location ? ` · ${activeMatch.location}` : ''}
                  </p>
                </div>
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </CardContent>
            </Card>
          </Link>
        </div>
      ) : (
        <Card className="mb-8">
          <CardContent className="text-center py-10">
            <p className="text-slate-500">Henüz aktif maç yok.</p>
            {isAdmin && (
              <Link href="/matches/new" className="mt-3 inline-block text-sm text-green-400 hover:text-green-300 font-semibold">
                + Maç Oluştur
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent matches */}
      {matches && matches.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Son Maçlar</h2>
          <div className="flex flex-col gap-2">
            {matches.slice(0, 4).map((m) => (
              <Link key={m.id} href={`/matches/${m.id}`}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#111827] border border-slate-800 hover:border-slate-600 transition-colors">
                  <span className="text-xs font-semibold text-slate-500 w-20 shrink-0">
                    {new Date(m.match_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="text-sm font-medium text-slate-300 flex-1">{m.match_day}</span>
                  <Badge variant={
                    m.status === 'completed' ? 'slate' :
                    m.status === 'squad_ready' ? 'green' :
                    m.status === 'open' ? 'yellow' : 'slate'
                  }>
                    {m.status === 'completed' ? 'Tamamlandı' :
                     m.status === 'squad_ready' ? 'Kadro Hazır' :
                     m.status === 'open' ? 'Açık' : m.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  className,
}: {
  label: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
  className?: string;
}) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]} ${className ?? ''}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-xs font-medium mt-0.5 opacity-80">{label}</div>
    </div>
  );
}
