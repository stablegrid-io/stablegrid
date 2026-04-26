import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GridPage } from '@/components/grid/GridPage';

export const metadata: Metadata = {
  title: 'Grid',
  description: 'Deploy grid components with kWh earned in the Learn hub. Restore Saulėgrid, one district at a time.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) redirect('/login?next=/grid');
  return <GridPage />;
}
