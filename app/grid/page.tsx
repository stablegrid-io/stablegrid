import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GridPage } from '@/components/grid/GridPage';

export const metadata: Metadata = {
  title: 'Grid · stablegrid.io',
  description: 'Deploy grid components with kWh earned in the Learn hub. Restore Saulégrid, one district at a time.',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) redirect('/login?next=/grid');
  return <GridPage />;
}
