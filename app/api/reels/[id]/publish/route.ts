import { NextRequest, NextResponse } from "next/server";
import { publishStep, setApproval } from "@/lib/pipeline";

export const runtime = "nodejs";

// POST /api/reels/[id]/publish — the manual (non-agent) human-in-the-loop ship
// button. Approving here is the human gate.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const platforms = (Array.isArray(body.platforms) && body.platforms.length
    ? body.platforms
    : ["linkedin"]) as Array<"linkedin" | "instagram">;
  try {
    await setApproval(id, true);
    const reel = await publishStep(id, platforms);
    return NextResponse.json({ reel });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
