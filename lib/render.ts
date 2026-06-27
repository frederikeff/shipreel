import path from "node:path";
import os from "node:os";
import { mkdir } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import type { Character, FormatKey, ReelScript, RenderOutput } from "./types";
import { FORMATS } from "./formats";
import { uploadToSupabase } from "./supabase";

// Server-side mp4 render with Remotion. This is the "ship to file" step; the
// live preview in the browser uses @remotion/player on the same composition.
// Rendering needs headless Chromium and is heavy, so it degrades to
// preview-only (the reel still plays in-browser) when it can't run.

let cachedBundle: string | null = null;

async function getBundle(): Promise<string> {
  if (cachedBundle) return cachedBundle;
  const { bundle } = await import("@remotion/bundler");
  const entry = path.join(process.cwd(), "remotion", "index.ts");
  cachedBundle = await bundle({
    entryPoint: entry,
    // Let Remotion handle webpack; nothing custom needed.
  });
  return cachedBundle;
}

export interface RenderInput {
  reelId: string;
  script: ReelScript;
  character: Character;
  imageUrls: string[];
  backgroundUrl: string | null;
  voiceUrl: string | null;
  formats: FormatKey[];
}

export async function renderReel(input: RenderInput): Promise<RenderOutput[]> {
  if (process.env.SHIPREEL_DISABLE_RENDER === "1") {
    return input.formats.map((f) => ({ format: f, url: null, previewOnly: true }));
  }

  let serveUrl: string;
  let renderer: typeof import("@remotion/renderer");
  try {
    [serveUrl, renderer] = await Promise.all([getBundle(), import("@remotion/renderer")]);
  } catch (err) {
    console.warn("[render] Remotion not available, preview-only:", err);
    return input.formats.map((f) => ({ format: f, url: null, previewOnly: true }));
  }

  const outDir = path.join(process.cwd(), "public", "media");
  await mkdir(outDir, { recursive: true });

  const results: RenderOutput[] = [];
  for (const format of input.formats) {
    try {
      const inputProps = {
        script: input.script,
        character: input.character,
        imageUrls: absolutize(input.imageUrls),
        backgroundUrl: input.backgroundUrl ? absolute(input.backgroundUrl) : null,
        voiceUrl: input.voiceUrl ? absolute(input.voiceUrl) : null,
        format,
      };
      const composition = await renderer.selectComposition({
        serveUrl,
        id: "Reel",
        inputProps,
      });
      const filename = `reel-${input.reelId}-${format}.mp4`;
      const outPath = path.join(outDir, filename);
      await renderer.renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        outputLocation: outPath,
        inputProps,
        concurrency: Math.max(1, Math.min(4, os.cpus().length - 1)),
      });
      // Persist the clip to Supabase Storage when configured; fall back to the
      // locally-served file. Either way it's downloadable from the UI.
      let url = `/media/${filename}`;
      try {
        const buf = await readFile(outPath);
        const remote = await uploadToSupabase(`clips/${filename}`, buf, "video/mp4");
        if (remote) url = remote;
      } catch (err) {
        console.warn("[render] supabase clip upload failed, serving local:", err);
      }
      results.push({ format, url, previewOnly: false });
    } catch (err) {
      console.warn(`[render] format ${format} failed, preview-only:`, err);
      results.push({ format, url: null, previewOnly: true });
    }
  }
  return results;
}

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

// Remotion's renderer fetches assets over http; make local /media and /uploads
// paths absolute so the headless browser can load them.
function absolute(u: string): string {
  if (u.startsWith("http")) return u;
  return `${appUrl()}${u}`;
}
function absolutize(urls: string[]): string[] {
  return urls.map(absolute);
}

export { FORMATS };
