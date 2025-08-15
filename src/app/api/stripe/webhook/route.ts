import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always run on server
// NOTE: App Router allows reading raw body via req.text(), no extra config needed

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
    const rawBody = await req.text(); // IMPORTANT: raw body for Stripe signature verification
    event = stripe.webhooks.constructEvent(rawBody, sig, getWebhookSecret());
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Retrieve expanded session for custom_fields & payment details
      const full = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["payment_intent", "customer", "custom_fields"],
      });

      // Optional: fetch line items if you need product names/quantities
      // const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

      const amountTotal = full.amount_total ?? 0; // in cents
      const currency = (full.currency || "usd").toLowerCase();
      const customerEmail = full.customer_details?.email || full.customer_email || "";
      const customerName = full.customer_details?.name || "";
      const paymentStatus = full.payment_status; // 'paid' expected here

      // Extract shirt size from Checkout custom_fields
      let shirtSize: string | null = null;
      if (Array.isArray(full.custom_fields)) {
        const sizeField = full.custom_fields.find((f) => f.key === "shirt_size");
        if (sizeField) {
          if (sizeField.type === "dropdown") {
            shirtSize = sizeField.dropdown?.value || null;
          } else if (sizeField.type === "text") {
            shirtSize = sizeField.text?.value || null;
          }
        }
      }

      // Identify flow (donation vs shirt) — simple heuristics:
      const isDonation = full.submit_type === "donate" || (full.metadata?.source ?? "").includes("donation");

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
            shirtSize: !isDonation ? (shirtSize || null) : null,
          },
        });
      } catch (dbErr) {
        console.error("❌ Failed to persist Payment:", dbErr);
        // Do not throw here; Stripe will retry if we return non-2xx. We log and continue.
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

    // Always respond 200 quickly; Stripe expects it.
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    // Return 200 to avoid repeated retries if the error is on our side but logged
    return NextResponse.json({ received: true, error: "Handler failed" });
  }
}