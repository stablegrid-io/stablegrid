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

const USER_EMAIL = 'vnedasvaitkus@gmail.com';

const { data: usersPage } = await supabase.auth.admin.listUsers({ perPage: 1000 });
const me = usersPage.users.find((u) => u.email === USER_EMAIL);
if (!me) {
  console.error('user not found');
  process.exit(1);
}

console.log(`User: ${me.email}  (${me.id})\n`);

const { data: progress } = await supabase
  .from('user_progress')
  .select('*')
  .eq('user_id', me.id)
  .maybeSingle();

console.log('=== user_progress ===');
console.log(JSON.stringify(progress, null, 2));

const { data: modules } = await supabase
  .from('module_progress')
  .select('module_id, is_completed, updated_at')
  .eq('user_id', me.id)
  .order('updated_at', { ascending: false })
  .limit(10);

console.log('\n=== module_progress (last 10) ===');
console.table(modules ?? []);

const { data: history } = await supabase
  .from('reading_lesson_history')
  .select('lesson_id, chapter_id, topic, read_at')
  .eq('user_id', me.id)
  .order('read_at', { ascending: false })
  .limit(10);

console.log('\n=== reading_lesson_history (last 10) ===');
console.table(history ?? []);

const { data: purchases } = await supabase
  .from('user_grid_purchases')
  .select('node_id, cost_paid, purchased_at')
  .eq('user_id', me.id);

const spent = (purchases ?? []).reduce((s, r) => s + (r.cost_paid ?? 0), 0);
console.log(`\n=== Grid purchases: ${purchases?.length ?? 0}  total spent: ${spent} kWh ===`);

console.log(`\n💡 Expected balance: ${(progress?.xp ?? 0) - spent} kWh`);
