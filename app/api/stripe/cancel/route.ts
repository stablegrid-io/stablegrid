import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import { createClient } from '@/lib/supabase/server';

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY.');
  }

  return new Stripe(secretKey);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await Promise.all([
    enforceRateLimit({ scope: 'stripe_cancel_user', key: user.id, limit: 5, windowSeconds: 900 }),
    enforceRateLimit({ scope: 'stripe_cancel_ip', key: getClientIp(request), limit: 10, windowSeconds: 900 }),
  ]);

  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_sub_id, stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (subscription?.stripe_sub_id) {
      const stripe = getStripeClient();
      await stripe.subscriptions.cancel(subscription.stripe_sub_id);
    }

    await supabase
      .from('subscriptions')
      .update({
        plan: 'free',
        status: 'cancelled',
        current_period_end: null,
        stripe_sub_id: null
      })
      .eq('user_id', user.id);

    return NextResponse.json({ cancelled: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to cancel subscription.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
