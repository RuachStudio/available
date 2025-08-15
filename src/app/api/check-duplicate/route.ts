// app/api/check-duplicate/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0; // Disable caching for Vercel build issues
import "server-only";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// Reuse singleton to avoid 'PrismaClientInitializationError' / too many clients
const getPrisma = async () => (await import("@/lib/prisma")).prisma;

type Payload = {
  email?: string;
  phone?: string;
};

export async function POST(req: Request) {
  try {
    const { email, phone }: Payload = await req.json();

    // sanitize
    const cleanEmail =
      typeof email === "string" && email.trim()
        ? email.trim().toLowerCase()
        : null;
    const cleanPhone =
      typeof phone === "string" && phone.trim()
        ? phone.trim()
        : null;

    // require at least one
    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();

    const orConditions: Prisma.RegistrationWhereInput[] = [];
    if (cleanEmail) orConditions.push({ contactEmail: cleanEmail });
    if (cleanPhone) orConditions.push({ contactPhone: cleanPhone });

    const existing = await prisma.registration.findFirst({
      where: { OR: orConditions },
      select: { id: true, contactEmail: true, contactPhone: true },
    });

    return NextResponse.json({
      duplicate: !!existing,
      existingId: existing?.id ?? null,
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