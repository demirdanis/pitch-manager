export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatMatchDate, deadlineCountdown, POSITION_LABELS } from '@/utils';
import { AttendanceToggle } from './attendance-toggle';
import { SquadView } from './squad-view';
import { AdminSquadBuilder } from './admin-squad-builder';

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: match }, { data: profile }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', id).single(),
    supabase.from('users').select('is_admin').eq('id', user.id).single(),
  ]);
  if (!match) notFound();

  const isAdmin = profile?.is_admin ?? false;

  // Get current user's player
  const { data: myPlayer } = await supabase
    .from('players').select('id').eq('user_id', user.id).single();

  // Get attendance list
  const { data: attendances } = await supabase
    .from('match_attendance')
    .select(`
      *,
      player:players(
        id, display_name,
        user:users(photo_url),
        position_ratings:player_position_ratings(*)
      )
    `)
    .eq('match_id', id)
    .eq('attendance_status', 'attending')
    .order('queue_position');

  // My attendance status
  let myAttendance = null;
  if (myPlayer) {
    const { data } = await supabase
      .from('match_attendance')
      .select('attendance_status')
      .eq('match_id', id)
      .eq('player_id', myPlayer.id)
      .single();
    myAttendance = data?.attendance_status ?? null;
  }

  // Approved squad
  const { data: squad } = await supabase
    .from('squads')
    .select(`
      *,
      teams:squad_teams(
        *,
        squad_players:squad_players(
          *,
          player:players(
            *,
            user:users(*),
            field_attributes:player_field_attributes(*),
            gk_attributes:player_gk_attributes(*),
            position_ratings:player_position_ratings(*)
          )
        )
      )
    `)
    .eq('match_id', id)
    .eq('status', 'approved')
    .maybeSingle();

  const isOpen = match.status === 'open';
  const isPastDeadline = new Date(match.attendance_deadline) < new Date();
  const attending = attendances ?? [];
  const filled = attending.length >= match.player_count;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-xl font-black text-white leading-tight">
            {formatMatchDate(match.match_date)}
          </h1>
          <Badge variant={
            match.status === 'squad_ready' ? 'green' :
            match.status === 'open' ? 'yellow' : 'slate'
          }>
            {match.status === 'squad_ready' ? 'Kadro Hazır' :
             match.status === 'open' ? 'Katılım Açık' :
             match.status === 'completed' ? 'Tamamlandı' : match.status}
          </Badge>
        </div>
        <p className="text-slate-500 text-sm">
          {match.player_count} kişilik maç
          {match.location ? ` · ${match.location}` : ''}
        </p>

        {isOpen && !isPastDeadline && (
          <div className="mt-2 flex items-center gap-2 text-sm text-yellow-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Katılım son: {deadlineCountdown(match.attendance_deadline)}
          </div>
        )}
        {isPastDeadline && isOpen && (
          <p className="mt-2 text-sm text-red-400">Katılım süresi doldu</p>
        )}
      </div>

      {/* My attendance toggle */}
      {isOpen && !isPastDeadline && myPlayer && (
        <div className="mb-6">
          <AttendanceToggle
            matchId={id}
            currentStatus={myAttendance}
          />
        </div>
      )}

      {/* Attendance list */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">
            Katılımcılar
            <span className="ml-2 text-sm font-normal text-slate-500">
              {attending.length} / {match.player_count}
            </span>
          </h2>
          {filled && <Badge variant="green">Liste Dolu</Badge>}
        </div>

        <div className="flex flex-col gap-2">
          {attending.map((a, idx) => {
            const p = a.player as { id: string; display_name: string; user: { photo_url: string | null }; position_ratings: { position: string; rating: number }[] };
            const bestPos = p.position_ratings?.sort((x, y) => y.rating - x.rating)[0];
            const isExtra = idx >= match.player_count;
            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  isExtra
                    ? 'bg-slate-900/50 border-slate-800/50 opacity-60'
                    : 'bg-[#111827] border-slate-800'
                }`}
              >
                <span className={`w-6 text-sm font-bold text-center ${isExtra ? 'text-slate-600' : 'text-slate-500'}`}>
                  {idx + 1}
                </span>
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-400 overflow-hidden shrink-0">
                  {p.user?.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.user.photo_url} alt={p.display_name} className="w-full h-full object-cover" />
                  ) : (
                    p.display_name.charAt(0)
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-200">{p.display_name}</p>
                  {bestPos && (
                    <p className="text-xs text-slate-500">{bestPos.position} · {POSITION_LABELS[bestPos.position]}</p>
                  )}
                </div>
                {isExtra && <Badge variant="slate">Yedek</Badge>}
              </div>
            );
          })}

          {attending.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 text-slate-500 text-sm">
                Henüz katılan yok
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Admin squad builder */}
      {isAdmin && !squad && attending.length > 0 && (
        <AdminSquadBuilder
          matchId={id}
          playerCount={match.player_count}
          attendances={attending as never}
        />
      )}

      {/* Approved squad on field */}
      {squad && (
        <SquadView squad={squad as never} />
      )}
    </div>
  );
}
