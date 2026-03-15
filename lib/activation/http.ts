import { NextResponse } from 'next/server';
import { type JsonObject, toApiErrorResponse } from '@/lib/api/http';
import {
  enforceRateLimit,
  getClientIp,
  readIdempotencyKey,
  runIdempotentJsonRequest
} from '@/lib/api/protection';
import { ActivationServiceError } from '@/lib/activation/service';

interface ActivationProtectedMutationOptions<TResponse extends JsonObject> {
  execute: () => Promise<{
    body: TResponse;
    status: number;
  }>;
  request: Request;
  requestBody: JsonObject;
  scope: string;
  userId: string;
}

export const toActivationErrorResponse = (
  error: unknown,
  fallbackMessage: string
) => {
  if (error instanceof ActivationServiceError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.details ?? {})
      },
      { status: error.status }
    );
  }

  return toApiErrorResponse(error, fallbackMessage);
};

export const runProtectedActivationMutation = async <
  TResponse extends JsonObject
>({
  execute,
  request,
  requestBody,
  scope,
  userId
}: ActivationProtectedMutationOptions<TResponse>) => {
  const clientIp = getClientIp(request);
  const idempotencyKey = readIdempotencyKey(request);

  await Promise.all([
    enforceRateLimit({
      scope: `${scope}_user`,
      key: userId,
      limit: 60,
      windowSeconds: 5 * 60
    }),
    enforceRateLimit({
      scope: `${scope}_ip`,
      key: clientIp,
      limit: 120,
      windowSeconds: 5 * 60
    })
  ]);

  return runIdempotentJsonRequest({
    scope,
    ownerKey: userId,
    idempotencyKey,
    requestBody,
    execute
  });
};
