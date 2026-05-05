import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  if (env.isSupabaseServerReady()) {
    const supabase = createServerClient(env.supabaseUrlForServer(), env.supabaseAnonKeyForServer(), {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          req.cookies.set({ name, value, ...options });
          res.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: CookieOptions) => {
          req.cookies.set({ name, value: "", ...options });
          res.cookies.set({ name, value: "", ...options });
        },
      },
    });

    await supabase.auth.getUser();
  }

  res.headers.set("x-weza-path", req.nextUrl.pathname);
  return res;
}

export const config = {
  matcher: ["/", "/signup", "/app/:path*"],
};
