import { NextRequest, NextResponse } from "next/server";
import { generateBackground } from "@/lib/backgrounds";

export const runtime = "nodejs";
export const maxDuration = 120;

// POST /api/backgrounds/generate { prompt } → { url }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt || "").trim();
  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  const result = await generateBackground(prompt);
  return NextResponse.json(result);
}
