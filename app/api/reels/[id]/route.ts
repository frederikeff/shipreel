import { NextResponse } from "next/server";
import { getReel } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const reel = await getReel(id);
  if (!reel) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ reel });
}
