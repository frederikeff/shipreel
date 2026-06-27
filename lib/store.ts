import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Reel } from "./types";
import { supabaseAdmin, supabaseConfigured } from "./supabase";

// Data access layer. Uses Supabase Postgres when configured; otherwise persists
// to a local JSON file so the whole app runs with zero external services.

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "reels.json");
const TABLE = "reels";

// ---- id generation (no Math.random dependency for SSR determinism) ----
let counter = 0;
export function newId(): string {
  counter += 1;
  const stamp = Date.now().toString(36);
  return `r_${stamp}_${counter.toString(36)}`;
}

// ---------------- JSON-file backend ----------------
async function readFileStore(): Promise<Record<string, Reel>> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as Record<string, Reel>;
  } catch {
    return {};
  }
}

async function writeFileStore(all: Record<string, Reel>): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(all, null, 2));
}

// ---------------- public API ----------------
export async function createReel(reel: Reel): Promise<Reel> {
  if (supabaseConfigured()) {
    const client = supabaseAdmin();
    if (client) {
      const { error } = await client.from(TABLE).insert(toRow(reel));
      if (error) console.warn("[store] supabase insert failed:", error.message);
      else return reel;
    }
  }
  const all = await readFileStore();
  all[reel.id] = reel;
  await writeFileStore(all);
  return reel;
}

export async function getReel(id: string): Promise<Reel | null> {
  if (supabaseConfigured()) {
    const client = supabaseAdmin();
    if (client) {
      const { data, error } = await client.from(TABLE).select("data").eq("id", id).maybeSingle();
      if (!error && data) return data.data as Reel;
    }
  }
  const all = await readFileStore();
  return all[id] ?? null;
}

export async function updateReel(id: string, patch: Partial<Reel>): Promise<Reel | null> {
  const current = await getReel(id);
  if (!current) return null;
  const next: Reel = { ...current, ...patch, updatedAt: new Date().toISOString() };

  if (supabaseConfigured()) {
    const client = supabaseAdmin();
    if (client) {
      const { error } = await client.from(TABLE).update(toRow(next)).eq("id", id);
      if (error) console.warn("[store] supabase update failed:", error.message);
      else return next;
    }
  }
  const all = await readFileStore();
  all[id] = next;
  await writeFileStore(all);
  return next;
}

export async function listReels(limit = 50): Promise<Reel[]> {
  if (supabaseConfigured()) {
    const client = supabaseAdmin();
    if (client) {
      const { data, error } = await client
        .from(TABLE)
        .select("data")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!error && data) return data.map((r) => r.data as Reel);
    }
  }
  const all = await readFileStore();
  return Object.values(all)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}

// Map our Reel object to the table's columns. The full object lives in a JSONB
// `data` column; top-level columns mirror the queryable fields.
function toRow(reel: Reel) {
  return {
    id: reel.id,
    topic: reel.topic,
    character_id: reel.characterId,
    status: reel.status,
    owner_email: reel.ownerEmail,
    created_at: reel.createdAt,
    updated_at: reel.updatedAt,
    data: reel,
  };
}
