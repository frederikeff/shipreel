import { NextResponse } from "next/server";
import { renderStep } from "@/lib/pipeline";

export const runtime = "nodejs";
// Headless Chromium render can take a while.
export const maxDuration = 300;

// POST /api/reels/[id]/render — produce real mp4 files with Remotion.
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const reel = await renderStep(id);
    return NextResponse.json({ reel });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
