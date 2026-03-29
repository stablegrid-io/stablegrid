import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const runtime = 'nodejs';

type WebhookEventStatus = 'processed' | 'skipped' | 'failed';

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY.');
  }

  return new Stripe(secretKey);
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration.');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey);
}

type AdminClient = ReturnType<typeof getAdminClient>;

async function getUserIdFromCustomer(
  admin: AdminClient,
  customerId: string
): Promise<string | null> {
  const { data } = await admin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  return data?.user_id ?? null;
}

const getEventCreatedAtIso = (event: Stripe.Event) =>
  new Date(event.created * 1000).toISOString();

const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === '23505';

const getSubscriptionIdentifiers = (subscription: Stripe.Subscription) => {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id ?? null;

  return {
    customerId,
    subscriptionId: subscription.id
  };
};

async function beginWebhookEventProcessing(
  admin: AdminClient,
  event: Stripe.Event,
  customerId: string | null,
  subscriptionId: string | null
) {
  const { error } = await admin.from('stripe_webhook_events').insert({
    event_id: event.id,
    event_type: event.type,
    customer_id: customerId,
    subscription_id: subscriptionId,
    status: 'processing',
    event_created_at: getEventCreatedAtIso(event)
  });

  if (error && isUniqueViolation(error)) {
    return { duplicate: true as const };
  }

  if (error) {
    throw new Error(error.message);
  }

  return { duplicate: false as const };
}

async function finishWebhookEventProcessing(
  admin: AdminClient,
  eventId: string,
  status: WebhookEventStatus,
  options?: { skipReason?: string | null; errorMessage?: string | null }
) {
  const { error } = await admin
    .from('stripe_webhook_events')
    .update({
      status,
      skip_reason: options?.skipReason ?? null,
      error_message: options?.errorMessage ?? null,
      processed_at: new Date().toISOString()
    })
    .eq('event_id', eventId);

  if (error) {
    throw new Error(error.message);
  }
}

async function isStaleSubscriptionEvent(
  admin: AdminClient,
  userId: string,
  incomingCreatedAtIso: string
) {
  const { data, error } = await admin
    .from('subscriptions')
    .select('stripe_last_event_created_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const previousCreatedAt = data?.stripe_last_event_created_at;
  if (!previousCreatedAt) {
    return false;
  }

  const previousMs = Date.parse(previousCreatedAt);
  const incomingMs = Date.parse(incomingCreatedAtIso);
  if (!Number.isFinite(previousMs) || !Number.isFinite(incomingMs)) {
    return false;
  }

  return incomingMs < previousMs;
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing webhook signature/secret.' }, { status: 400 });
  }

  const stripe = getStripeClient();
  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook signature verification failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = getAdminClient();
  const eventCreatedAtIso = getEventCreatedAtIso(event);
  const shouldProcessSubscriptionEvent =
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted';

  let customerId: string | null = null;
  let subscriptionId: string | null = null;
  if (shouldProcessSubscriptionEvent) {
    const subscription = event.data.object as Stripe.Subscription;
    const identifiers = getSubscriptionIdentifiers(subscription);
    customerId = identifiers.customerId;
    subscriptionId = identifiers.subscriptionId;
  }

  try {
    const beginResult = await beginWebhookEventProcessing(
      admin,
      event,
      customerId,
      subscriptionId
    );

    if (beginResult.duplicate) {
      return NextResponse.json({ received: true });
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const currentCustomerId = getSubscriptionIdentifiers(subscription).customerId;

      if (!currentCustomerId) {
        await finishWebhookEventProcessing(admin, event.id, 'skipped', {
          skipReason: 'Missing Stripe customer id.'
        });
        return NextResponse.json({ received: true });
      }

      // Always resolve user from our database mapping, never trust metadata alone
      const userId = await getUserIdFromCustomer(admin, currentCustomerId);

      if (!userId) {
        await finishWebhookEventProcessing(admin, event.id, 'skipped', {
          skipReason: 'No user mapping for Stripe customer.'
        });
        return NextResponse.json({ received: true });
      }

      const stale = await isStaleSubscriptionEvent(admin, userId, eventCreatedAtIso);
      if (stale) {
        await finishWebhookEventProcessing(admin, event.id, 'skipped', {
          skipReason: 'Stale subscription event.'
        });
        return NextResponse.json({ received: true });
      }

      const status = subscription.status;
      const isPaid = status === 'active' || status === 'trialing' || status === 'past_due';
      const currentPeriodEnd = subscription.items.data[0]?.current_period_end ?? null;
      const { error } = await admin.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: currentCustomerId,
          stripe_sub_id: subscription.id,
          plan: isPaid ? 'pro' : 'free',
          status,
          current_period_end: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null,
          stripe_last_event_id: event.id,
          stripe_last_event_created_at: eventCreatedAtIso,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        throw new Error(error.message);
      }

      await finishWebhookEventProcessing(admin, event.id, 'processed');
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const currentCustomerId = getSubscriptionIdentifiers(subscription).customerId;
      if (!currentCustomerId) {
        await finishWebhookEventProcessing(admin, event.id, 'skipped', {
          skipReason: 'Missing Stripe customer id.'
        });
        return NextResponse.json({ received: true });
      }

      const userId =
        subscription.metadata?.user_id ??
        (await getUserIdFromCustomer(admin, currentCustomerId));

      if (userId) {
        const stale = await isStaleSubscriptionEvent(admin, userId, eventCreatedAtIso);
        if (stale) {
          await finishWebhookEventProcessing(admin, event.id, 'skipped', {
            skipReason: 'Stale subscription event.'
          });
          return NextResponse.json({ received: true });
        }

        const { error } = await admin
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'cancelled',
            stripe_sub_id: null,
            current_period_end: null,
            stripe_last_event_id: event.id,
            stripe_last_event_created_at: eventCreatedAtIso,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) {
          throw new Error(error.message);
        }

        await finishWebhookEventProcessing(admin, event.id, 'processed');
      } else {
        await finishWebhookEventProcessing(admin, event.id, 'skipped', {
          skipReason: 'No user mapping for Stripe customer.'
        });
      }
    }

    if (
      event.type !== 'customer.subscription.created' &&
      event.type !== 'customer.subscription.updated' &&
      event.type !== 'customer.subscription.deleted'
    ) {
      await finishWebhookEventProcessing(admin, event.id, 'skipped', {
        skipReason: `Unhandled Stripe event type: ${event.type}`
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed.';
    try {
      await finishWebhookEventProcessing(admin, event.id, 'failed', {
        errorMessage: message
      });
    } catch {
      // Best-effort failure audit; primary error response below.
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
