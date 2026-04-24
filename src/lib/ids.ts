import crypto from "node:crypto";

export function newId(prefix: string): string {
  const rand = crypto.randomBytes(8).toString("hex");
  return `${prefix}_${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function sha256(input: string | Buffer): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}
