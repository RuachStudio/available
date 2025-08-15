import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const regs = await prisma.registration.findMany({
    include: { attendees: true },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "createdAt",
    "contactName",
    "contactEmail",
    "contactPhone",
    "contactAddress",
    "attendeeName",
    "attendeeEmail",
    "attendeePhone",
    "wantsShirt",
    "shirtSize",
  ];

  const lines = [headers.join(",")];
  for (const r of regs) {
    if (r.attendees.length === 0) {
      lines.push(
        [
          r.createdAt.toISOString(),
          q(r.contactName),
          q(r.contactEmail || ""),
          q(r.contactPhone),
          q(r.contactAddress || ""),
          "", "", "", "", "",
        ].join(",")
      );
    } else {
      for (const a of r.attendees) {
        lines.push(
          [
            r.createdAt.toISOString(),
            q(r.contactName),
            q(r.contactEmail || ""),
            q(r.contactPhone),
            q(r.contactAddress || ""),
            q(a.name),
            q(a.email || ""),
            q(a.phone),
            a.wantsShirt ? "YES" : "NO",
            q(a.shirtSize || ""),
          ].join(",")
        );
      }
    }
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations.csv"`,
    },
  });
}

function q(s: string | null | undefined) {
  const t = (s ?? "").replace(/"/g, '""');
  return `"${t}"`;
}