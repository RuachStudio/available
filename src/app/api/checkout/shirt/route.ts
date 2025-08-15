import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

// You may set either STRIPE_TEE_PRICE_ID (e.g., "price_...") or STRIPE_TEE_PRICE_CENTS (e.g., "2500")
const TEE_PRICE_ID = process.env.STRIPE_TEE_PRICE_ID;
const TEE_PRICE_CENTS = process.env.STRIPE_TEE_PRICE_CENTS;

export async function POST(req: NextRequest) {
  if (!TEE_PRICE_ID && !TEE_PRICE_CENTS) {
    return NextResponse.json(
      { error: "Missing STRIPE_TEE_PRICE_ID or STRIPE_TEE_PRICE_CENTS in environment" },
      { status: 400 }
    );
  }

  let shirts = [{ size: "M", attendeeName: "Jordan" }];
  let contact: { name?: string; email?: string; phone?: string } = {};

  try {
    const body = await req.json();
    shirts = body.shirts ?? [{ size: "M", attendeeName: "Jordan" }];
    contact = body.contact ?? {};
  } catch {
    // if JSON parsing fails, default to one shirt
    shirts = [{ size: "M", attendeeName: "Jordan" }];
    contact = {};
  }

  const stripe = getStripe();

  const quantity = Math.max(1, shirts?.length ?? 1);

  const looksLikePriceId = TEE_PRICE_ID?.startsWith("price_") ?? false;
  const unitAmount = Number.isFinite(Number(TEE_PRICE_CENTS)) ? Number(TEE_PRICE_CENTS) : 2500; // $25 default

  const lineItems = [
    looksLikePriceId
      ? {
          price: TEE_PRICE_ID as string,
          quantity,
          adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
        }
      : {
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: { name: "AVAILABLE Tee" },
          },
          quantity,
          adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
        },
  ];

  const envBase = process.env.NEXT_PUBLIC_BASE_URL;
  const origin = new URL(req.url).origin;
  const baseUrl = !envBase || /(^|\.)your-domain\.com$/i.test(new URL(envBase).hostname)
    ? origin
    : envBase;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "pay",
      customer_email: contact?.email || undefined,
      customer_creation: "always",
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      phone_number_collection: { enabled: true },
      line_items: lineItems,
      metadata: {
        contact_name: contact?.name || "",
        contact_email: contact?.email || "",
        contact_phone: contact?.phone || "",
        shirts: JSON.stringify(shirts),
      },
      success_url: `${baseUrl}/thank-you?checkout=success&poll=1`,
      cancel_url: `${baseUrl}/register?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Stripe session error", err);
    return NextResponse.json({ error: "Unable to create checkout session" }, { status: 500 });
  }
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key);
}