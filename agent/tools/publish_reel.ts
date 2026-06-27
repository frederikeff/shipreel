import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { publishStep, setApproval } from "../../lib/pipeline";

export default defineTool({
  description:
    "Publish the rendered reel to the chosen social platforms. This is the human-in-the-loop gate: it pauses for the human to approve before anything is posted. Only call once the reel is rendered and the user wants to ship.",
  inputSchema: z.object({
    reelId: z.string(),
    platforms: z
      .array(z.enum(["linkedin", "instagram"]))
      .min(1)
      .describe("Where to publish"),
  }),
  // Human-in-the-loop: eve pauses the session here until a person approves.
  approval: always(),
  async execute({ reelId, platforms }) {
    // Reaching execute means a human approved.
    await setApproval(reelId, true);
    const reel = await publishStep(reelId, platforms);
    return {
      reelId,
      status: reel.status,
      posts: reel.posts,
      note: "Published. A Resend notification was sent if an email is configured.",
    };
  },
});
