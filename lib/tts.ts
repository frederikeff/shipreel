import type { Character, ReelScript } from "./types";
import { saveMedia } from "./files";

// Text-to-speech. Real voiceover when an OpenAI or ElevenLabs key is present,
// otherwise we skip audio and the reel plays as a silent captioned video.
export function ttsConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ELEVENLABS_API_KEY);
}

export interface VoiceResult {
  url: string | null;
  text: string;
  provider: "openai" | "elevenlabs" | "none";
}

export async function synthesizeVoice(
  reelId: string,
  script: ReelScript,
  character: Character,
): Promise<VoiceResult> {
  const text = [script.hook, ...script.scenes.map((s) => s.voiceover), script.cta].join(" ");

  if (process.env.OPENAI_API_KEY) {
    try {
      const url = await openaiTTS(reelId, text, character.voice);
      return { url, text, provider: "openai" };
    } catch (err) {
      console.warn("[tts] OpenAI TTS failed:", err);
    }
  }

  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const url = await elevenLabsTTS(reelId, text);
      return { url, text, provider: "elevenlabs" };
    } catch (err) {
      console.warn("[tts] ElevenLabs TTS failed:", err);
    }
  }

  return { url: null, text, provider: "none" };
}

async function openaiTTS(reelId: string, text: string, voice: string): Promise<string> {
  // OpenAI voice ids are a fixed set; map unknown persona voices to "alloy".
  const known = new Set(["alloy", "echo", "fable", "onyx", "nova", "shimmer", "coral", "verse", "ash", "sage", "ballad"]);
  const v = known.has(voice) ? voice : "alloy";
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.SHIPREEL_TTS_MODEL || "gpt-4o-mini-tts",
      voice: v,
      input: text,
      response_format: "mp3",
    }),
  });
  if (!res.ok) throw new Error(`OpenAI TTS ${res.status}: ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return saveMedia(`voice-${reelId}.mp3`, buf);
}

async function elevenLabsTTS(reelId: string, text: string): Promise<string> {
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      "content-type": "application/json",
    },
    body: JSON.stringify({ text, model_id: "eleven_turbo_v2_5" }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return saveMedia(`voice-${reelId}.mp3`, buf);
}
