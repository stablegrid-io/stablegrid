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

const KEEP_USER_ID_PREFIX = 'bd7459c9';
const KEEP_EMAIL = 'vnedasvaitkus@gmail.com';
const EXECUTE = process.argv.includes('--execute');

// Tables with user_id FK to auth.users that we'll clean manually
// (gathered from supabase/migrations — all have ON DELETE CASCADE but
// something is blocking so we pre-clean to be safe)
const USER_ID_TABLES = [
  // from migrations grep
  'dashboard_layouts',
  'bug_reports',
  'reading_progress',
  'theory_completions',
  'reading_sessions',
  'user_grid',
  'grid_transactions',
  'grid_ops_state',
  'cookie_consents',
  'activation_tasks',
  'activation_board_state',
  'module_progress',
  'product_funnel_events',
  'reading_lesson_history',
  'subscriptions',
  'user_progress',
  'admin_memberships',
  'admin_audit_log',
  'grid_ops_incidents',
  'learning_analytics_events',
  'user_missions',
  'admin_feedback_triage',
  'profiles' // id = user_id for profiles
];

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listError) {
  console.error('listUsers failed:', listError.message);
  process.exit(1);
}

const allUsers = usersPage.users;
const toKeep = allUsers.filter((u) => u.id.startsWith(KEEP_USER_ID_PREFIX) || u.email === KEEP_EMAIL);
const toDelete = allUsers.filter((u) => !toKeep.some((k) => k.id === u.id));

console.log(`Mode: ${EXECUTE ? '🔥 EXECUTE (will delete)' : '🧪 DRY RUN (no changes)'}`);
console.log(`Total users: ${allUsers.length}`);
console.log(`Keeping:     ${toKeep.length}`);
console.log(`Deleting:    ${toDelete.length}\n`);

if (!EXECUTE) {
  console.log('Dry run — run with --execute to actually delete.');
  process.exit(0);
}

console.log('🔥 Starting deletion with pre-cleanup...\n');

let ok = 0;
let failed = 0;
const failures = [];

for (const user of toDelete) {
  // Pre-clean all known tables
  for (const table of USER_ID_TABLES) {
    const pkColumn = table === 'profiles' ? 'id' : 'user_id';
    const { error: delErr } = await supabase.from(table).delete().eq(pkColumn, user.id);
    if (delErr && !delErr.message.includes('does not exist') && delErr.code !== '42P01') {
      // Log but continue — some tables may not exist or may error harmlessly
      // console.log(`  [${table}] ${delErr.message}`);
    }
  }

  // Now delete from auth.users
  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) {
    failed++;
    failures.push({ id: user.id, email: user.email, error: error.message });
    process.stdout.write('✗');
  } else {
    ok++;
    process.stdout.write('.');
  }
}

console.log('\n');
console.log(`✅ Deleted: ${ok}`);
console.log(`❌ Failed:  ${failed}`);

if (failures.length > 0) {
  console.log('\nFirst 10 failures:');
  for (const f of failures.slice(0, 10)) {
    console.log(`  ${f.id.slice(0, 8)}  ${f.email}  →  ${f.error}`);
  }
}
