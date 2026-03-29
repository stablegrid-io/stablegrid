import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST() {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_E2E_USER_CREATION !== 'true') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  if (process.env.ALLOW_E2E_USER_CREATION !== 'true') {
    return NextResponse.json(
      { error: 'E2E user creation is disabled. Set ALLOW_E2E_USER_CREATION=true to enable.' },
      { status: 403 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Missing Supabase service role configuration.' },
      { status: 500 }
    );
  }

  const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const stamp = Date.now();
  const email = `codex-fresh-${stamp}@stablegrid.test`;
  const password = 'CodexPass9!';

  const { data: createdUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: 'Fresh Operator'
      }
    });

  if (createError || !createdUser.user) {
    return NextResponse.json(
      { error: createError?.message ?? 'Failed to create E2E user.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    email,
    password,
    userId: createdUser.user.id
  });
}
