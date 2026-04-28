import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' });

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      metadata: { userId },
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'MedVibe Premium',
              description: 'Пълен достъп — AI обяснения, неограничени въпроси, симулация на изпит',
              images: [],
            },
            unit_amount: 900, // €9.00
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/profile?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
