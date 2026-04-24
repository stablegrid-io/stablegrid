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

const USER_ID = 'bd7459c9-73cc-48ab-a9c9-1c8feb739f6f';

console.log('Before:');
const { data: before } = await supabase
  .from('user_progress')
  .select('xp, updated_at')
  .eq('user_id', USER_ID)
  .maybeSingle();
console.log(before);

console.log('\nCalling sync_user_progress RPC with client xp=25...');
const { data: rpcResult, error: rpcError } = await supabase.rpc('sync_user_progress', {
  p_user_id: USER_ID,
  p_client_xp: 25,
  p_client_streak: 0,
  p_max_xp_increase: 500,
  p_max_streak: 365,
  p_completed_questions: [],
  p_topic_progress: {},
  p_now: new Date().toISOString()
});

console.log('RPC result:', rpcResult);
console.log('RPC error:', rpcError);

console.log('\nAfter:');
const { data: after } = await supabase
  .from('user_progress')
  .select('xp, updated_at')
  .eq('user_id', USER_ID)
  .maybeSingle();
console.log(after);
