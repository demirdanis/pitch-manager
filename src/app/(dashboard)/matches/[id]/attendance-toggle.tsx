'use client';

import { useState, useTransition } from 'react';

interface AttendanceToggleProps {
  matchId: string;
  currentStatus: string | null;
}

export function AttendanceToggle({ matchId, currentStatus }: AttendanceToggleProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  async function toggle(newStatus: 'attending' | 'not_attending') {
    startTransition(async () => {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, status: newStatus }),
      });
      setStatus(newStatus);
    });
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#111827] p-4">
      <p className="text-sm font-semibold text-slate-300 mb-3">Bu maça katılıyor musun?</p>
      <div className="flex gap-3">
        <button
          onClick={() => toggle('attending')}
          disabled={isPending}
          className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all active:scale-95 ${
            status === 'attending'
              ? 'bg-green-500/20 border-green-500/50 text-green-400 shadow-lg shadow-green-500/10'
              : 'bg-transparent border-slate-700 text-slate-400 hover:border-green-500/30 hover:text-green-400'
          }`}
        >
          ✅ Katılıyorum
        </button>
        <button
          onClick={() => toggle('not_attending')}
          disabled={isPending}
          className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all active:scale-95 ${
            status === 'not_attending'
              ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-lg shadow-red-500/10'
              : 'bg-transparent border-slate-700 text-slate-400 hover:border-red-500/30 hover:text-red-400'
          }`}
        >
          ❌ Katılmıyorum
        </button>
      </div>
      {isPending && (
        <p className="text-xs text-slate-500 mt-2 text-center">Kaydediliyor...</p>
      )}
    </div>
  );
}
