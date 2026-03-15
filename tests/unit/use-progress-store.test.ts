import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_DEPLOYED_NODE_IDS } from '@/lib/energy';
import { createPayloadRequestKey } from '@/lib/api/requestKeys';
import { useProgressStore } from '@/lib/stores/useProgressStore';

const defaultTopicProgress = {
  pyspark: { correct: 0, total: 0, lastAttempted: null },
  fabric: { correct: 0, total: 0, lastAttempted: null }
} as const;

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

describe('useProgressStore.saveProgress', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.clear();
    useProgressStore.getState().resetProgress();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a stable idempotency key for sync-progress writes', async () => {
    const requestBody = {
      xp: 240,
      streak: 5,
      completedQuestions: ['q-1', 'q-2'],
      deployedNodeIds: [...DEFAULT_DEPLOYED_NODE_IDS],
      lastDeployedNodeId: DEFAULT_DEPLOYED_NODE_IDS[0] ?? null,
      topicProgress: {
        ...defaultTopicProgress,
        pyspark: {
          correct: 3,
          total: 4,
          lastAttempted: '2026-03-15T10:00:00.000Z'
        }
      }
    };

    useProgressStore.setState(requestBody);

    await useProgressStore.getState().saveProgress();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/auth/sync-progress');
    expect(init.method).toBe('POST');
    expect(String(init.body)).toBe(JSON.stringify(requestBody));
    expect(new Headers(init.headers).get('Idempotency-Key')).toBe(
      createPayloadRequestKey('sync_progress', requestBody)
    );
  });
});
