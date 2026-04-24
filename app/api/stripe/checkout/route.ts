import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';

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
    enforceRateLimit({ scope: 'stripe_checkout_user', key: user.id, limit: 5, windowSeconds: 15 * 60 }),
    enforceRateLimit({ scope: 'stripe_checkout_ip', key: getClientIp(request), limit: 10, windowSeconds: 15 * 60 }),
  ]);

  // Prefer the new STRIPE_SUPPORTER_PRICE_ID; fall back to the legacy
  // STRIPE_PRO_PRICE_ID so existing deployments don't break.
  const priceId =
    process.env.STRIPE_SUPPORTER_PRICE_ID ?? process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: 'Missing STRIPE_SUPPORTER_PRICE_ID.' },
      { status: 500 }
    );
  }

  try {
    const stripe = getStripeClient();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = subscription?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      customerId = customer.id;

      await supabase.from('subscriptions').upsert(
        {
          user_id: user.id,
          stripe_customer_id: customerId,
          plan: 'free',
          status: 'active'
        },
        { onConflict: 'user_id' }
      );
    }

    const origin = process.env.NEXT_PUBLIC_URL ?? new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${origin}/settings?tab=billing&success=1`,
      cancel_url: `${origin}/settings?tab=billing`,
      subscription_data: {
        metadata: {
          user_id: user.id
        }
      }
    });

    if (!session.url) {
      throw new Error('Stripe checkout URL not returned.');
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
