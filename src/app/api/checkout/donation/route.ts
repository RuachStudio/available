import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Force Node runtime (Stripe requires Node APIs)
export const runtime = "nodejs";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  // Use default API version bundled with the library to avoid type pin mismatches
  return new Stripe(key);
}

function getBaseUrl(req: NextRequest): string {
  const origin = new URL(req.url).origin;
  const envBase = process.env.NEXT_PUBLIC_BASE_URL || "https://www.godscoffeecall.com";

  // Fallback to godscoffeecall.com if unset, placeholder, or invalid
  try {
    const u = new URL(envBase);
    const host = u.hostname.toLowerCase();
    if (host === "godscoffeecall.com" || host.endsWith(".godscoffeecall.com")) {
      return u.origin; // normalize
    }
    return "https://www.godscoffeecall.com";
  } catch {
    return "https://www.godscoffeecall.com";
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse JSON safely
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { amount, name, email, note } =
      (body ?? {}) as { amount?: unknown; name?: string; email?: string; note?: string };

    // Amount validation (accept string or number, dollars → cents)
    const dollars = typeof amount === "string" ? Number(amount) : Number(amount);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    // $1 .. $100k
    const clamped = Math.min(Math.max(dollars, 1), 100000);
    const unitAmount = Math.round(clamped * 100);

    const stripe = getStripe();
    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "donate",
      // Offer a few common options; Stripe will filter by account capability
      payment_method_types: ["card", "link", "cashapp"],
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
      // Use the same param key your Thank You page already reads (`checkout`)
      success_url: `${baseUrl}/thank-you?checkout=success&poll=1`,
      cancel_url: `${baseUrl}/?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Log compact but useful info; don't leak internals to the client
    if (err instanceof Error) {
      console.error("Donation checkout error:", err.message);
    } else {
      console.error("Donation checkout error:", err);
    }
    return NextResponse.json({ error: "Unable to create donation session" }, { status: 500 });
  }
}