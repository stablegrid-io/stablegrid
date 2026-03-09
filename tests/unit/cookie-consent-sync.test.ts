import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  readServerConsentRecord,
  syncConsentRecordWithServer
} from '@/lib/cookies/cookie-consent-sync';
import type { CookieConsentRecord } from '@/lib/cookies/cookie-types';

const buildConsentRecord = (
  timestamp: string,
  source: CookieConsentRecord['source'],
  consent: Partial<CookieConsentRecord['consent']> = {}
): CookieConsentRecord => ({
  version: 1,
  timestamp,
  source,
  consent: {
    necessary: true,
    analytics: Boolean(consent.analytics),
    marketing: Boolean(consent.marketing),
    preferences: Boolean(consent.preferences)
  }
});

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });

describe('cookie consent Supabase sync', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads consent record from API response envelope', async () => {
    const expected = buildConsentRecord('2026-03-09T12:00:00.000Z', 'preferences_save', {
      analytics: true
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      jsonResponse({
        data: expected
      })
    );

    const result = await readServerConsentRecord();
    expect(result).toMatchObject({
      timestamp: '2026-03-09T12:00:00.000Z',
      source: 'preferences_save',
      consent: {
        analytics: true
      }
    });
  });

  it('prefers server record when server timestamp is newer', async () => {
    const localRecord = buildConsentRecord('2026-03-09T10:00:00.000Z', 'banner_reject_all');
    const serverRecord = buildConsentRecord('2026-03-09T12:00:00.000Z', 'preferences_accept_all', {
      analytics: true,
      marketing: true,
      preferences: true
    });
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ data: serverRecord }));

    const resolvedRecord = await syncConsentRecordWithServer(localRecord);
    expect(resolvedRecord).toMatchObject({
      timestamp: '2026-03-09T12:00:00.000Z',
      source: 'preferences_accept_all'
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('writes local record to API when local consent is newer', async () => {
    const localRecord = buildConsentRecord('2026-03-09T12:00:00.000Z', 'preferences_save', {
      analytics: true
    });
    const olderServerRecord = buildConsentRecord('2026-03-09T08:00:00.000Z', 'banner_reject_all');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ data: olderServerRecord }))
      .mockResolvedValueOnce(jsonResponse({ stored: true }));

    const resolvedRecord = await syncConsentRecordWithServer(localRecord);
    expect(resolvedRecord).toMatchObject({
      timestamp: '2026-03-09T12:00:00.000Z',
      source: 'preferences_save'
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/cookies/consent',
      expect.objectContaining({
        method: 'PUT'
      })
    );
  });

  it('does not attempt write when consent API GET is unauthorized', async () => {
    const localRecord = buildConsentRecord('2026-03-09T12:00:00.000Z', 'preferences_save');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 401 }));

    const resolvedRecord = await syncConsentRecordWithServer(localRecord);
    expect(resolvedRecord).toMatchObject({
      timestamp: '2026-03-09T12:00:00.000Z'
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
