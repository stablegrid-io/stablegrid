import type { JsonObject } from '@/lib/api/http';
import {
  enforceRateLimit,
  getClientIp,
  readIdempotencyKey,
  runIdempotentJsonRequest
} from '@/lib/api/protection';

interface AdminProtectedMutationOptions<TResponse extends JsonObject> {
  adminUserId: string;
  execute: () => Promise<{
    body: TResponse;
    status: number;
  }>;
  rateLimit?: {
    ipLimit?: number;
    userLimit?: number;
    windowSeconds?: number;
  };
  request: Request;
  requestBody: JsonObject;
  scope: string;
}

const DEFAULT_ADMIN_MUTATION_WINDOW_SECONDS = 5 * 60;
const DEFAULT_ADMIN_MUTATION_USER_LIMIT = 60;
const DEFAULT_ADMIN_MUTATION_IP_LIMIT = 120;

export const runAdminProtectedMutation = async <TResponse extends JsonObject>({
  adminUserId,
  execute,
  rateLimit,
  request,
  requestBody,
  scope
}: AdminProtectedMutationOptions<TResponse>) => {
  const clientIp = getClientIp(request);
  const idempotencyKey = readIdempotencyKey(request);
  const windowSeconds =
    rateLimit?.windowSeconds ?? DEFAULT_ADMIN_MUTATION_WINDOW_SECONDS;

  await Promise.all([
    enforceRateLimit({
      scope: `${scope}_admin_user`,
      key: adminUserId,
      limit: rateLimit?.userLimit ?? DEFAULT_ADMIN_MUTATION_USER_LIMIT,
      windowSeconds
    }),
    enforceRateLimit({
      scope: `${scope}_ip`,
      key: clientIp,
      limit: rateLimit?.ipLimit ?? DEFAULT_ADMIN_MUTATION_IP_LIMIT,
      windowSeconds
    })
  ]);

  return runIdempotentJsonRequest({
    scope,
    ownerKey: adminUserId,
    idempotencyKey,
    requestBody,
    execute
  });
};
