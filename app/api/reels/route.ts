import { NextRequest, NextResponse } from "next/server";
import { createReel, previewReel } from "@/lib/pipeline";
import { listReels } from "@/lib/store";
import type { FormatKey } from "@/lib/types";

export const runtime = "nodejs";

// GET /api/reels            → list recent reels
// GET /api/reels?latest=1   → most recent reel only
export async function GET(req: NextRequest) {
  const latest = req.nextUrl.searchParams.get("latest");
  const reels = await listReels(latest ? 1 : 50);
  if (latest) return NextResponse.json({ reel: reels[0] ?? null });
  return NextResponse.json({ reels });
}

// POST /api/reels — create a reel from the Studio form and build a preview.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const topic = String(body.topic || "").trim();
  if (!topic) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }
  const reel = await createReel({
    topic,
    brief: body.brief,
    characterId: body.characterId,
    customCharacter: body.customCharacter ?? null,
    formats: body.formats as FormatKey[] | undefined,
    backgroundUrl: body.backgroundUrl ?? null,
    imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
    ownerEmail: body.ownerEmail ?? null,
  });
  // Fast preview build (script + voice). Full mp4 render is available via the
  // agent's render_reel tool or /api/reels/[id]/render.
  const built = await previewReel(reel.id);
  return NextResponse.json({ reel: built });
}
