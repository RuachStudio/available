// src/app/api/checkout/shirt/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

/** Canonical base URL used in links & image fallbacks */
function getBaseUrl(): string {
  const fallback = "https://www.godscoffeecall.com";
  const envBase = process.env.NEXT_PUBLIC_BASE_URL;
  if (!envBase) return fallback;
  try {
    const u = new URL(envBase);
    const host = u.hostname.toLowerCase();
    // normalize any godscoffeecall.com variants back to the canonical host
    if (host === "godscoffeecall.com" || host.endsWith(".godscoffeecall.com")) {
      return fallback;
    }
    return u.origin;
  } catch {
    return fallback;
  }
}

/** Public, absolute image URL for Stripe to fetch */
function getImageUrl(baseUrl: string): string {
  const envUrl = process.env.STRIPE_TEE_IMAGE_URL;
  const fallback = `${baseUrl}/images/available-tee.png`;
  const candidate = envUrl && /^https?:\/\//i.test(envUrl) ? envUrl : fallback;
  try {
    new URL(candidate); // validate absolute URL
    return candidate;
  } catch {
    return fallback;
  }
}

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

// Either use one saved price (no size in the name) or inline price_data per size.
const TEE_PRICE_ID = process.env.STRIPE_TEE_PRICE_ID;        // e.g. "price_..."
const TEE_PRICE_CENTS = process.env.STRIPE_TEE_PRICE_CENTS;  // e.g. "2500"

export async function POST(req: NextRequest) {
  // Require at least one of these so we have a price
  if (!TEE_PRICE_ID && !TEE_PRICE_CENTS) {
    return NextResponse.json(
      { error: "Missing STRIPE_TEE_PRICE_ID or STRIPE_TEE_PRICE_CENTS in environment" },
      { status: 400 }
    );
  }

  // Expected payload from your registration flow
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

  // If no explicit shirts array was sent, derive from primaryShirtSize (picked during registration)
  if (shirts.length === 0) {
    const n = normalizeSize(primaryShirtSize) ?? "M";
    shirts = [{ size: n, attendeeName: contact?.name || "" }];
  }

  // Normalize sizes & ensure at least 1 item
  const normalizedShirts =
    (shirts
      .map((s) => ({
        attendeeName: (s?.attendeeName || "").trim(),
        size: normalizeSize(s?.size) ?? "M",
      }))
      .filter(Boolean)) || [{ size: "M", attendeeName: "" }];

  // Group by size so we can show sizes in Checkout (separate rows)
  const sizeCounts: Record<string, number> = {};
  for (const s of normalizedShirts) {
    const key = s.size!;
    sizeCounts[key] = (sizeCounts[key] || 0) + 1;
  }

  const stripe = getStripe();
  const baseUrl = getBaseUrl();
  const imageUrl = getImageUrl(baseUrl);

  const unitAmount =
    Number.isFinite(Number(TEE_PRICE_CENTS)) && Number(TEE_PRICE_CENTS) > 0
      ? Number(TEE_PRICE_CENTS)
      : 2500; // $25 default

  const looksLikeSingleSavedPrice = TEE_PRICE_ID?.startsWith("price_") ?? false;

  let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  if (looksLikeSingleSavedPrice && !hasAnySizePriceIds()) {
    // MODE A: single saved price for all sizes (Stripe won't show size in name)
    // If you want sizes visible on Checkout using saved prices,
    // set STRIPE_PRICE_ID_XS, STRIPE_PRICE_ID_S, ... and fall into MODE B below.
    const totalQty = Object.values(sizeCounts).reduce((a, b) => a + b, 0);
    lineItems = [
      {
        price: TEE_PRICE_ID as string,
        quantity: Math.max(1, totalQty),
        adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
      },
    ];
  } else if (hasAnySizePriceIds()) {
    // MODE B: one saved price PER SIZE -> sizes show in the line item name
    lineItems = Object.entries(sizeCounts).map(([size, qty]) => {
      const priceId = PRICE_BY_SIZE[size];
      if (!priceId) {
        throw new Error(`Missing Stripe Price ID for size ${size}`);
      }
      return {
        price: priceId,
        quantity: qty,
      };
    });
  } else {
    // MODE C (recommended if you don't maintain prices per size):
    // Use price_data so we can customize the product name per size.
    lineItems = Object.entries(sizeCounts).map(([size, qty]) => ({
      price_data: {
        currency: "usd",
        unit_amount: unitAmount,
        product_data: {
          name: `AVAILABLE Tee (${size})`,
          description: "Declare it. Wear it.",
          images: [imageUrl], // absolute, public URL
        },
      },
      quantity: qty,
      // Typically you do NOT want adjustable quantities when splitting by size
      // adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
    }));
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "auto", // avoids the test-bundle './en' warning
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
        shirts: JSON.stringify(normalizedShirts),                   // full details
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

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

function hasAnySizePriceIds(): boolean {
  return Object.values(PRICE_BY_SIZE).some(Boolean);
}