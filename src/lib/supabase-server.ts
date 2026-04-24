import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { env } from "./env";

export function supabaseServer() {
  const store = cookies();
  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
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
