import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/admin/poll  -> list speakers & votes (desc)
export async function GET() {
  const rows = await prisma.speakerPoll.findMany({
    orderBy: [{ votes: "desc" }, { speaker: "asc" }],
  });
  const totalVotes = rows.reduce((acc, r) => acc + (r.votes || 0), 0);
  return NextResponse.json({ rows, totalVotes });
}

// POST /api/admin/poll  { action: "reset" } -> set all votes to 0
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body?.action !== "reset") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }
  await prisma.speakerPoll.updateMany({ data: { votes: 0 } });
  return NextResponse.json({ ok: true });
}