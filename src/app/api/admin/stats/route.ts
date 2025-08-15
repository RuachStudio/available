import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [registrations, attendees, shirtCounts] = await Promise.all([
      prisma.registration.count(),
      prisma.attendee.count(),
      prisma.attendee.groupBy({
        by: ["shirtSize"],
        _count: { shirtSize: true },
        where: { wantsShirt: true },
      }),
    ]);

    // Optional: donation total via Stripe (last 30 days)
    let donationsUsd = null as number | null;
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const since = Math.floor(Date.now() / 1000) - 30 * 24 * 3600;
      const sessions = await stripe.checkout.sessions.list({
        limit: 100,
        created: { gte: since },
        expand: ["data.total_details"],
      });
      const paid = sessions.data.filter((s) => s.payment_status === "paid");
      const sum = paid.reduce((acc, s) => acc + (s.amount_total || 0), 0);
      donationsUsd = Math.round(sum) / 100;
    }

    return NextResponse.json({
      registrations,
      attendees,
      shirts: shirtCounts.map((s) => ({ size: s.shirtSize, count: s._count.shirtSize })),
      donationsUsd,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}