import type { Character } from "./types";

// DiceBear gives every built-in host a real, distinct cartoon portrait with zero
// API keys. PNG endpoint so it renders identically in the browser <Player> and
// in headless Remotion. Transparent background (no backgroundColor) so the host
// composites cleanly into the scene instead of looking like a pasted sticker.
// (bgHex kept for signature compatibility; intentionally unused.)
export function dicebear(style: string, seed: string, _bgHex?: string): string {
  return `https://api.dicebear.com/9.x/${style}/png?seed=${encodeURIComponent(
    seed,
  )}&scale=110&size=512`;
}

type Base = Omit<Character, "imageUrl" | "source"> & { style: string };

const BASE: Base[] = [
  { id: "nova", name: "Nova", vibe: "high-energy launch hype-girl who loves shipping", face: "🚀", palette: ["#0b1020", "#7c5cff", "#f5f7ff"], voice: "alloy", style: "adventurer" },
  { id: "bolt", name: "Bolt", vibe: "fast-talking builder, all about speed and momentum", face: "⚡", palette: ["#101417", "#ffd23f", "#ffffff"], voice: "verse", style: "bottts" },
  { id: "pixel", name: "Pixel", vibe: "playful retro-gamer who explains tech like a quest", face: "👾", palette: ["#12001f", "#39ff14", "#eafff0"], voice: "fable", style: "pixel-art" },
  { id: "sage", name: "Sage", vibe: "calm mentor who makes hard ideas feel simple", face: "🦉", palette: ["#0f1a14", "#4cd1a0", "#f2fff9"], voice: "shimmer", style: "notionists" },
  { id: "ruby", name: "Ruby", vibe: "warm community host, big on inclusion and welcome", face: "💎", palette: ["#1a0a14", "#ff5d8f", "#fff0f6"], voice: "coral", style: "big-smile" },
  { id: "atlas", name: "Atlas", vibe: "confident product visionary painting the big picture", face: "🌍", palette: ["#06121f", "#37a2ff", "#eef7ff"], voice: "onyx", style: "personas" },
  { id: "mango", name: "Mango", vibe: "cheerful no-code champion cheering on non-coders", face: "🥭", palette: ["#1f1400", "#ff9f1c", "#fff7e8"], voice: "sol", style: "fun-emoji" },
  { id: "echo", name: "Echo", vibe: "smooth narrator with a documentary tone", face: "🎙️", palette: ["#0a0a0f", "#a78bfa", "#f4f0ff"], voice: "ash", style: "lorelei" },
  { id: "comet", name: "Comet", vibe: "wide-eyed dreamer obsessed with cool ideas", face: "☄️", palette: ["#020617", "#22d3ee", "#ecffff"], voice: "breeze", style: "adventurer" },
  { id: "scout", name: "Scout", vibe: "curious explainer who asks the questions you have", face: "🧭", palette: ["#101a0d", "#a3e635", "#f7ffe8"], voice: "echo", style: "open-peeps" },
  { id: "blaze", name: "Blaze", vibe: "bold motivator hyping you to just start building", face: "🔥", palette: ["#1f0805", "#ff4d4d", "#fff0ee"], voice: "ember", style: "micah" },
  { id: "luna", name: "Luna", vibe: "dreamy storyteller with a cozy late-night vibe", face: "🌙", palette: ["#0b0b1a", "#c4b5fd", "#f5f3ff"], voice: "luna", style: "lorelei" },
  { id: "byte", name: "Byte", vibe: "deadpan robot host with dry, clever humor", face: "🤖", palette: ["#0d1117", "#58a6ff", "#eaf2ff"], voice: "metal", style: "bottts" },
  { id: "coral", name: "Coral", vibe: "sunny optimist who frames everything as an adventure", face: "🐠", palette: ["#04141a", "#2dd4bf", "#ebfffb"], voice: "wave", style: "big-smile" },
  { id: "spark", name: "Spark", vibe: "tiny inventor bursting with quick tips", face: "✨", palette: ["#1a1500", "#fde047", "#fffbe6"], voice: "twinkle", style: "fun-emoji" },
  { id: "vex", name: "Vex", vibe: "edgy hacker host with neon cyberpunk energy", face: "🕶️", palette: ["#0a0014", "#ff00e5", "#ffeafd"], voice: "neon", style: "personas" },
  { id: "willow", name: "Willow", vibe: "gentle coach who celebrates small wins", face: "🌿", palette: ["#0c1710", "#86efac", "#f0fff5"], voice: "sage", style: "notionists" },
  { id: "turbo", name: "Turbo", vibe: "sports-announcer energy calling your build like a race", face: "🏎️", palette: ["#150505", "#ff7a00", "#fff1e6"], voice: "rev", style: "micah" },
  { id: "ace", name: "Ace", vibe: "smooth, charming closer who sells the vision", face: "🃏", palette: ["#0a0f0a", "#94a3b8", "#ffffff"], voice: "smooth", style: "open-peeps" },
  { id: "ziggy", name: "Ziggy", vibe: "chaotic-good party host who makes learning fun", face: "🎉", palette: ["#16031a", "#f472b6", "#fff0f9"], voice: "zip", style: "adventurer" },
];

export const CHARACTERS: Character[] = BASE.map(({ style, ...c }) => ({
  ...c,
  source: "library",
  imageUrl: dicebear(style, c.id, c.palette[1]),
}));

const BY_ID = new Map(CHARACTERS.map((c) => [c.id, c]));

export function getCharacter(id: string | null | undefined): Character {
  return (id && BY_ID.get(id)) || CHARACTERS[0];
}

/** Resolve the host for a reel: a custom (upload/AI) character wins, else the
 * built-in by id. */
export function resolveCharacter(reel: {
  characterId: string;
  customCharacter?: Character | null;
}): Character {
  return reel.customCharacter ?? getCharacter(reel.characterId);
}
