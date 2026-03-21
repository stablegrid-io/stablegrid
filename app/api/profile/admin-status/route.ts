import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ isAdmin: false });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('admin_memberships')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['content_admin', 'super_admin'])
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ isAdmin: false });
  }

  return NextResponse.json({ isAdmin: true });
}
