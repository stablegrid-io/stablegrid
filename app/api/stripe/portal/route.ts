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
    enforceRateLimit({ scope: 'stripe_portal_user', key: user.id, limit: 10, windowSeconds: 900 }),
    enforceRateLimit({ scope: 'stripe_portal_ip', key: getClientIp(request), limit: 20, windowSeconds: 900 }),
  ]);

  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found.' }, { status: 404 });
    }

    const stripe = getStripeClient();
    const origin = process.env.NEXT_PUBLIC_URL ?? new URL(request.url).origin;

    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/settings?tab=billing`
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to open portal.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
