import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PlaycardsClient from './PlaycardsClient';

export const metadata = { title: 'Playcards | CodePrep' };

export default async function PlaycardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/signin');

  return (
    <Suspense>
      <PlaycardsClient />
    </Suspense>
  );
}
