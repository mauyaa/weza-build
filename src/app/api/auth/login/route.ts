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

  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) return fail("Invalid email or password", "invalid_credentials", 401);

  const profile = await getProfile(data.user.id);
  if (!profile) {
    return fail(
      "Signed in, but no WEZA profile exists. Re-run the seed script or create the profile trigger in Supabase.",
      "profile_missing",
      409
    );
  }
  return ok({ profile });
}
