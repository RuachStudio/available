// src/lib/checkDuplicate.ts
import { PrismaClient, Prisma } from "@prisma/client";

export type DupResult = {
  duplicate: boolean;
  existingId: string | null;
  via: "registration" | "attendee" | null;
  contactName: string | null;
  attendeesCount: number;
  message: string | null;
};

export function normalizeEmail(val?: string | null): string | null {
  if (!val || typeof val !== "string") return null;
  const v = val.trim().toLowerCase();
  return v.length ? v : null;
}

export function normalizePhoneLast10(val?: string | null): { last10: string | null } {
  if (!val || typeof val !== "string") return { last10: null };
  const digits = val.replace(/\D+/g, "");
  if (!digits) return { last10: null };
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  return { last10 };
}

export async function checkDuplicate(
  prisma: PrismaClient,
  email?: string,
  phone?: string
): Promise<DupResult> {
  const cleanEmail = normalizeEmail(email);
  const { last10 } = normalizePhoneLast10(phone);

  if (!cleanEmail && !last10) {
    return {
      duplicate: false,
      existingId: null,
      via: null,
      contactName: null,
      attendeesCount: 0,
      message: null,
    };
  }

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
      attendees: { select: { id: true } },
    },
  });

  if (!existing) {
    return {
      duplicate: false,
      existingId: null,
      via: null,
      contactName: null,
      attendeesCount: 0,
      message: null,
    };
  }

  let via: "registration" | "attendee" = "registration";
  const regEmailHit = cleanEmail && existing.contactEmail === cleanEmail;
  const regPhoneHit = last10 && (existing.contactPhone ?? "").replace(/\D+/g, "").endsWith(last10);
  if (!regEmailHit && !regPhoneHit) via = "attendee";

  return {
    duplicate: true,
    existingId: existing.id,
    via,
    contactName: existing.contactName ?? null,
    attendeesCount: existing.attendees.length,
    message: "It looks like you’ve already registered. Would you like to purchase a shirt?",
  };
}