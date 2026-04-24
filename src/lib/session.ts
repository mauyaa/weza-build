import { cache } from "react";
import { env } from "./env";
import { supabaseServer } from "./supabase-server";
import { getProfile } from "./repo";
import type { Profile } from "./types";

/**
 * Resolve the Supabase auth session to a `profiles` row.
 * Cached per request so multiple RSC components don't repeat the lookup.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  if (!env.isSupabaseServerReady()) return null;
  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return getProfile(data.user.id);
});

export async function requireProfile(): Promise<Profile> {
  const p = await getCurrentProfile();
  if (!p) throw new Error("unauthorized");
  return p;
}
