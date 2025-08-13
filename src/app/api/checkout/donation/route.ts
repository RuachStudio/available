import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Do NOT export this
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Stripe uses Node APIs – not Edge:
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { shirts, contact } = await req.json();
    // shirts: [{ size: string, attendeeName: string }]

    // If you use one price for all sizes:
    const priceId = process.env.STRIPE_TEE_PRICE_ID!;
    const line_items = (shirts as Array<{ size: string; attendeeName: string }>).map(() => ({
      price: priceId,
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      metadata: {
        contact_name: contact?.name || "",
        contact_email: contact?.email || "",
        contact_phone: contact?.phone || "",
        shirts: JSON.stringify(shirts ?? []),
        source: "shirt-checkout",
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/thank-you?shirts=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/register?shirts=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Shirt checkout error:", err.message, err.stack);
    } else {
      console.error("Shirt checkout error:", err);
    }
    return NextResponse.json({ error: "Unable to create checkout session" }, { status: 500 });
  }
}