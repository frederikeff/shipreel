import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Where generated media lands so the browser can play it back during the demo.
// In production you'd push these to Supabase Storage (see lib/supabase.ts);
// locally we write under /public/media which Next serves at /media/*.
const MEDIA_DIR = path.join(process.cwd(), "public", "media");

export async function saveMedia(
  filename: string,
  data: Buffer | Uint8Array,
): Promise<string> {
  await mkdir(MEDIA_DIR, { recursive: true });
  const full = path.join(MEDIA_DIR, filename);
  await writeFile(full, data);
  return `/media/${filename}`;
}

export function mediaPath(filename: string): string {
  return path.join(MEDIA_DIR, filename);
}
