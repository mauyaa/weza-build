import { NextResponse } from "next/server";
import { fail } from "./api";
import { getCurrentProfile } from "./session";
import type { Profile } from "./types";
import { DomainError } from "./repo";

export async function requireSession(): Promise<{ profile: Profile } | NextResponse> {
  const profile = await getCurrentProfile();
  if (!profile) return fail("Not signed in", "unauthorized", 401);
  return { profile };
}

export function handleDomain(err: unknown): NextResponse {
  if (err instanceof DomainError) {
    return fail(err.message, err.code, err.status, err.details);
  }
  const message = err instanceof Error ? err.message : String(err);
  return fail(message, "internal", 500);
}
