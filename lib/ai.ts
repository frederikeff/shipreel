import { generateObject } from "ai";
import { z } from "zod";
import type { Character, ReelScript } from "./types";

const FPS = 30;

// Vercel AI Gateway routes plain "provider/model" ids when AI_GATEWAY_API_KEY
// (or a linked Vercel OIDC token) is present.
const MODEL = process.env.SHIPREEL_SCRIPT_MODEL || "anthropic/claude-sonnet-4.6";

const SceneSchema = z.object({
  caption: z.string().describe("Punchy on-screen caption, max ~6 words"),
  voiceover: z
    .string()
    .describe("One spoken sentence the character says for this scene"),
  seconds: z.number().min(2).max(8).describe("How long this scene lasts"),
});

const ScriptSchema = z.object({
  title: z.string(),
  hook: z.string().describe("A scroll-stopping first line"),
  scenes: z.array(SceneSchema).min(3).max(6),
  cta: z.string().describe("Closing call to action"),
  postCaption: z
    .string()
    .describe("Social caption with 3-5 relevant hashtags"),
});

function toFrames(seconds: number): number {
  return Math.max(1, Math.round(seconds * FPS));
}

export function aiConfigured(): boolean {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY ||
      process.env.VERCEL_OIDC_TOKEN ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY,
  );
}

export interface ScriptInput {
  topic: string;
  brief: string;
  character: Character;
  hasImages: boolean;
}

/** Generate a multi-scene reel script. Real LLM when configured, else a
 * deterministic template so the pipeline always runs. */
export async function generateScript(input: ScriptInput): Promise<ReelScript> {
  if (!aiConfigured()) {
    return templateScript(input);
  }

  try {
    const { object } = await generateObject({
      model: MODEL,
      schema: ScriptSchema,
      prompt: buildPrompt(input),
    });
    return {
      title: object.title,
      hook: object.hook,
      cta: object.cta,
      postCaption: object.postCaption,
      scenes: object.scenes.map((s) => ({
        caption: s.caption,
        voiceover: s.voiceover,
        durationInFrames: toFrames(s.seconds),
      })),
    };
  } catch (err) {
    console.warn("[ai] generateObject failed, using template:", err);
    return templateScript(input);
  }
}

function buildPrompt({ topic, brief, character, hasImages }: ScriptInput): string {
  return [
    `You are ${character.name}, a cartoon video host. Personality: ${character.vibe}.`,
    `Write a short, punchy social video script (about 20-30 seconds total) about:`,
    `TOPIC: ${topic}`,
    brief ? `BRIEF / NOTES: ${brief}` : "",
    hasImages
      ? `The creator attached reference images that will appear behind you — reference "what you're seeing" naturally.`
      : "",
    `Stay fully in character. Keep captions tight. Make the hook stop the scroll.`,
    `Audience: builders and curious non-coders at a hackathon.`,
  ]
    .filter(Boolean)
    .join("\n");
}

// Deterministic fallback. Good enough to drive the whole pipeline without keys.
function templateScript({ topic, character }: ScriptInput): ReelScript {
  const t = topic.trim() || "building cool things at a hackathon";
  return {
    title: `${character.name} on: ${t}`,
    hook: `Hold on — you need to hear this about ${t}.`,
    cta: `That's your sign. Go build it. 🚀`,
    postCaption: `${capitalize(t)} — in 30 seconds, hosted by ${character.name}. #hackathon #buildinpublic #nocode #shipit`,
    scenes: [
      {
        caption: "Stop scrolling 🚀",
        voiceover: `Hey, it's ${character.name}. Quick one about ${t}.`,
        durationInFrames: toFrames(4),
      },
      {
        caption: "Here's the thing",
        voiceover: `You don't need to be a pro coder to bring a great idea to life.`,
        durationInFrames: toFrames(5),
      },
      {
        caption: "Why it matters",
        voiceover: `A hackathon gives you a weekend, a team, and tools that do the heavy lifting.`,
        durationInFrames: toFrames(6),
      },
      {
        caption: "Your move",
        voiceover: `Pick one idea, show up, and ship something real.`,
        durationInFrames: toFrames(5),
      },
      {
        caption: "Let's build 🔥",
        voiceover: `That's your sign. Go build it.`,
        durationInFrames: toFrames(4),
      },
    ],
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
