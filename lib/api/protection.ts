import 'server-only';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { ApiRouteError, type JsonObject } from '@/lib/api/http';
import { logWarn } from '@/lib/logger';

type AdminClient = ReturnType<typeof createAdminClient>;

interface RateLimitRpcRow {
  allowed: boolean;
  request_count: number;
  retry_after_seconds: number;
  window_started_at: string;
  resets_at: string;
}

interface RateLimitOptions {
  scope: string;
  key: string | null;
  limit: number;
  windowSeconds: number;
}

interface IdempotencyRow {
  status: 'processing' | 'completed' | 'failed';
  request_hash: string;
  response_status: number | null;
  response_body: JsonObject | null;
  locked_until: string;
}

interface IdempotentJsonRequestOptions<TResponse extends JsonObject> {
  execute: () => Promise<{
    status: number;
    body: TResponse;
  }>;
  idempotencyKey?: string | null;
  ownerKey: string;
  requestBody: JsonObject;
  scope: string;
  ttlSeconds?: number;
}

const DEFAULT_IDEMPOTENCY_TTL_SECONDS = 60 * 10;

const hashValue = (value: string) =>
  createHash('sha256').update(value, 'utf8').digest('hex');

const sortJsonValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as JsonObject)
      .sort()
      .reduce<JsonObject>((accumulator, key) => {
        accumulator[key] = sortJsonValue((value as JsonObject)[key]);
        return accumulator;
      }, {});
  }

  return value;
};

const stableStringify = (value: unknown) => JSON.stringify(sortJsonValue(value));

const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === '23505';

const getIdempotencyRow = async (
  admin: AdminClient,
  scope: string,
  ownerHash: string,
  keyHash: string
) => {
  const { data, error } = await admin
    .from('api_idempotency_keys')
    .select('status,request_hash,response_status,response_body,locked_until')
    .eq('scope', scope)
    .eq('owner_hash', ownerHash)
    .eq('key_hash', keyHash)
    .maybeSingle<IdempotencyRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const startIdempotentRequest = async (
  admin: AdminClient,
  scope: string,
  ownerHash: string,
  keyHash: string,
  requestHash: string,
  ttlSeconds: number
) => {
  const lockedUntil = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const { error } = await admin.from('api_idempotency_keys').insert({
    scope,
    owner_hash: ownerHash,
    key_hash: keyHash,
    request_hash: requestHash,
    status: 'processing',
    locked_until: lockedUntil,
    last_seen_at: new Date().toISOString()
  });

  if (!error) {
    return { kind: 'started' as const };
  }

  if (!isUniqueViolation(error)) {
    throw new Error(error.message);
  }

  const existing = await getIdempotencyRow(admin, scope, ownerHash, keyHash);
  if (!existing) {
    throw new Error('Failed to resolve existing idempotency request.');
  }

  if (existing.request_hash !== requestHash) {
    throw new ApiRouteError('Idempotency key does not match this request.', 409);
  }

  if (existing.status === 'completed') {
    if (existing.response_status && existing.response_body) {
      return {
        kind: 'replay' as const,
        body: existing.response_body,
        status: existing.response_status
      };
    }

    throw new ApiRouteError('This request has already been processed.', 409);
  }

  if (existing.status === 'processing' && Date.parse(existing.locked_until) > Date.now()) {
    throw new ApiRouteError('A matching request is already in progress.', 409);
  }

  const { error: updateError } = await admin
    .from('api_idempotency_keys')
    .update({
      status: 'processing',
      locked_until: lockedUntil,
      last_seen_at: new Date().toISOString()
    })
    .eq('scope', scope)
    .eq('owner_hash', ownerHash)
    .eq('key_hash', keyHash);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { kind: 'started' as const };
};

const completeIdempotentRequest = async (
  admin: AdminClient,
  scope: string,
  ownerHash: string,
  keyHash: string,
  responseStatus: number,
  responseBody: JsonObject
) => {
  const { error } = await admin
    .from('api_idempotency_keys')
    .update({
      status: 'completed',
      response_status: responseStatus,
      response_body: responseBody,
      completed_at: new Date().toISOString(),
      locked_until: new Date().toISOString(),
      last_seen_at: new Date().toISOString()
    })
    .eq('scope', scope)
    .eq('owner_hash', ownerHash)
    .eq('key_hash', keyHash);

  if (error) {
    throw new Error(error.message);
  }
};

const failIdempotentRequest = async (
  admin: AdminClient,
  scope: string,
  ownerHash: string,
  keyHash: string
) => {
  const { error } = await admin
    .from('api_idempotency_keys')
    .update({
      status: 'failed',
      locked_until: new Date().toISOString(),
      last_seen_at: new Date().toISOString()
    })
    .eq('scope', scope)
    .eq('owner_hash', ownerHash)
    .eq('key_hash', keyHash);

  if (error) {
    throw new Error(error.message);
  }
};

export const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const [ip] = forwardedFor.split(',');
    if (ip?.trim()) {
      return ip.trim();
    }
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp?.trim()) {
    return realIp.trim();
  }

  const cloudflareIp = request.headers.get('cf-connecting-ip');
  if (cloudflareIp?.trim()) {
    return cloudflareIp.trim();
  }

  return null;
};

export const readIdempotencyKey = (request: Request) => {
  const rawValue = request.headers.get('idempotency-key');
  if (!rawValue) {
    return null;
  }

  const value = rawValue.trim();
  if (value.length < 8 || value.length > 200) {
    throw new ApiRouteError('Idempotency-Key header is invalid.', 400);
  }

  return value;
};

export const enforceRateLimit = async ({
  scope,
  key,
  limit,
  windowSeconds
}: RateLimitOptions) => {
  if (!key || key.trim().length === 0) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('apply_api_rate_limit', {
    p_scope: scope,
    p_key_hash: hashValue(key),
    p_limit: limit,
    p_window_seconds: windowSeconds
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? (data[0] as RateLimitRpcRow | undefined) : null;
  if (!row) {
    throw new Error('Rate limit check returned no data.');
  }

  if (!row.allowed) {
    logWarn('api.rate_limit_exceeded', {
      scope,
      requestCount: row.request_count,
      retryAfterSeconds: row.retry_after_seconds
    });

    throw new ApiRouteError('Too many requests. Please try again later.', 429, {
      details: {
        retryAfterSeconds: row.retry_after_seconds
      },
      headers: {
        'Retry-After': String(row.retry_after_seconds)
      }
    });
  }

  return row;
};

export const runIdempotentJsonRequest = async <TResponse extends JsonObject>({
  execute,
  idempotencyKey,
  ownerKey,
  requestBody,
  scope,
  ttlSeconds = DEFAULT_IDEMPOTENCY_TTL_SECONDS
}: IdempotentJsonRequestOptions<TResponse>) => {
  if (!idempotencyKey) {
    return execute();
  }

  const admin = createAdminClient();
  const ownerHash = hashValue(ownerKey);
  const keyHash = hashValue(idempotencyKey);
  const requestHash = hashValue(stableStringify(requestBody));

  const startResult = await startIdempotentRequest(
    admin,
    scope,
    ownerHash,
    keyHash,
    requestHash,
    ttlSeconds
  );

  if (startResult.kind === 'replay') {
    return {
      body: startResult.body as TResponse,
      status: startResult.status
    };
  }

  try {
    const response = await execute();
    await completeIdempotentRequest(
      admin,
      scope,
      ownerHash,
      keyHash,
      response.status,
      response.body
    );

    return response;
  } catch (error) {
    await failIdempotentRequest(admin, scope, ownerHash, keyHash);
    throw error;
  }
};
