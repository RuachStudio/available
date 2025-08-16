// src/app/api/checkout/shirt/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

/** Normalize a size string into XS/S/M/L/XL/2XL/3XL; otherwise null */
function normalizeSize(x?: string | null): string | null {
  if (!x) return null;
  const v = String(x).trim().toUpperCase();
  switch (v) {
    case "XS":
    case "S":
    case "M":
    case "L":
    case "XL":
    case "2XL":
    case "3XL":
      return v;
    default:
      return null;
  }
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

/** Prefer env; else infer from request headers; never return localhost in prod. */
function getBaseUrl(req: NextRequest): string {
  const canonical = "https://www.godscoffeecall.com";
  const envBase = process.env.NEXT_PUBLIC_BASE_URL;
  const isProd =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

  // 1) Env (if valid and not localhost in prod)
  if (envBase) {
    try {
      const u = new URL(envBase);
      const host = u.hostname.toLowerCase();
      const isLocal = host === "localhost" || host === "127.0.0.1";
      if (host === "godscoffeecall.com" || host.endsWith(".godscoffeecall.com")) {
        return canonical;
      }
      if (!(isProd && isLocal)) return u.origin;
    } catch {
      /* fall through */
    }
  }

  // 2) Infer from request headers
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "www.godscoffeecall.com";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  try {
    const origin = `${proto}://${host}`;
    const u = new URL(origin);
    const isLocal = u.hostname === "localhost" || u.hostname === "127.0.0.1";
    if (!(isProd && isLocal)) return u.origin;
  } catch {
    /* fall through */
  }

  // 3) Canonical fallback
  return canonical;
}

/**
 * Get a safe, public absolute image URL for Stripe.
 * - We REQUIRE STRIPE_TEE_IMAGE_URL to be an absolute https URL.
 * - If it's missing/invalid, we return `null` and omit images entirely (avoids broken icon).
 */
function getStripeImageUrl(): string | null {
  const envUrl = process.env.STRIPE_TEE_IMAGE_URL;
  if (!envUrl) return null;
  try {
    const u = new URL(envUrl);
    if (u.protocol !== "https:") return null; // require https for Stripe fetch
    return u.toString();
  } catch {
    return null;
  }
}

// Optional: if you later choose to maintain a price per size in Stripe,
// set STRIPE_PRICE_ID_XS, STRIPE_PRICE_ID_S, ... in env and this map will be used.
const PRICE_BY_SIZE: Partial<Record<string, string>> = {
  XS: process.env.STRIPE_PRICE_ID_XS,
  S: process.env.STRIPE_PRICE_ID_S,
  M: process.env.STRIPE_PRICE_ID_M,
  L: process.env.STRIPE_PRICE_ID_L,
  XL: process.env.STRIPE_PRICE_ID_XL,
  "2XL": process.env.STRIPE_PRICE_ID_2XL,
  "3XL": process.env.STRIPE_PRICE_ID_3XL,
};

function hasAnySizePriceIds(): boolean {
  return Object.values(PRICE_BY_SIZE).some(Boolean);
}

// Either use one saved price (no size in the name) or inline price_data per size.
const TEE_PRICE_ID = process.env.STRIPE_TEE_PRICE_ID;        // e.g. "price_..."
const TEE_PRICE_CENTS = process.env.STRIPE_TEE_PRICE_CENTS;  // e.g. "2000"

export async function POST(req: NextRequest) {
  // Require at least one of these so we have a price
  if (!TEE_PRICE_ID && !TEE_PRICE_CENTS) {
    return NextResponse.json(
      { error: "Missing STRIPE_TEE_PRICE_ID or STRIPE_TEE_PRICE_CENTS in environment" },
      { status: 400 }
    );
  }

  type Shirt = { size?: string; attendeeName?: string };
  type Contact = { name?: string; email?: string; phone?: string };

  let shirts: Shirt[] = [];
  let contact: Contact = {};
  let registrationId: string | undefined;
  let primaryShirtSize: string | undefined;

  try {
    const body = await req.json();
    shirts = Array.isArray(body?.shirts) ? body.shirts : [];
    contact = body?.contact ?? {};
    registrationId = body?.registrationId;
    primaryShirtSize = body?.primaryShirtSize;
  } catch {
    // ignore parse errors; we’ll default below
  }

  if (shirts.length === 0) {
    const n = normalizeSize(primaryShirtSize) ?? "M";
    shirts = [{ size: n, attendeeName: contact?.name || "" }];
  }

  const normalizedShirts =
    (shirts
      .map((s) => ({
        attendeeName: (s?.attendeeName || "").trim(),
        size: normalizeSize(s?.size) ?? "M",
      }))
      .filter(Boolean)) || [{ size: "M", attendeeName: "" }];

  // Group by size so we can show sizes as separate lines
  const sizeCounts: Record<string, number> = {};
  for (const s of normalizedShirts) {
    const key = s.size!;
    sizeCounts[key] = (sizeCounts[key] || 0) + 1;
  }

  const stripe = getStripe();
  const baseUrl = getBaseUrl(req);
  const imageUrl = getStripeImageUrl(); // may be null

  const unitAmount =
    Number.isFinite(Number(TEE_PRICE_CENTS)) && Number(TEE_PRICE_CENTS) > 0
      ? Number(TEE_PRICE_CENTS)
      : 2000; // default $20

  const looksLikeSingleSavedPrice = TEE_PRICE_ID?.startsWith("price_") ?? false;

  let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  if (looksLikeSingleSavedPrice && !hasAnySizePriceIds()) {
    const totalQty = Object.values(sizeCounts).reduce((a, b) => a + b, 0);
    lineItems = [
      {
        price: TEE_PRICE_ID as string,
        quantity: Math.max(1, totalQty),
        adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
      },
    ];
  } else if (hasAnySizePriceIds()) {
    lineItems = Object.entries(sizeCounts).map(([size, qty]) => {
      const priceId = PRICE_BY_SIZE[size];
      if (!priceId) {
        throw new Error(`Missing Stripe Price ID for size ${size}`);
      }
      return { price: priceId, quantity: qty };
    });
  } else {
    // Inline price_data so we can customize the name with size.
    lineItems = Object.entries(sizeCounts).map(([size, qty]) => {
      const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData = {
        name: `AVAILABLE Tee (${size})`,
        description: "Declare it. Wear it.",
        images: ["https://www.godscoffeecall.com/images/shirt.jpeg"],
      };
      return {
        price_data: {
          currency: "usd",
          unit_amount: unitAmount,
          product_data: productData,
        },
        quantity: qty,
      };
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "auto",
      submit_type: "pay",
      customer_email: contact?.email || undefined,
      customer_creation: "always",
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      phone_number_collection: { enabled: true },
      line_items: lineItems,

      // Sizes live in metadata for your webhooks / admin
      metadata: {
        registration_id: registrationId || "",
        contact_name: contact?.name || "",
        contact_email: contact?.email || "",
        contact_phone: contact?.phone || "",
        shirt_sizes: normalizedShirts.map((s) => s.size).join(","), // e.g. "M,L,L"
        shirts: JSON.stringify(normalizedShirts),
      },

      success_url: `${baseUrl}/thank-you?checkout=success&poll=1`,
      cancel_url: `${baseUrl}/register?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Stripe session error", err);
    return NextResponse.json(
      { error: "Unable to create checkout session" },
      { status: 500 }
    );
  }
}