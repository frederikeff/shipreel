import { defineTool } from "eve/tools";
import { z } from "zod";
import { generateScriptStep } from "../../lib/pipeline";

export default defineTool({
  description:
    "Write the multi-scene video script for a reel using the AI Gateway, in the host character's voice. Call after create_reel.",
  inputSchema: z.object({
    reelId: z.string().describe("The reel to write a script for"),
  }),
  async execute({ reelId }) {
    const reel = await generateScriptStep(reelId);
    const s = reel.script!;
    return {
      reelId,
      title: s.title,
      hook: s.hook,
      scenes: s.scenes.map((sc) => ({ caption: sc.caption, voiceover: sc.voiceover })),
      cta: s.cta,
      postCaption: s.postCaption,
      note: "Next: call synthesize_voice.",
    };
  },
});
