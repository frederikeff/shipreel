import { generateImage, gateway } from "ai";
import type { Character } from "./types";
import { dicebear } from "./characters";
import { saveMedia } from "./files";
import { newId } from "./store";

// Generate a brand-new host. With AI Gateway image credentials we render a real
// portrait from the user's prompt; otherwise we fall back to a unique DiceBear
// avatar seeded by the prompt so the feature always produces a character.

const IMAGE_MODEL = process.env.SHIPREEL_IMAGE_MODEL || "openai/gpt-image-1";

// A few pleasant palettes; pick deterministically from the prompt (no RNG).
const PALETTES: [string, string, string][] = [
  ["#0b1020", "#7c5cff", "#f5f7ff"],
  ["#101417", "#ffd23f", "#ffffff"],
  ["#04141a", "#2dd4bf", "#ebfffb"],
  ["#1a0a14", "#ff5d8f", "#fff0f6"],
  ["#06121f", "#37a2ff", "#eef7ff"],
  ["#1f1400", "#ff9f1c", "#fff7e8"],
];

function paletteFor(seed: string): [string, string, string] {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

export function imageGenConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}

export interface GenerateCharacterInput {
  prompt: string;
  name?: string;
}

export async function generateCharacter({ prompt, name }: GenerateCharacterInput): Promise<Character> {
  const id = `cust_${newId()}`;
  const palette = paletteFor(prompt || id);
  const displayName = (name || prompt.split(/[,.]/)[0] || "Custom Host").trim().slice(0, 24);

  let imageUrl = dicebear("fun-emoji", prompt || id, palette[1]);
  let source: Character["source"] = "ai";

  if (imageGenConfigured()) {
    const fullPrompt = `Friendly 3D cartoon character mascot, full upper body, big expressive face, looking at camera, isolated subject on a plain transparent background, no scenery, vibrant, social-media avatar style. Character: ${prompt}`;
    try {
      let image;
      try {
        // Prefer a transparent cut-out so the host composites into the scene.
        ({ image } = await generateImage({
          model: gateway.imageModel(IMAGE_MODEL),
          prompt: fullPrompt,
          size: "1024x1024",
          providerOptions: { openai: { background: "transparent" } },
        }));
      } catch {
        // Gateway/model may not accept the option — retry plain.
        ({ image } = await generateImage({
          model: gateway.imageModel(IMAGE_MODEL),
          prompt: fullPrompt,
          size: "1024x1024",
        }));
      }
      imageUrl = await saveMedia(`${id}.png`, image.uint8Array);
    } catch (err) {
      console.warn("[character-gen] image model failed, using DiceBear:", err);
      source = "ai"; // still user-generated intent; just a fallback portrait
    }
  }

  return {
    id,
    name: displayName,
    vibe: prompt.slice(0, 120) || "a custom AI-generated host",
    face: "✨",
    imageUrl,
    source,
    palette,
    voice: "alloy",
  };
}

/** Build a custom Character from an uploaded portrait image. */
export function characterFromUpload(imageUrl: string, name?: string): Character {
  const id = `cust_${newId()}`;
  return {
    id,
    name: (name || "My Character").trim().slice(0, 24),
    vibe: "a custom uploaded host",
    face: "🧑‍🎤",
    imageUrl,
    source: "upload",
    palette: paletteFor(imageUrl),
    voice: "alloy",
  };
}
