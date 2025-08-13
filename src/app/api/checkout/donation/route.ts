import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Force Node runtime (Stripe requires Node APIs)
export const runtime = "nodejs";
// (Stripe UI hint) we'll use submit_type: 'donate' in the session

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

export async function POST(req: NextRequest) {
  try {
    const { amount, name, email, note } = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;

    const dollars = Number(amount);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const stripe = getStripe();
    const unitAmount = Math.round(Math.min(Math.max(dollars, 1), 100000) * 100); // $1 to $100k

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "donate",
      billing_address_collection: "auto",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: {
              name: "AVAILABLE Donation",
              description: note ? String(note).slice(0, 250) : undefined,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      metadata: {
        donor_name: name || "",
        donor_email: email || "",
        note: note || "",
        source: "donation-form",
      },
      success_url: `${baseUrl}/thank-you?donation=success`,
      cancel_url: `${baseUrl}/donate?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Donation checkout error:", err.message, err.stack);
    } else {
      console.error("Donation checkout error:", err);
    }
    return NextResponse.json({ error: "Unable to create donation session" }, { status: 500 });
  }
}