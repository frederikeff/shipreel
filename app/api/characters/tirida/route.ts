import { NextResponse } from "next/server";
import { fetchTiridaCharacters } from "@/lib/tirida";

export const runtime = "nodejs";

// GET /api/characters/tirida → the user's own cast from cdn.tirida.world
export async function GET() {
  const characters = await fetchTiridaCharacters();
  return NextResponse.json({ characters });
}
