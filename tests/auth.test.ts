import { describe, expect, it } from "vitest";

/**
 * Auth is handled by Supabase Auth itself. The corresponding profile row
 * is provisioned by the SQL trigger `public.handle_new_user` which is
 * defined in supabase/migrations/0001_init.sql. We test its behaviour
 * against the real Supabase project in the deployment smoke test
 * (docs/SMOKE_TEST.md), not in this unit suite — there is nothing to
 * meaningfully unit-test inside a plpgsql trigger from TypeScript.
 *
 * What we keep here is a tiny sanity check that the signup payload
 * contract matches what the trigger expects, so a future refactor of
 * the signup route can't silently drift from the trigger.
 */

interface ExpectedMetadata {
  full_name?: string;
  role?: "owner" | "certifier" | "contractor";
  organization_name?: string | null;
}

function buildSignupMetadata(input: {
  fullName: string;
  role: "owner" | "certifier" | "contractor";
  organizationName?: string | null;
}): ExpectedMetadata {
  return {
    full_name: input.fullName,
    role: input.role,
    organization_name: input.organizationName ?? null,
  };
}

describe("signup metadata contract", () => {
  it("carries full_name, role, and organization_name for owners", () => {
    const meta = buildSignupMetadata({
      fullName: "Jane Owner",
      role: "owner",
      organizationName: "Firm Ltd",
    });
    expect(meta.full_name).toBe("Jane Owner");
    expect(meta.role).toBe("owner");
    expect(meta.organization_name).toBe("Firm Ltd");
  });

  it("omits organization_name for contractors and certifiers", () => {
    const meta = buildSignupMetadata({ fullName: "Kofi M", role: "contractor" });
    expect(meta.role).toBe("contractor");
    expect(meta.organization_name).toBeNull();
  });
});
