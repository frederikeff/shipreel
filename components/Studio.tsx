"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CreateForm } from "./CreateForm";
import { ProducerChat } from "./ProducerChat";
import { ReelPreview } from "./ReelPreview";
import type { Reel } from "@/lib/types";

export function Studio({ user }: { user: { email?: string | null } | null }) {
  const [reel, setReel] = useState<Reel | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selectedId;

  const refresh = useCallback(async () => {
    const id = selectedRef.current;
    const url = id ? `/api/reels/${id}` : "/api/reels?latest=1";
    try {
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (json.reel) {
        setReel(json.reel);
        if (!selectedRef.current) setSelectedId(json.reel.id);
      }
    } catch {
      /* ignore transient poll errors */
    }
  }, []);

  // Poll for live updates as the agent / pipeline progresses.
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, [refresh]);

  async function publish(platforms: Array<"linkedin" | "instagram">) {
    if (!reel || !platforms.length) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reels/${reel.id}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platforms }),
      });
      const json = await res.json();
      if (json.reel) setReel(json.reel);
    } finally {
      setBusy(false);
    }
  }

  async function render() {
    if (!reel) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reels/${reel.id}/render`, { method: "POST" });
      const json = await res.json();
      if (json.reel) setReel(json.reel);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-5">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <div>
            <h1 className="text-lg font-bold leading-none">ShipReel</h1>
            <p className="text-[11px] text-zinc-400">
              Say it → we script, voice, render &amp; ship it. You approve before it posts.
            </p>
          </div>
        </div>
        <div className="text-xs text-zinc-400">
          {user?.email ? (
            <span>
              {user.email} ·{" "}
              <a href="/auth/logout" className="underline hover:text-white">
                log out
              </a>
            </span>
          ) : (
            <a href="/auth/login" className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10">
              Log in with Auth0
            </a>
          )}
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* left: create + chat */}
        <div className="flex min-h-0 flex-col gap-4">
          <CreateForm
            busy={busy}
            setBusy={setBusy}
            onCreated={(id) => {
              setSelectedId(id);
              selectedRef.current = id;
              refresh();
            }}
          />
          <div className="min-h-[360px] flex-1">
            <ProducerChat onActivity={refresh} />
          </div>
        </div>

        {/* right: live preview */}
        <div className="min-h-[520px]">
          <ReelPreview reel={reel} onPublish={publish} onRender={render} busy={busy} />
        </div>
      </div>

      <footer className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400">
        <span>eve agent ⚡</span>
        <span>Vercel AI Gateway 🧠</span>
        <span>Remotion 🎞</span>
        <span>Supabase 🗄</span>
        <span>Auth0 🔐</span>
        <span>Resend ✉️</span>
        <span>LinkedIn 🔗</span>
      </footer>
    </div>
  );
}
