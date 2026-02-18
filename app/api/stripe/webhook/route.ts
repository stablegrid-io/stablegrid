import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const runtime = 'nodejs';

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

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const admin = getAdminClient();
  const { data } = await admin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  return data?.user_id ?? null;
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing webhook signature/secret.' }, { status: 400 });
  }

  try {
    const stripe = getStripeClient();
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const metadataUserId = subscription.metadata?.user_id ?? null;
      const userId = metadataUserId ?? (await getUserIdFromCustomer(customerId));

      if (!userId) {
        return NextResponse.json({ received: true });
      }

      const admin = getAdminClient();
      const status = subscription.status;
      const isPaid = status === 'active' || status === 'trialing' || status === 'past_due';
      const currentPeriodEnd = subscription.items.data[0]?.current_period_end ?? null;

      await admin.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_sub_id: subscription.id,
          plan: isPaid ? 'pro' : 'free',
          status,
          current_period_end: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const userId =
        subscription.metadata?.user_id ??
        (await getUserIdFromCustomer(customerId));

      if (userId) {
        const admin = getAdminClient();
        await admin
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'cancelled',
            stripe_sub_id: null,
            current_period_end: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
