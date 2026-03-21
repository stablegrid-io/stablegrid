/**
 * Minimal structured logger.
 *
 * Emits newline-delimited JSON to stdout.  Vercel captures all stdout lines as
 * searchable log events, so no external dependency is needed for basic
 * observability.  Fields are kept flat so log queries stay simple.
 *
 * Usage:
 *   import { logError, logWarn, logInfo } from '@/lib/logger';
 *
 *   logError('api.unhandled_error', error, { path: '/api/foo', userId });
 *   logWarn('api.rate_limit_exceeded', { scope, requestCount });
 *   logInfo('grid_ops.incident.generated', { assetId, severity });
 */

type Level = 'info' | 'warn' | 'error';
type Meta = Record<string, unknown>;

function emit(level: Level, event: string, meta?: Meta, error?: unknown) {
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    event,
    ...meta
  };

  if (error != null) {
    if (error instanceof Error) {
      entry.errorMessage = error.message;
      entry.errorName = error.name;
      // Only include stack in non-production to avoid leaking internals via
      // log aggregators that surface to clients.
      if (process.env.NODE_ENV !== 'production') {
        entry.stack = error.stack;
      }
    } else {
      entry.errorRaw = String(error);
    }
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

export const logInfo = (event: string, meta?: Meta) => emit('info', event, meta);

export const logWarn = (event: string, meta?: Meta) => emit('warn', event, meta);

export const logError = (event: string, error?: unknown, meta?: Meta) =>
  emit('error', event, meta, error);
