import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Service-role Supabase client for privileged server-side operations:
 * auth admin (creating users in tests/seed), storage uploads, storage
 * signed URLs. RLS is bypassed by this client. Never import it from a
 * client component.
 */
let _client: SupabaseClient | null = null;

export function supabaseService(): SupabaseClient {
  if (_client) return _client;
  if (!env.isSupabaseServerReady()) {
    throw new Error(
      "Supabase URL/anon key missing — cannot create service client. Configure Vercel env vars (see scripts/sync-vercel-env.mjs)."
    );
  }
  _client = createClient(env.supabaseUrlForServer(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "public" },
  });
  return _client;
}
