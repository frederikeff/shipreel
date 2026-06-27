"use client";

import { useEffect, useRef, useState } from "react";
import { CharacterPicker } from "./CharacterPicker";
import { FORMAT_LIST } from "@/lib/formats";
import type { Character, FormatKey } from "@/lib/types";

const SUGGESTIONS = [
  "Why a hackathon is the best place to learn to build",
  "How non-coders can ship real apps this weekend",
  "3 reasons to join the Vercel Ship hackathon",
];

const DEFAULT_PALETTE: [string, string, string] = ["#0b1020", "#7c5cff", "#f5f7ff"];

type CharMode = "library" | "tirida" | "upload" | "ai";
type BgMode = "none" | "upload" | "ai";

export function CreateForm({
  onCreated,
  busy,
  setBusy,
}: {
  onCreated: (reelId: string) => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
}) {
  const [topic, setTopic] = useState("");
  const [brief, setBrief] = useState("");
  const [email, setEmail] = useState("");
  const [formats, setFormats] = useState<Record<FormatKey, boolean>>({
    reel: true,
    square: true,
    wide: true,
  });

  // ── host selection ──
  const [charMode, setCharMode] = useState<CharMode>("library");
  const [characterId, setCharacterId] = useState("nova");
  const [custom, setCustom] = useState<Character | null>(null);
  const [charName, setCharName] = useState("");
  const [genPrompt, setGenPrompt] = useState("");
  const [genBusy, setGenBusy] = useState(false);
  const [tirida, setTirida] = useState<Character[] | null>(null);
  const charFileRef = useRef<HTMLInputElement>(null);

  // ── background ──
  const [bgMode, setBgMode] = useState<BgMode>("none");
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [bgPrompt, setBgPrompt] = useState("");
  const [bgBusy, setBgBusy] = useState(false);
  const bgFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (charMode === "tirida" && tirida === null) {
      fetch("/api/characters/tirida")
        .then((r) => r.json())
        .then((j) => setTirida(j.characters ?? []))
        .catch(() => setTirida([]));
    }
  }, [charMode, tirida]);

  async function uploadFiles(files: FileList): Promise<string[]> {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    return json.urls ?? [];
  }

  async function uploadCharacter(files: FileList) {
    setGenBusy(true);
    try {
      const [url] = await uploadFiles(files);
      if (url) {
        setCustom({
          id: `cust_up_${Date.now()}`,
          name: charName.trim() || "My Character",
          vibe: "a custom uploaded host",
          face: "🧑‍🎤",
          imageUrl: url,
          source: "upload",
          palette: DEFAULT_PALETTE,
          voice: "alloy",
        });
      }
    } finally {
      setGenBusy(false);
    }
  }

  async function generateCharacter() {
    if (!genPrompt.trim()) return;
    setGenBusy(true);
    try {
      const res = await fetch("/api/characters/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: genPrompt, name: charName || undefined }),
      });
      const json = await res.json();
      if (json.character) setCustom(json.character);
    } finally {
      setGenBusy(false);
    }
  }

  async function uploadBackground(files: FileList) {
    setBgBusy(true);
    try {
      const [url] = await uploadFiles(files);
      if (url) setBackgroundUrl(url);
    } finally {
      setBgBusy(false);
    }
  }

  async function generateBackground() {
    if (!bgPrompt.trim()) return;
    setBgBusy(true);
    try {
      const res = await fetch("/api/backgrounds/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: bgPrompt }),
      });
      const json = await res.json();
      if (json.url) setBackgroundUrl(json.url);
    } finally {
      setBgBusy(false);
    }
  }

  async function submit() {
    if (!topic.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/reels", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic,
          brief,
          characterId: charMode === "library" ? characterId : undefined,
          customCharacter: charMode === "library" ? null : custom,
          backgroundUrl: bgMode === "none" ? null : backgroundUrl,
          ownerEmail: email || null,
          formats: (Object.keys(formats) as FormatKey[]).filter((k) => formats[k]),
        }),
      });
      const json = await res.json();
      if (json.reel?.id) onCreated(json.reel.id);
    } finally {
      setBusy(false);
    }
  }

  const charTab = (mode: CharMode, label: string) => (
    <button
      onClick={() => setCharMode(mode)}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
        charMode === mode
          ? "bg-violet-500 text-white"
          : "bg-white/8 text-zinc-300 hover:bg-white/15 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  const bgTab = (mode: BgMode, label: string) => (
    <button
      onClick={() => setBgMode(mode)}
      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
        bgMode === mode
          ? "bg-sky-500 text-white"
          : "bg-white/8 text-zinc-300 hover:bg-white/15 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3.5 rounded-2xl border border-white/12 bg-white/[0.04] p-4">
      <div className="text-sm font-semibold text-white">Make a reel</div>

      <div>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What should the video be about?"
          className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-violet-400"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setTopic(s)}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300 hover:border-white/25 hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        placeholder="Notes / tone / key points (optional)"
        rows={2}
        className="w-full resize-none rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-violet-400"
      />

      {/* ── HOST ── */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-zinc-300">Host</span>
          {charTab("library", "🎭 Library")}
          {charTab("tirida", "🌍 My Cast")}
          {charTab("upload", "⬆️ Upload")}
          {charTab("ai", "✨ AI")}
        </div>

        {charMode === "library" && <CharacterPicker value={characterId} onChange={setCharacterId} />}

        {charMode === "tirida" && (
          <TiridaGrid
            list={tirida}
            selectedId={custom?.id ?? null}
            onPick={(c) => setCustom(c)}
          />
        )}

        {(charMode === "upload" || charMode === "ai") && (
          <div className="flex items-start gap-3 rounded-xl border border-white/12 bg-black/40 p-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/5">
              {custom?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={custom.imageUrl} alt={custom.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">
                  {charMode === "ai" ? "✨" : "🧑‍🎤"}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                placeholder="Host name (optional)"
                className="w-full rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-violet-400"
              />
              {charMode === "upload" ? (
                <>
                  <button
                    onClick={() => charFileRef.current?.click()}
                    disabled={genBusy}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-40"
                  >
                    {genBusy ? "Uploading…" : custom ? "Replace image" : "Upload character image"}
                  </button>
                  <input ref={charFileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files && uploadCharacter(e.target.files)} />
                </>
              ) : (
                <>
                  <textarea
                    value={genPrompt}
                    onChange={(e) => setGenPrompt(e.target.value)}
                    placeholder="Describe your character, e.g. 'a friendly purple robot owl with big glasses'"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-violet-400"
                  />
                  <button
                    onClick={generateCharacter}
                    disabled={genBusy || !genPrompt.trim()}
                    className="rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-400 disabled:opacity-40"
                  >
                    {genBusy ? "Generating… (~30s)" : "✨ Generate character"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── BACKGROUND ── */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-zinc-300">Background</span>
          {bgTab("none", "None")}
          {bgTab("upload", "⬆️ Upload")}
          {bgTab("ai", "✨ AI scene")}
        </div>
        {bgMode !== "none" && (
          <div className="flex items-start gap-3 rounded-xl border border-white/12 bg-black/40 p-3">
            <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md border border-white/15 bg-white/5">
              {backgroundUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={backgroundUrl} alt="background" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg">🖼</div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              {bgMode === "upload" ? (
                <>
                  <button
                    onClick={() => bgFileRef.current?.click()}
                    disabled={bgBusy}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-40"
                  >
                    {bgBusy ? "Uploading…" : backgroundUrl ? "Replace background" : "Upload background image"}
                  </button>
                  <input ref={bgFileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files && uploadBackground(e.target.files)} />
                </>
              ) : (
                <>
                  <textarea
                    value={bgPrompt}
                    onChange={(e) => setBgPrompt(e.target.value)}
                    placeholder="Describe the scene, e.g. 'neon hackathon stage with confetti'"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-sky-400"
                  />
                  <button
                    onClick={generateBackground}
                    disabled={bgBusy || !bgPrompt.trim()}
                    className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-400 disabled:opacity-40"
                  >
                    {bgBusy ? "Generating… (~30s)" : "✨ Generate background"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── FORMATS ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zinc-300">Formats</span>
        {FORMAT_LIST.map((f) => (
          <button
            key={f.key}
            onClick={() => setFormats((s) => ({ ...s, [f.key]: !s[f.key] }))}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              formats[f.key] ? "bg-white/20 text-white" : "bg-white/8 text-zinc-400 hover:text-white"
            }`}
          >
            {f.aspect}
          </button>
        ))}
      </div>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email for the 'done' notification (optional)"
        className="w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-violet-400"
      />

      <button
        onClick={submit}
        disabled={busy || !topic.trim() || (charMode !== "library" && !custom)}
        className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:from-violet-400 hover:to-fuchsia-400 disabled:opacity-40"
      >
        {busy ? "Producing…" : "Generate preview →"}
      </button>
    </div>
  );
}

function TiridaGrid({
  list,
  selectedId,
  onPick,
}: {
  list: Character[] | null;
  selectedId: string | null;
  onPick: (c: Character) => void;
}) {
  if (list === null) return <div className="py-3 text-xs text-zinc-400">Loading your cast from cdn.tirida.world…</div>;
  if (list.length === 0) return <div className="py-3 text-xs text-zinc-400">No characters found on the CDN.</div>;
  return (
    <div className="grid max-h-56 grid-cols-5 gap-2 overflow-y-auto sm:grid-cols-8">
      {list.map((c) => {
        const active = c.id === selectedId;
        return (
          <button
            key={c.id}
            type="button"
            title={`${c.name} — ${c.vibe}`}
            onClick={() => onPick(c)}
            className={`relative flex aspect-square flex-col items-center justify-end overflow-hidden rounded-xl border transition ${
              active ? "border-violet-400 ring-2 ring-violet-400/60" : "border-white/10 hover:border-white/30"
            }`}
            style={{ background: `${c.palette[1]}22` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.imageUrl} alt={c.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <span className="relative w-full truncate bg-black/60 px-1 text-center text-[8px] font-medium text-white">
              {c.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
