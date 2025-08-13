import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// set this to your Stripe Price ID for the tee
const TEE_PRICE_ID = process.env.STRIPE_TEE_PRICE_ID!;

export async function POST(req: NextRequest) {
  try {
    const { shirts, contact } = await req.json();
    // shirts: [{ size: "M", attendeeName: "Jordan" }, ...]

    const lineItems = shirts.map(() => ({
      price: TEE_PRICE_ID,
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      // optional: pass sizes/names as metadata for fulfillment
      metadata: {
        contact_name: contact?.name || "",
        contact_email: contact?.email || "",
        contact_phone: contact?.phone || "",
        shirts: JSON.stringify(shirts),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/thank-you?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/register?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Stripe session error", err);
    return NextResponse.json({ error: "Unable to create checkout session" }, { status: 500 });
  }
}