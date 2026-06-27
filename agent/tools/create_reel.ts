import { defineTool } from "eve/tools";
import { z } from "zod";
import { createReel } from "../../lib/pipeline";
import { CHARACTERS } from "../../lib/characters";
import { DEFAULT_FORMATS } from "../../lib/formats";

const formatEnum = z.enum(["reel", "square", "wide"]);

export default defineTool({
  description:
    "Create a new ShipReel video project from a topic. Returns a reelId used by every later step. Pick a character whose vibe fits the topic.",
  inputSchema: z.object({
    topic: z.string().min(1).describe("What the video is about"),
    brief: z.string().optional().describe("Extra notes, tone, key points"),
    characterId: z
      .enum(CHARACTERS.map((c) => c.id) as [string, ...string[]])
      .optional()
      .describe("Which cartoon host presents the video"),
    formats: z.array(formatEnum).optional().describe("Output formats; defaults to all three"),
    ownerEmail: z.string().email().optional().describe("Where to send the done notification"),
  }),
  async execute({ topic, brief, characterId, formats, ownerEmail }) {
    const reel = await createReel({
      topic,
      brief,
      characterId,
      formats: (formats?.length ? formats : DEFAULT_FORMATS) as typeof DEFAULT_FORMATS,
      ownerEmail: ownerEmail ?? null,
    });
    return {
      reelId: reel.id,
      character: reel.characterId,
      formats: reel.formats,
      status: reel.status,
      note: "Next: call write_script with this reelId.",
    };
  },
});
