import { NextRequest, NextResponse } from "next/server";
import { generateCharacter } from "@/lib/character-gen";

export const runtime = "nodejs";
export const maxDuration = 120;

// POST /api/characters/generate { prompt, name? } → a custom Character.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt || "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }
  try {
    const character = await generateCharacter({ prompt, name: body.name });
    return NextResponse.json({ character });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
