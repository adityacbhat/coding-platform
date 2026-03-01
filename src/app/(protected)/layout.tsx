import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppSidebar from '@/components/AppSidebar';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/signin');

  return (
    <div className="flex min-h-screen">
      <AppSidebar email={user.email ?? ''} />
      <main className="flex-1 overflow-auto bg-slate-950 px-8 py-8">
        {children}
      </main>
    </div>
  );
}
