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

const EXECUTE = process.argv.includes('--execute');

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const LIGHTBULB_EVENT = 'lightbulb_feedback_submitted';

// 1. Count bug_reports
const { count: bugCount, error: bugCountErr } = await supabase
  .from('bug_reports')
  .select('*', { count: 'exact', head: true });
if (bugCountErr) {
  console.error('bug_reports count error:', bugCountErr.message);
  process.exit(1);
}

// 2. Count lightbulb feedback events
const { count: lightbulbCount, error: lightbulbCountErr } = await supabase
  .from('product_funnel_events')
  .select('*', { count: 'exact', head: true })
  .eq('event_name', LIGHTBULB_EVENT);
if (lightbulbCountErr) {
  console.error('product_funnel_events count error:', lightbulbCountErr.message);
  process.exit(1);
}

// 3. Count triage records
const { count: triageCount, error: triageCountErr } = await supabase
  .from('admin_feedback_triage')
  .select('*', { count: 'exact', head: true });
if (triageCountErr) {
  console.error('admin_feedback_triage count error:', triageCountErr.message);
  process.exit(1);
}

console.log(`Mode: ${EXECUTE ? '🔥 EXECUTE (will delete)' : '🧪 DRY RUN (no changes)'}\n`);
console.log('Current feedback data:');
console.log(`  bug_reports:                ${bugCount}`);
console.log(`  product_funnel_events       ${lightbulbCount}  (event_name = '${LIGHTBULB_EVENT}')`);
console.log(`  admin_feedback_triage:      ${triageCount}`);
console.log(`  ─────────────────────────────────`);
console.log(`  TOTAL:                      ${bugCount + lightbulbCount + triageCount}\n`);

if (!EXECUTE) {
  console.log('⚠️  DRY RUN — no changes made.');
  console.log('Run with --execute to actually delete.');
  process.exit(0);
}

console.log('🔥 Deleting...\n');

// Delete triage first (it references bug_reports/funnel events, and has its own unique IDs)
const { error: triageDelErr, count: triageDeleted } = await supabase
  .from('admin_feedback_triage')
  .delete({ count: 'exact' })
  .not('id', 'is', null);
console.log(`  admin_feedback_triage:   deleted ${triageDeleted ?? '?'} ${triageDelErr ? '❌ ' + triageDelErr.message : '✅'}`);

// Delete bug_reports
const { error: bugDelErr, count: bugDeleted } = await supabase
  .from('bug_reports')
  .delete({ count: 'exact' })
  .not('id', 'is', null);
console.log(`  bug_reports:             deleted ${bugDeleted ?? '?'} ${bugDelErr ? '❌ ' + bugDelErr.message : '✅'}`);

// Delete lightbulb funnel events (only those, not other funnel events!)
const { error: lightbulbDelErr, count: lightbulbDeleted } = await supabase
  .from('product_funnel_events')
  .delete({ count: 'exact' })
  .eq('event_name', LIGHTBULB_EVENT);
console.log(`  product_funnel_events:   deleted ${lightbulbDeleted ?? '?'} ${lightbulbDelErr ? '❌ ' + lightbulbDelErr.message : '✅'}`);

console.log('\n✅ Done.');
