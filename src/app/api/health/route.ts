import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = await prisma.$queryRawUnsafe<Date>("select now()");
    return NextResponse.json({ ok: true, now });
  } catch (e: unknown) {
    let message: string;
    if (e instanceof Error) {
      message = e.message;
    } else {
      message = String(e);
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}