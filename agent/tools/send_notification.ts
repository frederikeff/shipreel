import { defineTool } from "eve/tools";
import { z } from "zod";
import { notifyStep } from "../../lib/pipeline";

export default defineTool({
  description:
    "Send the reel owner an email notification via Resend (e.g. 'your reel is ready to review' or 'your reel was published').",
  inputSchema: z.object({
    reelId: z.string(),
    event: z.string().describe("Short human-readable notification headline"),
  }),
  async execute({ reelId, event }) {
    const result = await notifyStep(reelId, event);
    return { reelId, ...result };
  },
});
