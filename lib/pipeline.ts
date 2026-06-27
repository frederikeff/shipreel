import type { Character, FormatKey, Reel, SocialPost } from "./types";
import { DEFAULT_FORMATS } from "./formats";
import { getCharacter, resolveCharacter } from "./characters";
import { createReel as storeCreate, getReel, updateReel, newId } from "./store";
import { generateScript } from "./ai";
import { synthesizeVoice } from "./tts";
import { renderReel } from "./render";
import { publishToInstagram, publishToLinkedIn } from "./linkedin";
import { notifyReelReady } from "./resend";

// The pipeline is the single source of truth for "what happens to a reel".
// Both the eve agent tools and the REST API routes call these functions.

export interface CreateInput {
  topic: string;
  brief?: string;
  characterId?: string;
  customCharacter?: Character | null;
  formats?: FormatKey[];
  backgroundUrl?: string | null;
  imageUrls?: string[];
  ownerEmail?: string | null;
}

export async function createReel(input: CreateInput): Promise<Reel> {
  const now = new Date().toISOString();
  const custom = input.customCharacter ?? null;
  const reel: Reel = {
    id: newId(),
    topic: input.topic,
    brief: input.brief || "",
    characterId: custom ? custom.id : getCharacter(input.characterId).id,
    customCharacter: custom,
    formats: input.formats?.length ? input.formats : DEFAULT_FORMATS,
    backgroundUrl: input.backgroundUrl ?? null,
    imageUrls: input.imageUrls || [],
    script: null,
    voiceUrl: null,
    voicePreviewText: null,
    renders: [],
    posts: [],
    status: "draft",
    ownerEmail: input.ownerEmail ?? null,
    createdAt: now,
    updatedAt: now,
  };
  return storeCreate(reel);
}

export async function generateScriptStep(reelId: string): Promise<Reel> {
  const reel = await mustGet(reelId);
  await updateReel(reelId, { status: "scripting" });
  const character = resolveCharacter(reel);
  const script = await generateScript({
    topic: reel.topic,
    brief: reel.brief,
    character,
    hasImages: reel.imageUrls.length > 0,
  });
  return (await updateReel(reelId, { script, status: "scripting" }))!;
}

export async function voiceStep(reelId: string): Promise<Reel> {
  const reel = await mustGet(reelId);
  if (!reel.script) throw new Error("Script required before voice");
  await updateReel(reelId, { status: "voicing" });
  const character = resolveCharacter(reel);
  const voice = await synthesizeVoice(reelId, reel.script, character);
  return (await updateReel(reelId, {
    voiceUrl: voice.url,
    voicePreviewText: voice.text,
    status: "voicing",
  }))!;
}

export async function renderStep(reelId: string): Promise<Reel> {
  const reel = await mustGet(reelId);
  if (!reel.script) throw new Error("Script required before render");
  await updateReel(reelId, { status: "rendering" });
  const character = resolveCharacter(reel);
  const renders = await renderReel({
    reelId,
    script: reel.script,
    character,
    imageUrls: reel.imageUrls,
    backgroundUrl: reel.backgroundUrl,
    voiceUrl: reel.voiceUrl,
    formats: reel.formats,
  });
  // After render the reel is ready for the human to review.
  return (await updateReel(reelId, { renders, status: "review" }))!;
}

/** Convenience: run script → voice → render in sequence. */
export async function buildReel(reelId: string): Promise<Reel> {
  await generateScriptStep(reelId);
  await voiceStep(reelId);
  return renderStep(reelId);
}

/** Fast path for the form UI: script + voice, then mark formats as preview-only
 * (the browser <Player> shows the reel instantly without a headless render). */
export async function previewReel(reelId: string): Promise<Reel> {
  await generateScriptStep(reelId);
  const reel = await voiceStep(reelId);
  const renders = reel.formats.map((format) => ({ format, url: null, previewOnly: true }));
  return (await updateReel(reelId, { renders, status: "review" }))!;
}

export async function setApproval(reelId: string, approved: boolean): Promise<Reel> {
  return (await updateReel(reelId, { status: approved ? "approved" : "rejected" }))!;
}

export async function publishStep(
  reelId: string,
  platforms: Array<"linkedin" | "instagram">,
): Promise<Reel> {
  const reel = await mustGet(reelId);
  await updateReel(reelId, { status: "publishing" });
  const posts: SocialPost[] = [];
  for (const p of platforms) {
    posts.push(p === "linkedin" ? await publishToLinkedIn(reel) : await publishToInstagram(reel));
  }
  const updated = (await updateReel(reelId, { posts, status: "published" }))!;
  await notifyReelReady(updated, "Your reel was published");
  return updated;
}

export async function notifyStep(reelId: string, event: string) {
  const reel = await mustGet(reelId);
  return notifyReelReady(reel, event);
}

async function mustGet(reelId: string): Promise<Reel> {
  const reel = await getReel(reelId);
  if (!reel) throw new Error(`Reel ${reelId} not found`);
  return reel;
}
