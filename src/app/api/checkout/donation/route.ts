import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { amount, name, email, note } = await req.json();

    // Validate: amount in dollars -> convert to cents
    const dollars = Number(amount);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const unitAmount = Math.round(dollars * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // One-off dynamic amount using price_data
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
      // Collect email if you want receipts
      customer_email: email || undefined,
      // Attach metadata for your records/webhooks
      metadata: {
        donor_name: name || "",
        donor_email: email || "",
        note: note || "",
        source: "donation-form",
      },
      // Optional: allow promo codes (usually not for donations, so false)
      allow_promotion_codes: false,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/thank-you?donation=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/donate?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Donation checkout error:", err);
    return NextResponse.json({ error: "Unable to create donation session" }, { status: 500 });
  }
}