import type { FormatKey, FormatSpec } from "./types";

// Multi-format output specs. Each render target is a different composition size
// tuned for where it gets posted.
export const FORMATS: Record<FormatKey, FormatSpec> = {
  reel: {
    key: "reel",
    label: "Vertical Reel",
    platform: "Instagram Reels / TikTok / LinkedIn video",
    width: 1080,
    height: 1920,
    fps: 30,
    aspect: "9:16",
  },
  square: {
    key: "square",
    label: "Square",
    platform: "Instagram feed / LinkedIn feed",
    width: 1080,
    height: 1080,
    fps: 30,
    aspect: "1:1",
  },
  wide: {
    key: "wide",
    label: "Widescreen",
    platform: "YouTube / LinkedIn landscape",
    width: 1920,
    height: 1080,
    fps: 30,
    aspect: "16:9",
  },
};

export const FORMAT_LIST: FormatSpec[] = Object.values(FORMATS);

export const DEFAULT_FORMATS: FormatKey[] = ["reel", "square", "wide"];
