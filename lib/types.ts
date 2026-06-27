// Shared domain types for ShipReel.

export type FormatKey = "reel" | "square" | "wide";

export interface FormatSpec {
  key: FormatKey;
  label: string;
  /** Platform this format is tuned for. */
  platform: string;
  width: number;
  height: number;
  fps: number;
  aspect: string;
}

export interface Character {
  id: string;
  name: string;
  /** One-line personality used to steer the script's voice. */
  vibe: string;
  /** Emoji face used as a fallback avatar in the Remotion comp. */
  face: string;
  /** Portrait image rendered as the avatar (DiceBear, an upload, or AI-gen). */
  imageUrl?: string;
  /** How this character was made — drives the "AI / Custom" badge. */
  source?: "library" | "upload" | "ai" | "tirida";
  /** True when imageUrl is a complete illustrated scene (character + its own
   * environment), so it fills the frame instead of compositing over a separate
   * background. False/undefined = a transparent cut-out that composites. */
  fullScene?: boolean;
  /** [background, accent, text] hex colors. */
  palette: [string, string, string];
  /** Suggested TTS voice id / persona hint. */
  voice: string;
}

export interface Scene {
  /** On-screen caption (short). */
  caption: string;
  /** Voiceover line the character speaks. */
  voiceover: string;
  /** Length of this scene in frames (at the format fps). */
  durationInFrames: number;
}

export interface ReelScript {
  title: string;
  hook: string;
  scenes: Scene[];
  cta: string;
  /** Hashtags / caption text for the social post. */
  postCaption: string;
}

export type ReelStatus =
  | "draft"
  | "scripting"
  | "voicing"
  | "rendering"
  | "review" // waiting for human approval
  | "approved"
  | "publishing"
  | "published"
  | "rejected"
  | "failed";

export interface RenderOutput {
  format: FormatKey;
  /** Public URL of the rendered mp4, or null if preview-only. */
  url: string | null;
  previewOnly: boolean;
}

export interface SocialPost {
  platform: "linkedin" | "instagram";
  status: "queued" | "posted" | "mocked" | "failed";
  url: string | null;
  postedAt: string | null;
  detail?: string;
}

export interface Reel {
  id: string;
  topic: string;
  brief: string;
  characterId: string;
  /** Set when the host is an uploaded or AI-generated character (not a built-in). */
  customCharacter: Character | null;
  formats: FormatKey[];
  /** Full-bleed background behind the host (uploaded or AI-generated). */
  backgroundUrl: string | null;
  imageUrls: string[];
  script: ReelScript | null;
  voiceUrl: string | null;
  voicePreviewText: string | null;
  renders: RenderOutput[];
  posts: SocialPost[];
  status: ReelStatus;
  ownerEmail: string | null;
  createdAt: string;
  updatedAt: string;
}
