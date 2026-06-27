import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { newId } from "@/lib/store";
import { uploadToSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// POST /api/upload (multipart) — accept reference images, return public URLs.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const urls: string[] = [];

  await mkdir(UPLOAD_DIR, { recursive: true });
  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const name = `${newId()}.${ext}`;

    // Prefer Supabase Storage when configured; fall back to local /public.
    const remote = await uploadToSupabase(name, buf, file.type || "image/png");
    if (remote) {
      urls.push(remote);
    } else {
      await writeFile(path.join(UPLOAD_DIR, name), buf);
      urls.push(`/uploads/${name}`);
    }
  }
  return NextResponse.json({ urls });
}
