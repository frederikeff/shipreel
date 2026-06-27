"use client";

import { useEffect, useRef, useState } from "react";
import { useEveAgent } from "eve/react";

const STARTERS = [
  "Make a hype reel about joining a hackathon, hosted by Nova.",
  "Explain why non-coders can ship real apps, friendly tone, host Mango.",
];

// Pull a pending human-in-the-loop request off the latest message, if any.
function findInputRequest(messages: any[]) {
  const last = messages.at(-1);
  if (!last) return null;
  for (const part of last.parts ?? []) {
    const req = part?.toolMetadata?.eve?.inputRequest;
    if (part?.type === "dynamic-tool" && req && !req.responded) return req;
  }
  return null;
}

export function ProducerChat({ onActivity }: { onActivity: () => void }) {
  const agent = useEveAgent({
    onEvent: () => onActivity(),
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isBusy = agent.status === "submitted" || agent.status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [agent.data.messages]);

  const request = findInputRequest(agent.data.messages as any[]);

  function send(text: string) {
    const message = text.trim();
    if (!message || isBusy) return;
    setInput("");
    void agent.send({ message });
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="text-lg">🎬</span>
        <div>
          <div className="text-sm font-semibold">ShipReel Producer</div>
          <div className="text-[11px] text-zinc-400">eve agent · powered by Vercel AI Gateway</div>
        </div>
        <span
          className={`ml-auto h-2 w-2 rounded-full ${
            isBusy ? "animate-pulse bg-amber-400" : "bg-emerald-400"
          }`}
        />
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {agent.data.messages.length === 0 && (
          <div className="space-y-3 text-sm text-zinc-400">
            <p>Tell me what video you want and I’ll produce it — script, voice, render, then ship.</p>
            <div className="space-y-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="block w-full rounded-lg border border-white/10 px-3 py-2 text-left text-xs hover:border-white/30"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {(agent.data.messages as any[]).map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
            {(m.parts ?? []).map((part: any, i: number) => {
              if (part.type === "text" && part.text) {
                return (
                  <div
                    key={i}
                    className={`inline-block max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-violet-500/90 text-white"
                        : "bg-white/5 text-zinc-100"
                    }`}
                  >
                    {part.text}
                  </div>
                );
              }
              if (part.type === "dynamic-tool" || part.type?.startsWith?.("tool")) {
                const name = part.toolName ?? part.type?.replace?.("tool-", "") ?? "tool";
                return (
                  <div key={i} className="my-1 text-[11px] text-zinc-400">
                    <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono">⚙ {name}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}

        {/* Human-in-the-loop approval card */}
        {request && (
          <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3">
            <div className="mb-2 text-xs font-semibold text-amber-200">
              ✋ Approval needed
            </div>
            <p className="mb-3 text-sm text-amber-100/90">
              {request.prompt ?? "The producer wants to publish this reel. Approve?"}
            </p>
            <div className="flex gap-2">
              {(request.options ?? [
                { optionId: "approve", label: "Approve" },
                { optionId: "deny", label: "Deny" },
              ]).map((opt: any) => (
                <button
                  key={opt.optionId}
                  onClick={() =>
                    agent.send({
                      inputResponses: [{ requestId: request.requestId, optionId: opt.optionId }],
                    })
                  }
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    /deny|reject|no/i.test(opt.optionId + (opt.label ?? ""))
                      ? "bg-white/10 text-zinc-200 hover:bg-white/20"
                      : "bg-emerald-500 text-white hover:bg-emerald-400"
                  }`}
                >
                  {opt.label ?? opt.optionId}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-white/10 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isBusy}
          placeholder="Ask the producer…"
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-violet-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isBusy || !input.trim()}
          className="rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
