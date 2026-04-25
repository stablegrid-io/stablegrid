import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('./.env.local', `file://${process.cwd()}/`), 'utf8')
  .split('\n')
  .filter((line) => line && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...rest] = line.split('=');
    acc[key.trim()] = rest.join('=').trim();
    return acc;
  }, {});

const path = process.argv[2];
if (!path) {
  console.error('Usage: node tools/apply-migration.mjs <migration.sql>');
  process.exit(1);
}

const sql = readFileSync(path, 'utf8');
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase doesn't expose a generic SQL endpoint to anon/service clients.
// We must use the Management API OR postgrest with a stored proc.
// For service role, the cleanest way is to POST to /rest/v1/rpc/exec_sql if it exists,
// or fall back to the database connection via pg library.

// Try: direct postgres via DATABASE_URL if set
const dbUrl = env.POSTGRES_URL_NON_POOLING || env.DATABASE_URL || env.POSTGRES_URL;
if (!dbUrl) {
  console.error('Need POSTGRES_URL_NON_POOLING in .env.local to apply migration directly.');
  console.error('Alternatively, paste the SQL into Supabase SQL editor manually.');
  console.error('\n--- SQL to run ---\n');
  console.log(sql);
  process.exit(1);
}

const { default: pg } = await import('pg');
const client = new pg.Client({ connectionString: dbUrl });
await client.connect();
console.log(`Applying migration: ${path}`);
const result = await client.query(sql);
console.log('Success:', result.command ?? 'multiple statements executed');
await client.end();
