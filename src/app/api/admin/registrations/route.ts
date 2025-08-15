import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const take = Number(url.searchParams.get("take") || 50);
  const skip = Number(url.searchParams.get("skip") || 0);
  const q = (url.searchParams.get("q") || "").trim();

  const where: Prisma.RegistrationWhereInput = q
    ? {
        OR: [
          { contactName: { contains: q, mode: "insensitive" } as const },
          { contactEmail: { contains: q, mode: "insensitive" } as const },
          { contactPhone: { contains: q } },
          { attendees: { some: { name: { contains: q, mode: "insensitive" } as const } } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: { attendees: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.registration.count({ where }),
  ]);

  return NextResponse.json({ rows, total });
}