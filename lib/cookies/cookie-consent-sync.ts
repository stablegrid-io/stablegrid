import {
  compareConsentRecordFreshness,
  parseConsentRecord
} from '@/lib/cookies/cookie-consent';
import type { CookieConsentRecord } from '@/lib/cookies/cookie-types';

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseConsentResponseRecord = (payload: unknown) => {
  if (isRecord(payload) && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return parseConsentRecord(payload.data);
  }

  return parseConsentRecord(payload);
};

interface ServerConsentReadResult {
  record: CookieConsentRecord | null;
  canWrite: boolean;
}

export const readServerConsentRecord = async (): Promise<CookieConsentRecord | null> => {
  const result = await readServerConsentState();
  return result.record;
};

const readServerConsentState = async (): Promise<ServerConsentReadResult> => {
  try {
    const response = await fetch('/api/cookies/consent', {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    if (response.status === 401) {
      return {
        record: null,
        canWrite: false
      };
    }

    if (!response.ok) {
      return {
        record: null,
        canWrite: false
      };
    }

    const payload: unknown = await response.json().catch(() => null);
    return {
      record: parseConsentResponseRecord(payload),
      canWrite: true
    };
  } catch {
    return {
      record: null,
      canWrite: false
    };
  }
};

export const writeServerConsentRecord = async (record: CookieConsentRecord) => {
  try {
    const response = await fetch('/api/cookies/consent', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(record),
      keepalive: true
    });

    return response.ok;
  } catch {
    return false;
  }
};

export const syncConsentRecordWithServer = async (
  localRecord: CookieConsentRecord | null
): Promise<CookieConsentRecord | null> => {
  const { record: serverRecord, canWrite } = await readServerConsentState();

  if (!localRecord && !serverRecord) {
    return null;
  }

  if (!serverRecord && localRecord) {
    if (canWrite) {
      await writeServerConsentRecord(localRecord);
    }
    return localRecord;
  }

  if (!localRecord && serverRecord) {
    return serverRecord;
  }

  if (!localRecord || !serverRecord) {
    return null;
  }

  const localIsPreferred = compareConsentRecordFreshness(localRecord, serverRecord) >= 0;
  if (localIsPreferred) {
    if (canWrite) {
      await writeServerConsentRecord(localRecord);
    }
    return localRecord;
  }

  return serverRecord;
};
