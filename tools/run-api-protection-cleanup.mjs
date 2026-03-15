import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

const rateLimitMaxAgeSeconds = Number(process.env.API_RATE_LIMIT_RETENTION_SECONDS ?? 86400);
const idempotencyMaxAgeSeconds = Number(
  process.env.API_IDEMPOTENCY_RETENTION_SECONDS ?? 604800
);

if (!Number.isFinite(rateLimitMaxAgeSeconds) || rateLimitMaxAgeSeconds < 60) {
  throw new Error('API_RATE_LIMIT_RETENTION_SECONDS must be a number >= 60.');
}

if (!Number.isFinite(idempotencyMaxAgeSeconds) || idempotencyMaxAgeSeconds < 300) {
  throw new Error('API_IDEMPOTENCY_RETENTION_SECONDS must be a number >= 300.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { data, error } = await supabase.rpc('cleanup_api_request_protection', {
  p_rate_limit_max_age_seconds: rateLimitMaxAgeSeconds,
  p_idempotency_max_age_seconds: idempotencyMaxAgeSeconds
});

if (error) {
  throw new Error(error.message);
}

const result = Array.isArray(data) ? data[0] ?? null : data;

console.log(
  JSON.stringify(
    {
      cleanedAt: new Date().toISOString(),
      deletedRateLimitCounters: Number(result?.deleted_rate_limit_counters ?? 0),
      deletedIdempotencyKeys: Number(result?.deleted_idempotency_keys ?? 0),
      rateLimitMaxAgeSeconds,
      idempotencyMaxAgeSeconds
    },
    null,
    2
  )
);
