import type { Character } from "./types";

// Pull the user's own published cast from the tirida.world CDN manifest and map
// each entry onto a ShipReel Character (portrait + brand color + tagline).
const MANIFEST_URL = process.env.TIRIDA_MANIFEST_URL || "https://cdn.tirida.world/manifest.json";

interface TiridaEntry {
  slug: string;
  name?: string;
  display_name?: string;
  tagline_en?: string;
  primary_color?: string;
  portrait_url?: string;
}

export async function fetchTiridaCharacters(): Promise<Character[]> {
  try {
    const res = await fetch(MANIFEST_URL, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`manifest ${res.status}`);
    const data = (await res.json()) as { characters?: TiridaEntry[] };
    const entries = data.characters ?? [];
    return entries
      .filter((e) => e.portrait_url && e.slug)
      .map((e) => {
        const accent = /^#[0-9a-f]{6}$/i.test(e.primary_color || "") ? e.primary_color! : "#7c5cff";
        const character: Character = {
          id: `tirida_${e.slug}`,
          name: (e.display_name || e.name || e.slug).slice(0, 24),
          vibe: e.tagline_en || "a tirida.world original",
          face: "🎭",
          imageUrl: e.portrait_url!,
          source: "tirida",
          // tirida portraits are complete illustrated scenes → fill the frame.
          fullScene: true,
          palette: ["#0b0b12", accent, "#ffffff"],
          voice: "alloy",
        };
        return character;
      });
  } catch (err) {
    console.warn("[tirida] manifest fetch failed:", err);
    return [];
  }
}
