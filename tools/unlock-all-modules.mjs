// Unlock + complete every canonical module for one user across all topics.
//
// Usage:
//   node tools/unlock-all-modules.mjs --prefix e4a1f23d            # dry-run
//   node tools/unlock-all-modules.mjs --prefix e4a1f23d --execute  # apply
//   node tools/unlock-all-modules.mjs --email user@example.com --execute
//
// Idempotent: uses UPSERT on (user_id, topic, module_id).

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// ── env ────────────────────────────────────────────────────────────────────
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

// ── args ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const EXECUTE = args.includes('--execute');
const prefixIdx = args.indexOf('--prefix');
const emailIdx = args.indexOf('--email');
const prefix = prefixIdx >= 0 ? args[prefixIdx + 1] : null;
const email = emailIdx >= 0 ? args[emailIdx + 1] : null;

if (!prefix && !email) {
  console.error('Need --prefix <uuid-prefix> or --email <email>');
  process.exit(1);
}

// ── locate user ────────────────────────────────────────────────────────────
const { data: usersPage, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listErr) {
  console.error('listUsers failed:', listErr.message);
  process.exit(1);
}

const candidates = usersPage.users.filter((u) =>
  email ? u.email === email : u.id.startsWith(prefix)
);

if (candidates.length === 0) {
  console.error(`No user found for ${email ?? prefix}`);
  process.exit(1);
}
if (candidates.length > 1) {
  console.error(`Ambiguous: ${candidates.length} users match`);
  candidates.forEach((u) => console.error(`  ${u.id}  ${u.email}`));
  process.exit(1);
}

const target = candidates[0];
console.log(`Target user: ${target.email}  (${target.id})`);

// ── enumerate canonical modules across all theory docs ─────────────────────
const docsDir = resolve('data/learn/theory/published');
const docFiles = readdirSync(docsDir).filter((f) => f.endsWith('.json'));

const rows = [];
const nowIso = new Date().toISOString();

for (const fname of docFiles) {
  const doc = JSON.parse(readFileSync(`${docsDir}/${fname}`, 'utf8'));
  const topic = doc.topic;
  const chapters = doc.chapters ?? doc.modules ?? [];
  if (!topic || chapters.length === 0) continue;
  for (const ch of chapters) {
    const order = ch.number ?? ch.order;
    if (!ch.id || !Number.isFinite(order)) continue;
    rows.push({
      user_id: target.id,
      topic,
      module_id: ch.id,
      module_order: order,
      is_unlocked: true,
      is_completed: true,
      current_lesson_id: null,
      last_visited_route: null,
      completed_at: nowIso,
      updated_at: nowIso,
    });
  }
}

console.log(`\nWill upsert ${rows.length} module_progress rows.`);
const byTopic = rows.reduce((acc, r) => ((acc[r.topic] = (acc[r.topic] ?? 0) + 1), acc), {});
for (const [t, n] of Object.entries(byTopic).sort()) {
  console.log(`  ${t.padEnd(12)} ${n} modules`);
}

if (!EXECUTE) {
  console.log('\nDry run — pass --execute to apply.');
  process.exit(0);
}

// ── replace all module_progress for this user ────────────────────────────
// (delete + insert is simpler than UPSERT here — we're rewriting the whole
// chain anyway, and the PostgREST upsert path can't match the composite
// unique key by column list on this database.)
const { error: delErr, count: deletedCount } = await supabase
  .from('module_progress')
  .delete({ count: 'exact' })
  .eq('user_id', target.id);
if (delErr) {
  console.error('delete failed:', delErr.message);
  process.exit(1);
}
console.log(`Deleted ${deletedCount ?? 0} pre-existing rows.`);

const CHUNK = 50;
let written = 0;
for (let i = 0; i < rows.length; i += CHUNK) {
  const chunk = rows.slice(i, i + CHUNK);
  const { error } = await supabase.from('module_progress').insert(chunk);
  if (error) {
    console.error(`Chunk ${i}-${i + chunk.length} failed:`, error.message);
    process.exit(1);
  }
  written += chunk.length;
  process.stdout.write(`\r  inserted ${written}/${rows.length}`);
}
process.stdout.write('\n');

// ── verify ─────────────────────────────────────────────────────────────────
const { count, error: countErr } = await supabase
  .from('module_progress')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', target.id)
  .eq('is_completed', true);

if (countErr) {
  console.error('count failed:', countErr.message);
  process.exit(1);
}

console.log(`\nDone. user has ${count} completed modules now.`);

// ── client-side checkpoint seed snippet ────────────────────────────────────
// The new module-checkpoint feature stores pass-state in localStorage
// (see lib/stores/useCheckpointStore.ts). Print a one-paste console
// command the user can run in DevTools while on stablegrid.io to mark
// every checkpoint as passed too.
const checkpointResults = {};
const nowSeed = new Date().toISOString();
for (const r of rows) {
  checkpointResults[`${r.topic.toLowerCase()}::${r.module_id}`] = {
    passed: true,
    attempts: 1,
    bestScore: 1.0,
    lastScore: 1.0,
    totalQuestions: 10,
    updatedAt: nowSeed,
  };
}
const seedPayload = JSON.stringify({
  state: { results: checkpointResults, hasHydrated: false },
  version: 1,
});

console.log('\n──────────────────────────────────────────────────────────────');
console.log('Optional: seed client-side checkpoint passes (localStorage).');
console.log('Paste this in DevTools console while on stablegrid.io, then reload:');
console.log('──────────────────────────────────────────────────────────────');
console.log(`localStorage.setItem('stablegrid-checkpoints', ${JSON.stringify(seedPayload)}); location.reload();`);
console.log('──────────────────────────────────────────────────────────────');
