// app/api/checkout/donation/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2025-07-30.basil" });
}

function getBaseUrl(req: NextRequest): string {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL;
  if (envBase) {
    try { return new URL(envBase).origin; } catch {}
  }
  const origin = req.headers.get("origin") ?? "";
  try {
    const u = new URL(origin);
    const host = u.hostname.toLowerCase();
    if (host === "www.godscoffeecall.com" || host === "godscoffeecall.com") return u.origin;
  } catch {}
  return "https://www.godscoffeecall.com";
}

function parseAmountToCents(amount: unknown): number | null {
  // allow "1,234.56"
  const raw = typeof amount === "string" ? amount.replace(/,/g, "") : amount;
  const dollars = Number(raw);
  if (!Number.isFinite(dollars) || dollars <= 0) return null;
  const clamped = Math.min(Math.max(dollars, 1), 100_000); // $1 – $100k
  const cents = Math.round(clamped * 100);
  return cents >= 50 ? cents : null; // Stripe USD min ~ $0.50
}

// decide if we should fallback to card-only
function shouldFallbackToCardOnly(err: unknown): boolean {
  const e = err as { type?: string; code?: string; param?: string; message?: string };
  if (!e) return false;
  if (e.param === "automatic_payment_methods") return true;
  if (e.code === "parameter_unknown" || e.code === "parameter_invalid_empty") return true;
  if (e.type === "invalid_request_error" && e.message?.toLowerCase().includes("automatic_payment_methods")) return true;
  if (e.message?.toLowerCase().includes("payment method type") && e.message?.toLowerCase().includes("invalid")) return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // Optional: simple origin allow-list (defense-in-depth)
    const origin = req.headers.get("origin");
    if (origin) {
      try {
        const host = new URL(origin).hostname.toLowerCase();
        if (host !== "www.godscoffeecall.com" && host !== "godscoffeecall.com") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } catch {/* ignore */}
    }

    let body: unknown;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

    // normalize inputs
    const { amount, name, email, note } =
      (body ?? {}) as { amount?: unknown; name?: string; email?: string; note?: string };
    const unitAmount = parseAmountToCents(amount);
    if (unitAmount == null) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    const donorName = (name ?? "").toString().trim().slice(0, 120);
    const donorEmail = (email ?? "").toString().trim().slice(0, 254) || undefined;
    const desc = note ? String(note).slice(0, 250) : undefined;

    const stripe = getStripe();
    const baseUrl = getBaseUrl(req);

    type SessionParams = Stripe.Checkout.SessionCreateParams;
    const commonParams: SessionParams = {
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
              description: desc,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: donorEmail,
      metadata: {
        donor_name: donorName,
        donor_email: donorEmail ?? "",
        note: desc ?? "",
        source: "donation-form",
      },
      // include session id for thank-you page fetch
      success_url: `${baseUrl}/thank-you?checkout=success&sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?checkout=cancel`,
    };

    // Idempotency for retries / double-clicks
    const idemKey =
      req.headers.get("x-idempotency-key") ||
      `donation:${Date.now()}:${Math.random().toString(36).slice(2)}`;

    let session: Stripe.Response<Stripe.Checkout.Session>;
    try {
      session = await stripe.checkout.sessions.create(
        { ...commonParams, automatic_payment_methods: { enabled: true } } as SessionParams,
        { idempotencyKey: idemKey }
      );
    } catch (err) {
      if (!shouldFallbackToCardOnly(err)) {
        console.error("Checkout (AMM) failed:", err);
        return NextResponse.json({ error: "Unable to create donation session" }, { status: 500 });
      }
      console.warn("AMM unsupported; retrying with card only.");
      session = await stripe.checkout.sessions.create(
        { ...commonParams, payment_method_types: ["card"] } as SessionParams,
        { idempotencyKey: idemKey }
      );
    }

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("Donation checkout error:", err);
    return NextResponse.json({ error: "Unable to create donation session" }, { status: 500 });
  }
}