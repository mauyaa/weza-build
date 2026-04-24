import { NextResponse } from "next/server";
import type { ApiEnvelope } from "./types";

export function ok<T>(data: T, message = "OK", code = "ok"): NextResponse {
  const body: ApiEnvelope<T> = { success: true, message, code, data };
  return NextResponse.json(body, { status: 200 });
}

export function created<T>(data: T, message = "Created", code = "created"): NextResponse {
  const body: ApiEnvelope<T> = { success: true, message, code, data };
  return NextResponse.json(body, { status: 201 });
}

export function fail(
  message: string,
  code = "error",
  status = 400,
  details?: Record<string, unknown>
): NextResponse {
  const body: ApiEnvelope<null> = {
    success: false,
    message,
    code,
    data: null,
    details: details ?? null,
  };
  return NextResponse.json(body, { status });
}
