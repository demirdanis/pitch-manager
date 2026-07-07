import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: callerProfile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!callerProfile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('photo');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Fotoğraf dosyası gerekli' }, { status: 400 });
  }

  const adminSupabase = await createAdminClient();

  const { data: player, error: playerErr } = await adminSupabase
    .from('players')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (playerErr || !player) {
    return NextResponse.json({ error: 'Oyuncu bulunamadı' }, { status: 404 });
  }

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const path = `${player.user_id}.${ext}`;

  const { data: existing } = await adminSupabase.storage.from('avatars').list('', { limit: 1000 });
  const oldFiles = (existing ?? [])
    .filter((f) => f.name.startsWith(`${player.user_id}.`) && f.name !== path)
    .map((f) => f.name);

  if (oldFiles.length > 0) {
    await adminSupabase.storage.from('avatars').remove(oldFiles);
  }

  const { error: uploadErr } = await adminSupabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type || undefined });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data } = adminSupabase.storage.from('avatars').getPublicUrl(path);
  const publicUrl = `${data.publicUrl}?v=${Date.now()}`;

  const { error: updateErr } = await adminSupabase
    .from('users')
    .update({ photo_url: publicUrl })
    .eq('id', player.user_id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ photoUrl: publicUrl });
}
