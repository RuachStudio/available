import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = 'force-dynamic';
import 'server-only';
export async function GET() {
  const results = await prisma.speakerPoll.findMany({ orderBy: { votes: "desc" } });
  return NextResponse.json(results);
}

export async function POST(req: Request) {
  const { speaker } = await req.json();

  if (!speaker) return NextResponse.json({ error: "Speaker is required" }, { status: 400 });

  await prisma.speakerPoll.updateMany({
    where: { speaker },
    data: { votes: { increment: 1 } },
  });

  const refreshed = await prisma.speakerPoll.findFirst({
    where: { speaker },
  });

  return NextResponse.json(refreshed);
}