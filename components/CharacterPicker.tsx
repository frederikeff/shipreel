"use client";

import { CHARACTERS } from "@/lib/characters";

export function CharacterPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
      {CHARACTERS.map((c) => {
        const active = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            title={`${c.name} — ${c.vibe}`}
            onClick={() => onChange(c.id)}
            className={`group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border transition ${
              active
                ? "border-violet-400 ring-2 ring-violet-400/60"
                : "border-white/10 hover:border-white/30"
            }`}
            style={{ background: `${c.palette[1]}1f` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.imageUrl}
              alt={c.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <span className="absolute bottom-0 left-0 right-0 bg-black/55 text-center text-[9px] font-medium text-zinc-100">
              {c.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
