// src/app/api/check-duplicate/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
import "server-only";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// Reuse singleton Prisma
const getPrisma = async () => (await import("@/lib/prisma")).prisma;

type Payload = {
  email?: string;
  phone?: string;
};

/** lowercases & trims; returns null if empty */
function normalizeEmail(val?: string | null): string | null {
  if (!val || typeof val !== "string") return null;
  const v = val.trim().toLowerCase();
  return v.length ? v : null;
}

/** keep only digits; return last 10 if possible (US style), else all digits; null if none */
function normalizePhoneLast10(val?: string | null): { digits: string | null; last10: string | null } {
  if (!val || typeof val !== "string") return { digits: null, last10: null };
  const digits = val.replace(/\D+/g, "");
  if (!digits) return { digits: null, last10: null };
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  return { digits, last10 };
}

export async function POST(req: Request) {
  try {
    const { email, phone }: Payload = await req.json();

    const cleanEmail = normalizeEmail(email);
    const { last10 } = normalizePhoneLast10(phone);

    if (!cleanEmail && !last10) {
      return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
    }

    const prisma = await getPrisma();

    // Single-query check against both Registration fields and Attendee fields.
    // We use endsWith on phone so different input formats still match.
    const existing = await prisma.registration.findFirst({
      where: {
        OR: [
          cleanEmail ? { contactEmail: cleanEmail } : undefined,
          last10 ? ({ contactPhone: { endsWith: last10 } } as Prisma.RegistrationWhereInput) : undefined,
          {
            attendees: {
              some: {
                OR: [
                  cleanEmail ? { email: cleanEmail } : undefined,
                  last10 ? ({ phone: { endsWith: last10 } } as Prisma.AttendeeWhereInput) : undefined,
                ].filter(Boolean) as Prisma.AttendeeWhereInput[],
              },
            },
          },
        ].filter(Boolean) as Prisma.RegistrationWhereInput[],
      },
      select: {
        id: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        attendees: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    // No match → not a duplicate
    if (!existing) {
      return NextResponse.json({
        duplicate: false,
        existingId: null,
        via: null,
        contactName: null,
        attendeesCount: 0,
        message: null,
      });
    }

    // Infer how it matched (we can’t know which OR branch hit; infer post-query)
    let via: "registration" | "attendee" = "registration";
    const regEmailHit = cleanEmail && existing.contactEmail === cleanEmail;
    const regPhoneHit = last10 && existing.contactPhone?.replace(/\D+/g, "").endsWith(last10);

    if (!regEmailHit && !regPhoneHit) {
      // If not via contact*, assume attendee match
      via = "attendee";
    }

    return NextResponse.json({
      duplicate: true,
      existingId: existing.id,
      via, // "registration" | "attendee"
      contactName: existing.contactName ?? null,
      attendeesCount: existing.attendees.length,
      message:
        "It looks like you’ve already registered. Would you like to purchase a shirt?",
    });
  } catch (err) {
    console.error("❌ Error in /api/check-duplicate:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}