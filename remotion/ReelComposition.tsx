import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import type { Character, ReelScript } from "../lib/types";

// Zod schema so the composition props are editable/validated in Remotion Studio.
export const reelSchema = z.object({
  script: z.custom<ReelScript>(),
  character: z.custom<Character>(),
  imageUrls: z.array(z.string()),
  backgroundUrl: z.string().nullable(),
  voiceUrl: z.string().nullable(),
});

export type ReelProps = z.infer<typeof reelSchema>;

export function totalDurationInFrames(script: ReelScript): number {
  const sum = script.scenes.reduce((n, s) => n + s.durationInFrames, 0);
  return Math.max(sum, 30);
}

export const ReelComposition: React.FC<ReelProps> = ({
  script,
  character,
  imageUrls,
  backgroundUrl,
  voiceUrl,
}) => {
  const { width, height } = useVideoConfig();
  const [bg, accent, fg] = character.palette;
  const isVertical = height >= width;
  const unit = Math.min(width, height);

  // Cumulative scene start frames (drive the captions).
  const starts: number[] = [];
  let acc = 0;
  for (const s of script.scenes) {
    starts.push(acc);
    acc += s.durationInFrames;
  }

  // A full-scene character (e.g. tirida) already contains its environment, so it
  // becomes the frame itself rather than a sticker over a second background.
  const sceneFromCharacter = Boolean(character.fullScene && character.imageUrl);

  return (
    <AbsoluteFill style={{ backgroundColor: bg, fontFamily: "system-ui, sans-serif", overflow: "hidden" }}>
      {/* ---- background scene ---- */}
      {sceneFromCharacter ? (
        <FullBleedBackground src={character.imageUrl!} bg={bg} />
      ) : backgroundUrl ? (
        <FullBleedBackground src={backgroundUrl} bg={bg} />
      ) : imageUrls.length > 0 ? (
        script.scenes.map((_, i) => (
          <Sequence key={i} from={starts[i]} durationInFrames={script.scenes[i].durationInFrames}>
            <ImageBackdrop src={imageUrls[i % imageUrls.length]} bg={bg} />
          </Sequence>
        ))
      ) : (
        <AbsoluteFill
          style={{ background: `radial-gradient(120% 90% at 50% 15%, ${accent}33 0%, ${bg} 65%)` }}
        />
      )}

      {voiceUrl ? <Audio src={voiceUrl} /> : null}

      {/* ---- persistent cut-out host (only when not already the full scene) ---- */}
      {!sceneFromCharacter && (
        <CharacterStage character={character} accent={accent} fg={fg} unit={unit} isVertical={isVertical} />
      )}

      {/* ---- captions (top), one per scene ---- */}
      {script.scenes.map((scene, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={scene.durationInFrames}>
          <Caption text={scene.caption} accent={accent} fg={fg} unit={unit} isVertical={isVertical} />
        </Sequence>
      ))}

      {/* ---- host name lower-third ---- */}
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", padding: unit * 0.035 }}>
        <div
          style={{
            color: fg,
            opacity: 0.92,
            fontSize: unit * 0.03,
            fontWeight: 700,
            letterSpacing: 0.5,
            padding: `${unit * 0.012}px ${unit * 0.03}px`,
            borderRadius: 999,
            background: `${bg}88`,
            backdropFilter: "blur(6px)",
          }}
        >
          {character.name} · ShipReel
        </div>
      </AbsoluteFill>

      <ProgressBar accent={accent} total={totalDurationInFrames(script)} />
    </AbsoluteFill>
  );
};

const FullBleedBackground: React.FC<{ src: string; bg: string }> = ({ src, bg }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1.05, 1.2], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }} />
      {/* gradient: darker at very top (captions) and bottom (host base), lighter middle */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${bg}cc 0%, ${bg}22 28%, ${bg}10 55%, ${bg}cc 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

const ImageBackdrop: React.FC<{ src: string; bg: string }> = ({ src, bg }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 90], [1.08, 1.18], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${scale})` }} />
      <AbsoluteFill
        style={{ background: `linear-gradient(180deg, ${bg}bb 0%, ${bg}33 30%, ${bg}22 55%, ${bg}cc 100%)` }}
      />
    </AbsoluteFill>
  );
};

const CharacterStage: React.FC<{
  character: Character;
  accent: string;
  fg: string;
  unit: number;
  isVertical: boolean;
}> = ({ character, accent, fg, unit, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 110 } });
  const bob = Math.sin(frame / 6) * unit * 0.01;
  const talkSquash = 1 + Math.sin(frame / 2.4) * 0.015; // gentle "speaking"

  // Big, bottom-anchored host.
  const charH = isVertical ? height * 0.66 : height * 0.82;
  const charW = isVertical ? width * 0.92 : width * 0.5;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center" }}>
      {/* spotlight glow rising from behind the host, ties them to the scene */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: charW * 1.4,
          height: charH * 1.05,
          background: `radial-gradient(60% 60% at 50% 75%, ${accent}55 0%, ${accent}1a 45%, transparent 72%)`,
          filter: "blur(6px)",
        }}
      />
      {/* grounding contact shadow */}
      <div
        style={{
          position: "absolute",
          bottom: charH * 0.03,
          width: charW * 0.5,
          height: unit * 0.05,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.45)",
          filter: `blur(${unit * 0.02}px)`,
        }}
      />

      {/* the host image, feathered so any baked-in background melts into the scene */}
      <div
        style={{
          position: "relative",
          width: charW,
          height: charH,
          opacity: enter,
          transform: `translateY(${(1 - enter) * unit * 0.08 + bob}px) scaleY(${talkSquash})`,
          transformOrigin: "bottom center",
        }}
      >
        {character.imageUrl ? (
          <Img
            src={character.imageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "bottom center",
              // Feather the edges into the background (hides rectangular cut-outs).
              WebkitMaskImage:
                "radial-gradient(ellipse 78% 86% at 50% 46%, #000 62%, transparent 94%)",
              maskImage: "radial-gradient(ellipse 78% 86% at 50% 46%, #000 62%, transparent 94%)",
              filter: `drop-shadow(0 ${unit * 0.01}px ${unit * 0.02}px rgba(0,0,0,0.4))`,
            }}
          />
        ) : (
          <div style={{ display: "flex", height: "100%", alignItems: "flex-end", justifyContent: "center" }}>
            <span style={{ fontSize: charH * 0.55, lineHeight: 1 }}>{character.face}</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Caption: React.FC<{
  text: string;
  accent: string;
  fg: string;
  unit: number;
  isVertical: boolean;
}> = ({ text, accent, fg, unit, isVertical }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });
  const y = (1 - enter) * -unit * 0.05;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: unit * 0.07 }}>
      <div
        style={{
          maxWidth: unit * (isVertical ? 0.9 : 0.72),
          textAlign: "center",
          color: fg,
          fontSize: unit * (isVertical ? 0.072 : 0.058),
          fontWeight: 800,
          lineHeight: 1.08,
          opacity: enter,
          transform: `translateY(${y}px)`,
          padding: `${unit * 0.02}px ${unit * 0.045}px`,
          borderRadius: unit * 0.03,
          background: `${accent}26`,
          backdropFilter: "blur(8px)",
          boxShadow: `0 ${unit * 0.01}px ${unit * 0.04}px rgba(0,0,0,0.35)`,
          textShadow: `0 2px 18px rgba(0,0,0,0.5)`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC<{ accent: string; total: number }> = ({ accent, total }) => {
  const frame = useCurrentFrame();
  const pct = interpolate(frame, [0, total], [0, 100], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start" }}>
      <div style={{ height: 8, width: `${pct}%`, background: accent, opacity: 0.95 }} />
    </AbsoluteFill>
  );
};
