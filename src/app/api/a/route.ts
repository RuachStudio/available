import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  // Connect to Supabase or another DB here
  console.log("RSVP Received:", body);

  return NextResponse.json({ success: true });
}