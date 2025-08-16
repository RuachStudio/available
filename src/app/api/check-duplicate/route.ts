// src/app/api/check-duplicate/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDuplicate } from "@/lib/checkDuplicate";

export async function POST(req: Request) {
  try {
    const { email, phone } = await req.json();
    const result = await checkDuplicate(prisma, email, phone);
    return NextResponse.json(result);            // 200 with { duplicate: boolean, ... }
  } catch (err) {
    console.error("❌ /api/check-duplicate", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}