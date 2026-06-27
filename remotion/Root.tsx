import React from "react";
import { Composition } from "remotion";
import { ReelComposition, reelSchema, totalDurationInFrames, type ReelProps } from "./ReelComposition";
import { FORMATS } from "../lib/formats";
import { CHARACTERS } from "../lib/characters";
import type { FormatKey, ReelScript } from "../lib/types";

const SAMPLE_SCRIPT: ReelScript = {
  title: "Nova on: shipping at a hackathon",
  hook: "Hold on — you need to hear this.",
  cta: "Go build it. 🚀",
  postCaption: "Why hackathons are the fastest way to learn to build. #hackathon #buildinpublic #shipit",
  scenes: [
    { caption: "Stop scrolling 🚀", voiceover: "Hey, it's Nova.", durationInFrames: 120 },
    { caption: "You can build this", voiceover: "You don't need to be a pro coder.", durationInFrames: 150 },
    { caption: "Why it matters", voiceover: "A weekend, a team, and tools that do the heavy lifting.", durationInFrames: 180 },
    { caption: "Let's build 🔥", voiceover: "That's your sign. Go build it.", durationInFrames: 120 },
  ],
};

const DEFAULT_PROPS: ReelProps & { format: FormatKey } = {
  script: SAMPLE_SCRIPT,
  character: CHARACTERS[0],
  imageUrls: [],
  backgroundUrl: null,
  voiceUrl: null,
  format: "reel",
};

// One composition id ("Reel"); the format in inputProps drives dimensions/fps,
// the script drives duration. The Next renderer and the browser <Player> both
// reuse <ReelComposition> directly.
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={ReelComposition}
      schema={reelSchema}
      defaultProps={DEFAULT_PROPS}
      // Provisional values; overridden by calculateMetadata.
      durationInFrames={totalDurationInFrames(SAMPLE_SCRIPT)}
      fps={30}
      width={1080}
      height={1920}
      calculateMetadata={({ props }) => {
        const format = (props as ReelProps & { format?: FormatKey }).format ?? "reel";
        const spec = FORMATS[format];
        return {
          durationInFrames: totalDurationInFrames(props.script),
          fps: spec.fps,
          width: spec.width,
          height: spec.height,
        };
      }}
    />
  );
};
