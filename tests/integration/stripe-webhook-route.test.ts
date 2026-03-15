import { beforeEach, describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';

const { createSupabaseClientMock, constructEventMock } = vi.hoisted(() => ({
  createSupabaseClientMock: vi.fn(),
  constructEventMock: vi.fn()
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: createSupabaseClientMock
}));

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: constructEventMock
    }
  }))
}));

interface StripeWebhookEventRow {
  event_id: string;
  event_type: string;
  customer_id: string | null;
  subscription_id: string | null;
  status: 'processing' | 'processed' | 'skipped' | 'failed';
  skip_reason: string | null;
  error_message: string | null;
  event_created_at: string;
  processed_at: string | null;
}

interface SubscriptionRow {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_sub_id: string | null;
  plan: string;
  status: string;
  current_period_end: string | null;
  stripe_last_event_id: string | null;
  stripe_last_event_created_at: string | null;
  updated_at: string;
}

interface MockState {
  eventsById: Map<string, StripeWebhookEventRow>;
  subscriptionsByUserId: Map<string, SubscriptionRow>;
  userIdByCustomerId: Map<string, string>;
  calls: {
    eventInsert: number;
    eventUpdate: number;
    subscriptionUpsert: number;
    subscriptionUpdate: number;
  };
}

const makeInitialState = (): MockState => ({
  eventsById: new Map(),
  subscriptionsByUserId: new Map(),
  userIdByCustomerId: new Map(),
  calls: {
    eventInsert: 0,
    eventUpdate: 0,
    subscriptionUpsert: 0,
    subscriptionUpdate: 0
  }
});

const makeAdminClient = (state: MockState) => ({
  from: vi.fn((table: string) => {
    if (table === 'stripe_webhook_events') {
      return {
        insert: vi.fn(async (payload: Omit<StripeWebhookEventRow, 'skip_reason' | 'error_message' | 'processed_at'>) => {
          state.calls.eventInsert += 1;
          if (state.eventsById.has(payload.event_id)) {
            return {
              error: {
                code: '23505',
                message: 'duplicate key value violates unique constraint "stripe_webhook_events_event_id_key"'
              }
            };
          }

          state.eventsById.set(payload.event_id, {
            ...payload,
            skip_reason: null,
            error_message: null,
            processed_at: null
          });

          return { error: null };
        }),
        update: vi.fn((updates: Partial<StripeWebhookEventRow>) => ({
          eq: vi.fn(async (_column: string, eventId: string) => {
            state.calls.eventUpdate += 1;
            const existing = state.eventsById.get(eventId);
            if (!existing) {
              return { error: { message: `Event ${eventId} not found.` } };
            }

            state.eventsById.set(eventId, {
              ...existing,
              ...updates
            });
            return { error: null };
          })
        }))
      };
    }

    if (table === 'subscriptions') {
      return {
        select: vi.fn((columns: string) => {
          if (columns === 'user_id') {
            return {
              eq: vi.fn((_column: string, customerId: string) => ({
                maybeSingle: vi.fn(async () => {
                  const userId = state.userIdByCustomerId.get(customerId) ?? null;
                  return {
                    data: userId ? { user_id: userId } : null,
                    error: null
                  };
                })
              }))
            };
          }

          if (columns === 'stripe_last_event_created_at') {
            return {
              eq: vi.fn((_column: string, userId: string) => ({
                maybeSingle: vi.fn(async () => {
                  const row = state.subscriptionsByUserId.get(userId) ?? null;
                  return {
                    data: row
                      ? {
                          stripe_last_event_created_at: row.stripe_last_event_created_at
                        }
                      : null,
                    error: null
                  };
                })
              }))
            };
          }

          throw new Error(`Unexpected select columns for subscriptions: ${columns}`);
        }),
        upsert: vi.fn(async (payload: Partial<SubscriptionRow> & { user_id: string }) => {
          state.calls.subscriptionUpsert += 1;
          const existing = state.subscriptionsByUserId.get(payload.user_id);
          const merged: SubscriptionRow = {
            user_id: payload.user_id,
            stripe_customer_id: payload.stripe_customer_id ?? existing?.stripe_customer_id ?? null,
            stripe_sub_id: payload.stripe_sub_id ?? existing?.stripe_sub_id ?? null,
            plan: payload.plan ?? existing?.plan ?? 'free',
            status: payload.status ?? existing?.status ?? 'active',
            current_period_end:
              payload.current_period_end ?? existing?.current_period_end ?? null,
            stripe_last_event_id:
              payload.stripe_last_event_id ?? existing?.stripe_last_event_id ?? null,
            stripe_last_event_created_at:
              payload.stripe_last_event_created_at ??
              existing?.stripe_last_event_created_at ??
              null,
            updated_at: payload.updated_at ?? existing?.updated_at ?? new Date().toISOString()
          };

          state.subscriptionsByUserId.set(payload.user_id, merged);
          if (merged.stripe_customer_id) {
            state.userIdByCustomerId.set(merged.stripe_customer_id, payload.user_id);
          }

          return { error: null };
        }),
        update: vi.fn((payload: Partial<SubscriptionRow>) => ({
          eq: vi.fn(async (_column: string, userId: string) => {
            state.calls.subscriptionUpdate += 1;
            const existing = state.subscriptionsByUserId.get(userId);
            if (!existing) {
              return { error: null };
            }

            const merged = {
              ...existing,
              ...payload
            };
            state.subscriptionsByUserId.set(userId, merged);
            if (merged.stripe_customer_id) {
              state.userIdByCustomerId.set(merged.stripe_customer_id, userId);
            }

            return { error: null };
          })
        }))
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  })
});

const makeSubscriptionEvent = ({
  id,
  type = 'customer.subscription.updated',
  createdAtIso,
  userId = 'user-1',
  customerId = 'cus_1',
  subscriptionId = 'sub_1',
  status = 'active'
}: {
  id: string;
  type?: 'customer.subscription.created' | 'customer.subscription.updated' | 'customer.subscription.deleted';
  createdAtIso: string;
  userId?: string;
  customerId?: string;
  subscriptionId?: string;
  status?: Stripe.Subscription.Status;
}) =>
  ({
    id,
    type,
    created: Math.floor(Date.parse(createdAtIso) / 1000),
    data: {
      object: {
        id: subscriptionId,
        customer: customerId,
        metadata: {
          user_id: userId
        },
        status,
        items: {
          data: [
            {
              current_period_end: Math.floor(Date.parse('2026-04-01T00:00:00.000Z') / 1000)
            }
          ]
        }
      }
    }
  }) as unknown as Stripe.Event;

const postWebhook = async () => {
  const { POST } = await import('@/app/api/stripe/webhook/route');
  return POST(
    new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=123,v1=abc'
      },
      body: '{}'
    })
  );
};

describe('stripe webhook route', () => {
  beforeEach(() => {
    vi.resetModules();
    createSupabaseClientMock.mockReset();
    constructEventMock.mockReset();

    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_key';
  });

  it('returns success without reprocessing duplicate events', async () => {
    const state = makeInitialState();
    state.eventsById.set('evt_dup_1', {
      event_id: 'evt_dup_1',
      event_type: 'customer.subscription.updated',
      customer_id: 'cus_1',
      subscription_id: 'sub_1',
      status: 'processed',
      skip_reason: null,
      error_message: null,
      event_created_at: '2026-03-15T10:00:00.000Z',
      processed_at: '2026-03-15T10:00:02.000Z'
    });

    createSupabaseClientMock.mockImplementation(() => makeAdminClient(state));
    constructEventMock.mockReturnValue(
      makeSubscriptionEvent({
        id: 'evt_dup_1',
        createdAtIso: '2026-03-15T10:00:00.000Z'
      })
    );

    const response = await postWebhook();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(state.calls.subscriptionUpsert).toBe(0);
    expect(state.calls.subscriptionUpdate).toBe(0);
    expect(state.eventsById.get('evt_dup_1')?.status).toBe('processed');
  });

  it('skips stale events when a newer event already exists on subscription state', async () => {
    const state = makeInitialState();
    state.subscriptionsByUserId.set('user-1', {
      user_id: 'user-1',
      stripe_customer_id: 'cus_1',
      stripe_sub_id: 'sub_1',
      plan: 'pro',
      status: 'active',
      current_period_end: '2026-04-01T00:00:00.000Z',
      stripe_last_event_id: 'evt_newer',
      stripe_last_event_created_at: '2026-03-15T11:00:00.000Z',
      updated_at: '2026-03-15T11:00:01.000Z'
    });
    state.userIdByCustomerId.set('cus_1', 'user-1');

    createSupabaseClientMock.mockImplementation(() => makeAdminClient(state));
    constructEventMock.mockReturnValue(
      makeSubscriptionEvent({
        id: 'evt_older',
        createdAtIso: '2026-03-15T10:30:00.000Z',
        status: 'canceled'
      })
    );

    const response = await postWebhook();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });

    const subscription = state.subscriptionsByUserId.get('user-1');
    expect(subscription?.plan).toBe('pro');
    expect(subscription?.status).toBe('active');
    expect(state.calls.subscriptionUpsert).toBe(0);

    const eventLog = state.eventsById.get('evt_older');
    expect(eventLog?.status).toBe('skipped');
    expect(eventLog?.skip_reason).toBe('Stale subscription event.');
  });

  it('applies fresh subscription updates and records ordering metadata', async () => {
    const state = makeInitialState();
    state.subscriptionsByUserId.set('user-1', {
      user_id: 'user-1',
      stripe_customer_id: 'cus_1',
      stripe_sub_id: 'sub_1',
      plan: 'free',
      status: 'cancelled',
      current_period_end: null,
      stripe_last_event_id: 'evt_old',
      stripe_last_event_created_at: '2026-03-15T09:00:00.000Z',
      updated_at: '2026-03-15T09:00:00.000Z'
    });
    state.userIdByCustomerId.set('cus_1', 'user-1');

    createSupabaseClientMock.mockImplementation(() => makeAdminClient(state));
    constructEventMock.mockReturnValue(
      makeSubscriptionEvent({
        id: 'evt_new',
        createdAtIso: '2026-03-15T10:00:00.000Z',
        status: 'active'
      })
    );

    const response = await postWebhook();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });

    const subscription = state.subscriptionsByUserId.get('user-1');
    expect(subscription?.plan).toBe('pro');
    expect(subscription?.status).toBe('active');
    expect(subscription?.stripe_last_event_id).toBe('evt_new');
    expect(subscription?.stripe_last_event_created_at).toBe('2026-03-15T10:00:00.000Z');

    const eventLog = state.eventsById.get('evt_new');
    expect(eventLog?.status).toBe('processed');
    expect(eventLog?.processed_at).toBeTruthy();
  });
});
