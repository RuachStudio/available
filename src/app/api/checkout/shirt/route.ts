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
  const normalizedShirts: Shirt[] =
    shirts
      .map((s) => ({
        attendeeName: (s?.attendeeName || "").trim(),
        size: normalizeSize(s?.size) ?? "M",
      }))
      .filter(Boolean) || [{ size: "M", attendeeName: "" }];

  const quantity = Math.max(1, normalizedShirts.length);

  const stripe = getStripe();
  const looksLikePriceId = TEE_PRICE_ID?.startsWith("price_") ?? false;
  const unitAmount = Number.isFinite(Number(TEE_PRICE_CENTS))
    ? Number(TEE_PRICE_CENTS)
    : 2500; // $25 default

  const baseUrl = getBaseUrl();
  const productData: { name: string; description: string; images: string[] } = {
    name: "AVAILABLE Tee",
    description: "Declare it. Wear it.",
    images: [getImageUrl(baseUrl)], // absolute, public URL
  };

  // Line items: either reference a pre-made Price or inline price_data
  const lineItems =
    looksLikePriceId
      ? [
          {
            // Using a pre-created Price: cannot override product_data/images here.
            // Ensure the Product in Stripe Dashboard has an image set to display it in Checkout.
            price: TEE_PRICE_ID as string,
            quantity,
            adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
          },
        ]
      : [
          {
            price_data: {
              currency: "usd",
              unit_amount: unitAmount,
              product_data: productData,
            },
            quantity,
            adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
          },
        ];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Auto locale avoids the test-bundle './en' warning you saw
      locale: "auto",
      submit_type: "pay",
      customer_email: contact?.email || undefined,
      customer_creation: "always",
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      phone_number_collection: { enabled: true },
      line_items: lineItems,

      // ✅ No custom_fields — we rely on sizes from registration
      metadata: {
        registration_id: registrationId || "",
        contact_name: contact?.name || "",
        contact_email: contact?.email || "",
        contact_phone: contact?.phone || "",
        // Helpful summaries in the Dashboard:
        shirt_sizes: normalizedShirts.map((s) => s.size).join(","),
        shirts: JSON.stringify(normalizedShirts),
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
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}