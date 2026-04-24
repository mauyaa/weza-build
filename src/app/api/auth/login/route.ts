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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fail(`Login service unavailable: ${message}`, "auth_unavailable", 503);
  }

  const profile = await getProfile(data.user.id).catch((err) => {
    throw new DomainError(
      "profile_lookup_failed",
      err instanceof Error ? err.message : String(err),
      503
    );
  });
  if (!profile) {
    return fail(
      "Signed in, but no WEZA profile exists. Re-run the seed script or create the profile trigger in Supabase.",
      "profile_missing",
      409
    );
  }
  return ok({ profile });
}
