// app/api/checkout/donation/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Force Node runtime for Stripe SDK
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2025-07-30.basil" });
}

function getBaseUrl(): string {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL || "https://www.godscoffeecall.com";
  try {
    const u = new URL(envBase);
    const host = u.hostname.toLowerCase();
    if (host === "godscoffeecall.com" || host.endsWith(".godscoffeecall.com")) {
      return u.origin;
    }
    return "https://www.godscoffeecall.com";
  } catch {
    return "https://www.godscoffeecall.com";
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { amount, name, email, note } =
      (body ?? {}) as { amount?: unknown; name?: string; email?: string; note?: string };

    // Parse amount (accept string/number, convert dollars → cents)
    const dollars = typeof amount === "string" ? Number(amount) : Number(amount);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const clamped = Math.min(Math.max(dollars, 1), 100000); // $1 – $100k
    const unitAmount = Math.round(clamped * 100);

    const stripe = getStripe();
    const baseUrl = getBaseUrl();
    type SessionParams = Stripe.Checkout.SessionCreateParams;

    // Build common session parameters to reuse across attempts
    const commonParams = {
      mode: "payment" as const,
      submit_type: "donate" as const,
      billing_address_collection: "auto" as const,
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
      success_url: `${baseUrl}/thank-you?checkout=success&poll=1`,
      cancel_url: `${baseUrl}/?checkout=cancel`,
    };

    let session;
    try {
      // First attempt: let Stripe select available methods automatically
      session = await stripe.checkout.sessions.create({
        ...commonParams,
        automatic_payment_methods: { enabled: true },
      } as SessionParams);
    } catch (e) {
      // If automatic payment methods fail for any reason, retry with card-only
      console.warn(
        "automatic_payment_methods failed; retrying with card only:",
        e instanceof Error ? e.message : e
      );
      session = await stripe.checkout.sessions.create({
        ...commonParams,
        payment_method_types: ["card"],
      } as SessionParams);
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Donation checkout error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Unable to create donation session" },
      { status: 500 }
    );
  }
}