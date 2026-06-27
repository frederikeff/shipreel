"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CreateForm } from "./CreateForm";
import { ProducerChat } from "./ProducerChat";
import { ReelPreview } from "./ReelPreview";
import type { Reel } from "@/lib/types";

const STACK = [
  "eve agent",
  "AI Gateway",
  "Remotion",
  "Supabase",
  "Auth0",
  "Resend",
];

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
    <div className="flex min-h-screen flex-col">
      {/* ── top bar ── */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0a12]/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg shadow-lg shadow-violet-500/30">
              🚀
            </span>
            <div className="leading-tight">
              <div className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-base font-extrabold tracking-tight text-transparent">
                ShipReel
              </div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                AI video producer
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <a
              href="https://shipreel-one.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-medium text-emerald-300 sm:flex"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> live
            </a>
            {user?.email ? (
              <span className="text-zinc-300">
                {user.email} ·{" "}
                <a href="/auth/logout" className="underline hover:text-white">
                  log out
                </a>
              </span>
            ) : (
              <a
                href="/auth/login"
                className="rounded-lg border border-white/15 px-3 py-1.5 font-medium text-zinc-200 hover:border-white/30 hover:bg-white/10"
              >
                Log in with Auth0
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── hero ── */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-8 pb-2 text-center">
        <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-zinc-300">
          <span className="text-fuchsia-300">✦</span> Built at the Vercel Ship hackathon
        </div>
        <h1 className="mx-auto max-w-3xl text-balance text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
          Say it. A cartoon host turns it into a{" "}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
            multi-format reel
          </span>{" "}
          — and ships it.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400 sm:text-base">
          An AI agent scripts it, voices it, renders it in 3 formats, and waits for{" "}
          <span className="font-medium text-zinc-200">your approval</span> before it posts.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
          {STACK.map((s) => (
            <span
              key={s}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-300"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* ── workspace ── */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
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
            <div className="min-h-[380px] flex-1">
              <ProducerChat onActivity={refresh} />
            </div>
          </div>
          <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
            <ReelPreview reel={reel} onPublish={publish} onRender={render} busy={busy} />
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-5 text-center text-[11px] text-zinc-500">
        ShipReel · tell it a topic, approve, ship ·{" "}
        <a className="underline hover:text-zinc-300" href="https://github.com/frederikeff/shipreel" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
}
