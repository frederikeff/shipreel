import { defineTool } from "eve/tools";
import { z } from "zod";
import { renderStep } from "../../lib/pipeline";

export default defineTool({
  description:
    "Render the reel into its output formats (vertical/square/wide) with Remotion. After this the reel is in 'review' and a human must approve before publishing. Call after synthesize_voice.",
  inputSchema: z.object({
    reelId: z.string(),
  }),
  async execute({ reelId }) {
    const reel = await renderStep(reelId);
    return {
      reelId,
      status: reel.status,
      renders: reel.renders.map((r) => ({
        format: r.format,
        url: r.url,
        previewOnly: r.previewOnly,
      })),
      note: "Reel is rendered and waiting for human review. Tell the user to review the preview, then call publish_reel — which will pause for their approval.",
    };
  },
});
