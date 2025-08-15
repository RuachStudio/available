import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const take = Math.min(Math.max(Number(url.searchParams.get("take") || 25), 1), 100);
  const page = Math.max(Number(url.searchParams.get("page") || 0), 0);
  const skip = page * take;

  const q = (url.searchParams.get("q") || "").trim();
  const type = (url.searchParams.get("type") || "").trim().toLowerCase(); // "donation" | "shirt" | ""

  // Build typed filters
  const orFilters: Prisma.PaymentWhereInput[] = q
    ? [
        { stripeId: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { shirtSize: { contains: q, mode: "insensitive" } },
        { currency: { contains: q, mode: "insensitive" } },
      ]
    : [];

  const andFilters: Prisma.PaymentWhereInput[] = [];
  if (type) {
    andFilters.push({ type });
  }
  if (orFilters.length) {
    andFilters.push({ OR: orFilters });
  }

  const where: Prisma.PaymentWhereInput = andFilters.length ? { AND: andFilters } : {};

  const [rows, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        createdAt: true,
        type: true,
        amountCents: true,
        currency: true,
        name: true,
        email: true,
        shirtSize: true,
        stripeId: true,
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return NextResponse.json({ rows, total, page, take });
}