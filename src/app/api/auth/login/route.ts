import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase-server";
import { DomainError } from "@/lib/repo";
import { getProfile } from "@/lib/repo";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Email and password required", "validation", 400);

  let data;
  try {
    const supabase = supabaseServer();
    const result = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (result.error || !result.data.user) {
      return fail("Invalid email or password", "invalid_credentials", 401);
    }
    data = result.data;
  } catch {
    return fail(
      "Login is temporarily unavailable. Please ask the demo operator to verify Supabase configuration.",
      "auth_unavailable",
      503
    );
  }

  const profile = await getProfile(data.user.id).catch((err) => {
    const message = err instanceof Error ? err.message : String(err);
    return new DomainError("profile_lookup_failed", message, 503);
  });
  if (profile instanceof DomainError) {
    return fail(
      "Login profile lookup is temporarily unavailable. Please try again in a moment.",
      profile.code,
      profile.status
    );
  }
  if (!profile) {
    return fail(
      "This account is signed in but is not attached to a WEZA workspace. Ask the demo operator to reseed the demo accounts.",
      "profile_missing",
      409
    );
  }
  return ok({ profile });
}
