import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { env } from "./env";

export function supabaseServer() {
  const url = env.supabaseUrlForServer();
  const anonKey = env.supabaseAnonKeyForServer();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase URL/anon key missing. In Vercel add SUPABASE_URL + SUPABASE_ANON_KEY (same values as Project URL and anon key), or set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY and redeploy."
    );
  }
  const store = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      get: (name: string) => store.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        try {
          store.set({ name, value, ...options });
        } catch {
          // called from a server component where mutation is not allowed
        }
      },
      remove: (name: string, options: CookieOptions) => {
        try {
          store.set({ name, value: "", ...options });
        } catch {
          // ignored in read-only context
        }
      },
    },
  });
}
