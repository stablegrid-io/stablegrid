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

const USER_ID = 'bd7459c9-73cc-48ab-a9c9-1c8feb739f6f';

// Rewards per lib/energy.ts (assume junior tier = 1.0x for simplicity — user was reading junior tracks)
const LESSON_REWARD = 5;
const MODULE_BONUS = 25;
const TRACK_BONUS = 200;

// 1. Count unique lessons read
const { data: history, error: histErr } = await supabase
  .from('reading_lesson_history')
  .select('lesson_id, topic, chapter_id')
  .eq('user_id', USER_ID);

if (histErr) {
  console.error('reading_lesson_history error:', histErr.message);
  process.exit(1);
}

const lessonsRead = (history ?? []).length;
console.log(`Lessons read: ${lessonsRead}`);
const byTopic = {};
for (const row of history ?? []) {
  byTopic[row.topic] = (byTopic[row.topic] ?? 0) + 1;
}
console.table(byTopic);

// 2. Count completed modules
const { data: modules } = await supabase
  .from('module_progress')
  .select('module_id, is_completed')
  .eq('user_id', USER_ID)
  .eq('is_completed', true);

const completedModules = (modules ?? []).length;
console.log(`\nCompleted modules: ${completedModules}`);
for (const m of modules ?? []) {
  console.log(`  ${m.module_id}`);
}

// 3. Derive completed tracks (prefix-based: AF1..AF10 = airflow junior track if all present)
const modulePrefixes = {};
for (const m of modules ?? []) {
  const match = m.module_id.match(/^module-([A-Z]+)\d+$/);
  if (!match) continue;
  const prefix = match[1];
  modulePrefixes[prefix] = (modulePrefixes[prefix] ?? 0) + 1;
}
console.log('\nModule prefixes:');
console.table(modulePrefixes);

// Assume a "track" = 10 modules of the same prefix
const completedTracks = Object.entries(modulePrefixes).filter(([, count]) => count >= 10).length;
console.log(`Completed tracks (10+ modules same prefix): ${completedTracks}`);

// 4. Compute total earned kWh
const fromLessons = lessonsRead * LESSON_REWARD;
const fromModules = completedModules * MODULE_BONUS;
const fromTracks = completedTracks * TRACK_BONUS;
const totalEarned = fromLessons + fromModules + fromTracks;

console.log(`\n📊 Breakdown:`);
console.log(`  Lessons:  ${lessonsRead} × ${LESSON_REWARD} = ${fromLessons} kWh`);
console.log(`  Modules:  ${completedModules} × ${MODULE_BONUS} = ${fromModules} kWh`);
console.log(`  Tracks:   ${completedTracks} × ${TRACK_BONUS} = ${fromTracks} kWh`);
console.log(`  ─────────────────────────`);
console.log(`  TOTAL:                 ${totalEarned} kWh`);

// 5. Current DB state
const { data: current } = await supabase
  .from('user_progress')
  .select('xp')
  .eq('user_id', USER_ID)
  .maybeSingle();

const currentXp = current?.xp ?? 0;
console.log(`\nCurrent xp in DB: ${currentXp}`);
console.log(`Target xp:        ${totalEarned}`);
console.log(`Delta:            +${Math.max(0, totalEarned - currentXp)} kWh`);

if (!EXECUTE) {
  console.log('\n🧪 DRY RUN — run with --execute to apply.');
  process.exit(0);
}

if (totalEarned <= currentXp) {
  console.log('\n✓ Current xp already >= computed. No update needed.');
  process.exit(0);
}

// Write directly via service role (bypassing RPC cap since this is a one-time backfill)
const { error: updateErr } = await supabase
  .from('user_progress')
  .update({ xp: totalEarned, updated_at: new Date().toISOString() })
  .eq('user_id', USER_ID);

if (updateErr) {
  console.error('Update error:', updateErr.message);
  process.exit(1);
}

console.log(`\n✅ Updated xp to ${totalEarned} kWh`);
