// app/api/check-duplicate/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, phone } = await req.json();

    if ((!email || typeof email !== "string") && (!phone || typeof phone !== "string")) {
      return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
    }

    const existing = await prisma.registration.findFirst({
      where: {
        OR: [
          email ? { contactEmail: email.toLowerCase() } : undefined,
          phone ? { contactPhone: phone } : undefined,
        ].filter(Boolean),
      },
    });

    return NextResponse.json({ duplicate: !!existing });
  } catch (err) {
    console.error("❌ Error in /api/check-duplicate:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}