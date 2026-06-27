import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function supabaseConfigured(): boolean {
  return Boolean(URL && (SERVICE || ANON));
}

let _admin: SupabaseClient | null = null;

/** Server-side client with service-role key — bypasses RLS for the agent. */
export function supabaseAdmin(): SupabaseClient | null {
  if (!URL || !SERVICE) return null;
  if (!_admin) {
    _admin = createClient(URL, SERVICE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

export const SUPABASE_URL = URL;
export const SUPABASE_ANON_KEY = ANON;

// Storage bucket for rendered media when running against real Supabase.
export const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || "shipreel-media";

export async function uploadToSupabase(
  filename: string,
  data: Buffer | Uint8Array,
  contentType: string,
): Promise<string | null> {
  const client = supabaseAdmin();
  if (!client) return null;
  const { error } = await client.storage
    .from(MEDIA_BUCKET)
    .upload(filename, data, { contentType, upsert: true });
  if (error) {
    console.warn("[supabase] upload failed:", error.message);
    return null;
  }
  const { data: pub } = client.storage.from(MEDIA_BUCKET).getPublicUrl(filename);
  return pub.publicUrl;
}
