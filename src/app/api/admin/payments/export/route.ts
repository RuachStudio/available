import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const type = (url.searchParams.get("type") || "").trim().toLowerCase();

  // Build typed filters to avoid readonly/as-const issues with Prisma types
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
  if (type) andFilters.push({ type });
  if (orFilters.length) andFilters.push({ OR: orFilters });

  const where: Prisma.PaymentWhereInput = andFilters.length ? { AND: andFilters } : {};

  const rows = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "createdAt",
    "type",
    "amountUSD",
    "currency",
    "name",
    "email",
    "shirtSize",
    "stripeId",
  ];

  const lines = [headers.join(",")];
  for (const r of rows) {
    const amountUSD = (r.amountCents ?? 0) / 100;
    lines.push([
      iso(r.createdAt),
      r.type,
      amountUSD.toFixed(2),
      r.currency?.toUpperCase() ?? "USD",
      csv(r.name || ""),
      csv(r.email || ""),
      csv(r.shirtSize || ""),
      r.stripeId,
    ].join(","));
  }

  const csvText = lines.join("\n");
  return new NextResponse(csvText, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payments.csv"`,
    },
  });
}

function iso(d: Date | string) {
  return (typeof d === "string" ? new Date(d) : d).toISOString();
}
function csv(s: string) {
  return `"${(s || "").replace(/"/g, '""')}"`;
}