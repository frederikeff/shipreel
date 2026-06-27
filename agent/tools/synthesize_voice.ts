import { defineTool } from "eve/tools";
import { z } from "zod";
import { voiceStep } from "../../lib/pipeline";

export default defineTool({
  description:
    "Generate the character's spoken voiceover (text-to-speech) for the reel's script. Call after write_script.",
  inputSchema: z.object({
    reelId: z.string(),
  }),
  async execute({ reelId }) {
    const reel = await voiceStep(reelId);
    return {
      reelId,
      hasAudio: Boolean(reel.voiceUrl),
      voiceUrl: reel.voiceUrl,
      note: reel.voiceUrl
        ? "Voiceover ready. Next: call render_reel."
        : "No TTS key configured — reel will play with captions only. Next: call render_reel.",
    };
  },
});
