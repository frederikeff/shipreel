import { generateImage, gateway } from "ai";
import { saveMedia } from "./files";
import { newId } from "./store";
import { imageGenConfigured } from "./character-gen";

const IMAGE_MODEL = process.env.SHIPREEL_IMAGE_MODEL || "openai/gpt-image-1";

export interface BackgroundResult {
  url: string | null;
  detail: string;
}

// AI-generate a full-bleed background scene for a reel. Needs AI Gateway image
// credentials; without them the caller should fall back to a plain background.
export async function generateBackground(prompt: string): Promise<BackgroundResult> {
  if (!imageGenConfigured()) {
    return { url: null, detail: "No AI Gateway image credentials — upload a background instead" };
  }
  try {
    const { image } = await generateImage({
      model: gateway.imageModel(IMAGE_MODEL),
      prompt: `Cinematic vertical social-video background scene, vibrant but not busy, leaves room for a character and captions in the center, no text, no watermark. Scene: ${prompt}`,
      size: "1024x1536",
    });
    const url = await saveMedia(`bg_${newId()}.png`, image.uint8Array);
    return { url, detail: "AI background generated" };
  } catch (err) {
    console.warn("[backgrounds] generation failed:", err);
    return { url: null, detail: String(err) };
  }
}
