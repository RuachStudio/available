// src/app/api/check-duplicate/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDuplicate } from "@/lib/checkDuplicate";

type Body = {
  email?: string | null;
  phone?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const { email, phone } = (await req.json().catch(() => ({}))) as Body;

    // Delegates normalization + lookup to the shared helper
    const result = await checkDuplicate(prisma, email ?? undefined, phone ?? undefined);

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    }); // { duplicate, existingId, via, contactName, attendeesCount, message }
  } catch (err) {
    console.error("❌ /api/check-duplicate", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

// (Optional) If someone hits this route with GET, return method not allowed.
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}