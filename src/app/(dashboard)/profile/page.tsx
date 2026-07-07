'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);
  
  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('users')
      .select('display_name, photo_url')
      .eq('id', user.id)
      .single();

    if (data) {
      setDisplayName(data.display_name || '');
      setPhotoUrl(data.photo_url);
    }
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      
      console.log('📤 Uploading to:', path);

      const { error: uploadErr, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadErr) {
        console.error('❌ Upload error:', uploadErr);
        setError(`Upload hatası: ${uploadErr.message}`);
        setUploading(false);
        return;
      }

      console.log('✅ Upload successful:', uploadData);

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = data.publicUrl;
      console.log('🔗 Public URL:', url);

      const { error: updateErr, data: updateData } = await supabase
        .from('users')
        .update({ photo_url: url })
        .eq('id', user.id)
        .select();

      if (updateErr) {
        console.error('❌ DB update error:', updateErr);
        setError(`Veritabanı hatası: ${updateErr.message}`);
        setUploading(false);
        return;
      }

      console.log('✅ DB updated:', updateData);

      setPhotoUrl(url);
      setUploading(false);
      setMessage('Fotoğraf güncellendi.');
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError(`Beklenmedik hata: ${err instanceof Error ? err.message : String(err)}`);
      setUploading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('users').update({ display_name: displayName }).eq('id', user.id);
    await supabase.from('players').update({ display_name: displayName }).eq('user_id', user.id);
    setMessage('Profil güncellendi.');
    setSaving(false);
  }

  async function handleLogout() {
    setLoggingOut(true);
    setError('');

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      setLoggingOut(false);
      return;
    }

    router.push('/login');
    router.refresh();
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-black text-white mb-6">Profilim</h1>

      <div className="flex flex-col gap-4">
        {/* Photo */}
        <Card>
          <CardHeader><span className="font-bold text-white">Profil Fotoğrafı</span></CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-800 overflow-hidden shrink-0 ring-2 ring-slate-700 flex items-center justify-center text-3xl font-black text-slate-500">
              {photoUrl ? (
                <Image src={photoUrl} alt="Profil" width={80} height={80} className="object-cover w-full h-full" />
              ) : '👤'}
            </div>
            <div className="flex flex-col gap-2">
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
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} loading={uploading}>
                {uploading ? 'Yükleniyor...' : 'Fotoğraf Değiştir'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Display name */}
        <Card>
          <CardHeader><span className="font-bold text-white">İsim</span></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input
              label="Görünen Ad"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Adınız"
            />
            <Button onClick={saveProfile} loading={saving}>Kaydet</Button>
          </CardContent>
        </Card>

        {/* Change password shortcut */}
        <Card>
          <CardHeader><span className="font-bold text-white">Güvenlik</span></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button variant="secondary" className="w-full" onClick={() => router.push('/change-password')}>
              Şifre Değiştir
            </Button>
            <Button
              className="w-full"
              variant="danger"
              onClick={handleLogout}
              loading={loggingOut}
            >
              {loggingOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
            </Button>
          </CardContent>
        </Card>

        {message && (
          <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
            {message}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
