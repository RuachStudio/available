export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching for Vercel build issues
import 'server-only';
import { NextResponse } from 'next/server';

export async function GET() {
  // Lazy import Prisma at runtime to avoid build-time initialization
  const { prisma } = await import('@/lib/prisma');
  const results = await prisma.speakerPoll.findMany({ orderBy: { votes: 'desc' } });
  return NextResponse.json(results);
}

export async function POST(req: Request) {
  // Lazy import Prisma at runtime to avoid build-time initialization
  const { prisma } = await import('@/lib/prisma');
  const { speaker } = await req.json();

  if (!speaker) return NextResponse.json({ error: 'Speaker is required' }, { status: 400 });

  await prisma.speakerPoll.upsert({
    where: { speaker },
    update: { votes: { increment: 1 } },
    create: { speaker, votes: 1 },
  });

  const refreshed = await prisma.speakerPoll.findUnique({ where: { speaker } });
  return NextResponse.json(refreshed);
}