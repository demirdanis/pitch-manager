export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar, MobileNav } from '@/components/navigation/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin, display_name')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.is_admin ?? false;

  return (
    <div className="flex min-h-screen bg-[#0a0e1a]">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        {children}
      </main>
      <MobileNav isAdmin={isAdmin} />
    </div>
  );
}
