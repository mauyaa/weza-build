import { NextRequest } from "next/server";
import { z } from "zod";
import { Keypair } from "@solana/web3.js";
import { created, fail } from "@/lib/api";
import { handleDomain } from "@/lib/guard";
import { supabaseServer } from "@/lib/supabase-server";
import { query } from "@/lib/db";
import { env } from "@/lib/env";
import { getProfile } from "@/lib/repo";

const schema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["owner", "certifier", "contractor"]),
  organizationName: z.string().max(120).optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!env.allowPublicSignup()) {
      return fail("Public signup is disabled for this demo. Use the seeded judge accounts.", "signup_disabled", 403);
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return handleDomain(new Error(parsed.error.issues[0]?.message ?? "Invalid signup"));
    }
    const { fullName, email, password, role, organizationName } = parsed.data;

    const supabase = supabaseServer();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          organization_name: organizationName ?? null,
        },
      },
    });
    if (error) return handleDomain(new Error(error.message));
    if (!data.user) return handleDomain(new Error("Signup did not return a user"));

    // The handle_new_user trigger created the profiles row. Add a wallet (demo
    // keypair) for role-appropriate users so the approval path has a recipient.
    if (role === "contractor" || role === "owner") {
      const wallet = Keypair.generate().publicKey.toBase58();
      await query("UPDATE profiles SET wallet_address = $1 WHERE id = $2", [wallet, data.user.id]);
    }

    const profile = await getProfile(data.user.id);
    return created({ profile }, "Account created", "signed_up");
  } catch (err) {
    if (err instanceof Error && err.message.includes("Supabase URL/anon key missing")) {
      return fail(
        "Signup service unavailable. The deployment is missing Supabase configuration.",
        "auth_unavailable",
        503
      );
    }
    return handleDomain(err);
  }
}
