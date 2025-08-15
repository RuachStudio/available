import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const rows = await prisma.speakerPoll.findMany({
    orderBy: [{ votes: "desc" }, { speaker: "asc" }],
  });

  const headers = ["speaker", "votes", "createdAt", "updatedAt"];
  const lines = [headers.join(",")];

  for (const r of rows) {
    lines.push([
      csv(r.speaker),
      String(r.votes ?? 0),
      iso(r.createdAt),
      iso(r.updatedAt),
    ].join(","));
  }

  const csvText = lines.join("\n");
  return new NextResponse(csvText, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="speaker-poll.csv"',
    },
  });
}

function iso(d: Date | string) {
  return (typeof d === "string" ? new Date(d) : d).toISOString();
}
function csv(s: string) {
  return `"${(s || "").replace(/"/g, '""')}"`;
}