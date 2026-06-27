"use client";

import { useMemo, useState } from "react";
import { Player } from "@remotion/player";
import { ReelComposition, totalDurationInFrames } from "@/remotion/ReelComposition";
import { FORMATS, FORMAT_LIST } from "@/lib/formats";
import { getCharacter } from "@/lib/characters";
import type { FormatKey, Reel } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  scripting: "Writing script…",
  voicing: "Recording voiceover…",
  rendering: "Rendering…",
  review: "Ready for your review",
  approved: "Approved",
  publishing: "Publishing…",
  published: "Published 🎉",
  rejected: "Rejected",
  failed: "Failed",
};

export function ReelPreview({
  reel,
  onPublish,
  onRender,
  busy,
}: {
  reel: Reel | null;
  onPublish: (platforms: Array<"linkedin" | "instagram">) => void;
  onRender: () => void;
  busy: boolean;
}) {
  const [format, setFormat] = useState<FormatKey>("reel");
  const [platforms, setPlatforms] = useState<Record<"linkedin" | "instagram", boolean>>({
    linkedin: true,
    instagram: false,
  });

  const spec = FORMATS[format];
  const character = reel?.customCharacter ?? getCharacter(reel?.characterId);

  const inputProps = useMemo(() => {
    if (!reel?.script) return null;
    return {
      script: reel.script,
      character,
      imageUrls: reel.imageUrls,
      backgroundUrl: reel.backgroundUrl ?? null,
      voiceUrl: reel.voiceUrl,
    };
  }, [reel?.script, reel?.imageUrls, reel?.backgroundUrl, reel?.voiceUrl, character]);

  if (!reel) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] p-10 text-center text-zinc-400">
        <div className="text-5xl">🎬</div>
        <p className="max-w-xs text-sm">
          No reel yet. Use the form or ask the Producer on the left to make one — it’ll appear here
          live as it’s built.
        </p>
      </div>
    );
  }

  const durationInFrames = reel.script ? totalDurationInFrames(reel.script) : 1;
  const canPublish = reel.status === "review" || reel.status === "approved";
  const renderByFormat = new Map(reel.renders.map((r) => [r.format, r]));

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-white/12 bg-white/[0.04] p-4">
      {/* status row */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-400">Preview</div>
          <div className="text-sm font-semibold">
            {reel.script?.title || reel.topic}
          </div>
        </div>
        <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300">
          {STATUS_LABEL[reel.status] ?? reel.status}
        </span>
      </div>

      {/* format tabs */}
      <div className="flex gap-1.5">
        {FORMAT_LIST.map((f) => (
          <button
            key={f.key}
            onClick={() => setFormat(f.key)}
            className={`rounded-lg px-2.5 py-1 text-xs transition ${
              format === f.key
                ? "bg-white/15 text-white"
                : "bg-white/5 text-zinc-400 hover:text-white"
            }`}
          >
            {f.aspect} {f.label}
          </button>
        ))}
      </div>

      {/* player */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-black">
        {inputProps ? (
          <div
            style={{
              aspectRatio: `${spec.width} / ${spec.height}`,
              maxHeight: "100%",
              maxWidth: "100%",
              height: spec.height >= spec.width ? "100%" : undefined,
              width: spec.width > spec.height ? "100%" : undefined,
            }}
          >
            <Player
              component={ReelComposition}
              inputProps={inputProps}
              durationInFrames={durationInFrames}
              fps={spec.fps}
              compositionWidth={spec.width}
              compositionHeight={spec.height}
              style={{ width: "100%", height: "100%" }}
              controls
              loop
            />
          </div>
        ) : (
          <div className="p-10 text-sm text-zinc-400">Building the reel…</div>
        )}
      </div>

      {/* render status */}
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        {FORMAT_LIST.map((f) => {
          const r = renderByFormat.get(f.key);
          const state = !r ? "queued" : r.previewOnly ? "preview" : "mp4";
          return (
            <span
              key={f.key}
              className={`rounded px-2 py-0.5 ${
                state === "mp4"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : state === "preview"
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-white/5 text-zinc-400"
              }`}
            >
              {f.aspect} {state === "mp4" ? "mp4 ✓" : state === "preview" ? "preview" : "—"}
              {r?.url ? (
                <a
                  className="ml-1 font-semibold underline underline-offset-2"
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  download={`shipreel-${reel.id}-${f.key}.mp4`}
                >
                  ⬇ download
                </a>
              ) : null}
            </span>
          );
        })}
      </div>

      {/* publish controls */}
      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="mb-2 text-xs font-medium text-zinc-300">Human-in-the-loop · ship it</div>
        {reel.posts.length > 0 && (
          <ul className="mb-2 space-y-1 text-[11px] text-zinc-400">
            {reel.posts.map((p, i) => (
              <li key={i}>
                {p.platform === "linkedin" ? "in" : "ig"} · <b>{p.status}</b>
                {p.url ? (
                  <a className="ml-1 underline" href={p.url} target="_blank" rel="noreferrer">
                    view
                  </a>
                ) : (
                  p.detail && <span className="ml-1 opacity-70">— {p.detail}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {(["linkedin", "instagram"] as const).map((p) => (
            <label key={p} className="flex items-center gap-1.5 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={platforms[p]}
                onChange={(e) => setPlatforms((s) => ({ ...s, [p]: e.target.checked }))}
              />
              {p === "linkedin" ? "LinkedIn" : "Instagram"}
            </label>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              onClick={onRender}
              disabled={busy || !reel.script}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/10 disabled:opacity-40"
              title="Render real mp4 files with Remotion"
            >
              Render mp4
            </button>
            <button
              onClick={() =>
                onPublish(
                  (Object.keys(platforms) as Array<"linkedin" | "instagram">).filter(
                    (k) => platforms[k],
                  ),
                )
              }
              disabled={busy || !canPublish}
              className="rounded-lg bg-violet-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-400 disabled:opacity-40"
            >
              Approve &amp; Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
