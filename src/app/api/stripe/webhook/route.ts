// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always run on server
// App Router lets us read the raw body with req.text() — required for Stripe signature verification

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key);
}

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not set");
  return secret;
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // IMPORTANT: Use the raw request body for signature verification
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, getWebhookSecret());
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Retrieve expanded session for payment/customer details (custom_fields no longer used)
      const full = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["payment_intent", "customer"],
      });

      // Optional: if you ever need product names/quantities
      // const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

      const amountTotal = full.amount_total ?? 0; // cents
      const currency = (full.currency || "usd").toLowerCase();
      const customerEmail =
        full.customer_details?.email || full.customer_email || "";
      const customerName = full.customer_details?.name || "";
      const paymentStatus = full.payment_status; // 'paid' expected on completed

      // ✅ Extract sizes from metadata (set by /api/checkout/shirt)
      // We set both:
      //  - metadata.shirt_sizes  -> "M,L,XL" (CSV)
      //  - metadata.shirts       -> JSON string: [{size:"M",attendeeName:"..."}, ...]
      let shirtSize: string | null = null; // legacy single-size column (first size if multiple)
      const shirtSizesCsv = (full.metadata?.shirt_sizes as string) || "";
      const shirtsJson = (full.metadata?.shirts as string) || "";

      if (shirtSizesCsv) {
        const arr = shirtSizesCsv.split(",").map(s => s.trim()).filter(Boolean);
        if (arr.length) shirtSize = arr[0] || null;
      } else if (shirtsJson) {
        try {
          const arr = JSON.parse(shirtsJson);
          if (Array.isArray(arr) && arr.length && typeof arr[0]?.size === "string") {
            shirtSize = String(arr[0].size);
          }
        } catch {
          // ignore parse errors; keep shirtSize as null
        }
      }

      // Heuristic: donation vs shirt
      const isDonation =
        full.submit_type === "donate" ||
        ((full.metadata?.source ?? "").toLowerCase().includes("donation"));

      // Persist the payment (idempotent on stripeId)
      try {
        await prisma.payment.upsert({
          where: { stripeId: full.id },
          update: {},
          create: {
            stripeId: full.id,
            amountCents: amountTotal,
            currency,
            email: customerEmail || null,
            name: customerName || null,
            type: isDonation ? "donation" : "shirt",
            // If you’ve only got a single column, store the first size.
            // (Optionally add columns for all sizes CSV / JSON if you want more detail later.)
            shirtSize: !isDonation ? (shirtSize || null) : null,
          },
        });
      } catch (dbErr) {
        console.error("❌ Failed to persist Payment:", dbErr);
        // Do not throw; we still acknowledge to avoid repeated retries
      }

      console.log("✅ checkout.session.completed", {
        id: full.id,
        paymentStatus,
        amountTotal,
        currency,
        customerEmail,
        customerName,
        shirtSize,
        kind: isDonation ? "donation" : "shirt",
      });
    }

    // Always acknowledge quickly; Stripe expects a 2xx
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    // Return 200 to prevent Stripe from retrying indefinitely on our internal errors
    return NextResponse.json({ received: true, error: "Handler failed" });
  }
}