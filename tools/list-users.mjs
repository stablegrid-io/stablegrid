import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('./.env.local', `file://${process.cwd()}/`), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...rest] = line.split('=');
    acc[key.trim()] = rest.join('=').trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data: usersPage, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (error) {
  console.error('listUsers failed:', error.message);
  process.exit(1);
}

const users = usersPage.users;
console.log(`Total users: ${users.length}\n`);

const { data: profiles } = await supabase
  .from('profiles')
  .select('id, name, email, created_at');

const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

const rows = users
  .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  .map((u) => {
    const p = profileMap.get(u.id);
    return {
      id_short: u.id.slice(0, 8),
      email: u.email ?? '(no email)',
      provider: u.app_metadata?.provider ?? '?',
      name: p?.name ?? '(no profile)',
      created: u.created_at.slice(0, 10),
      last_sign_in: u.last_sign_in_at ? u.last_sign_in_at.slice(0, 10) : 'never'
    };
  });

console.table(rows);
