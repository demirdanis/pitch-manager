'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PlayerCard } from '@/components/player-card/player-card';
import { Player } from '@/types';
import { Button } from '@/components/ui/button';

interface PlayerDetailClientProps {
  player: Player;
  isAdmin: boolean;
}

export default function PlayerDetailClient({ player: initialPlayer, isAdmin }: PlayerDetailClientProps) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [player, setPlayer] = useState(initialPlayer);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fetch and sync user photo on mount and when needed
  async function syncUserPhoto() {
    const { data: user } = await supabase
      .from('users')
      .select('photo_url')
      .eq('id', player.user_id)
      .single();

    if (user) {
      setPlayer((prev:any) => ({
        ...prev,
        user: {
          ...prev.user,
          photo_url: user.photo_url,
        },
      }));
    }
  }

  useEffect(() => {
    syncUserPhoto();
  }, []);

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    formData.set('photo', file);

    const res = await fetch(`/api/players/${player.id}/photo`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Fotoğraf yüklenemedi.');
      setUploading(false);
      return;
    }

    setPlayer((prev:any) => ({
      ...prev,
      user: {
        ...prev.user,
        photo_url: data.photoUrl,
      },
    }));
    setUploading(false);
    setMessage('Fotoğraf başarıyla güncellendi.');
  }

  return (
    <div>
      <PlayerCard player={player} />

      {isAdmin && (
        <div className="mt-6 bg-[#111827] border border-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-bold text-white mb-3">Admin: Fotoğraf Yönetimi</h3>
          <Link href={`/players/${player.id}/edit`} className="block mb-3">
            <Button size="sm" variant="gold" className="w-full">Oyuncuyu Düzenle</Button>
          </Link>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadPhoto(f);
            }}
          />
          

          {message && (
            <p className="mt-3 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
