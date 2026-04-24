import crypto from "node:crypto";
import { env } from "./env";
import { supabaseService } from "./supabase-service";

export interface StoredFile {
  storageKey: string;
  sha256: string;
  sizeBytes: number;
}

/**
 * Store an uploaded submission file in Supabase Storage. The storageKey is a
 * bucket-relative path we persist on the submission_versions row.
 */
export async function storeFile(
  file: File,
  opts: { submissionId: string; version: number }
): Promise<StoredFile> {
  const buf = Buffer.from(await file.arrayBuffer());
  const sha = crypto.createHash("sha256").update(buf).digest("hex");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "file.bin";
  const storageKey = `${opts.submissionId}/v${opts.version}-${safeName}`;
  const bucket = env.storageBucket();
  const { error } = await supabaseService()
    .storage.from(bucket)
    .upload(storageKey, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return { storageKey, sha256: sha, sizeBytes: buf.byteLength };
}

/**
 * Produce a short-lived signed URL for a stored submission file. Called only
 * from the server after the caller's role/project membership has been
 * verified. TTL is intentionally short (5 minutes).
 */
export async function createDownloadUrl(
  storageKey: string,
  options: { downloadName?: string; ttlSeconds?: number } = {}
): Promise<string> {
  const bucket = env.storageBucket();
  const { data, error } = await supabaseService()
    .storage.from(bucket)
    .createSignedUrl(storageKey, options.ttlSeconds ?? 300, {
      download: options.downloadName ?? true,
    });
  if (error || !data?.signedUrl) throw new Error(`Could not sign URL: ${error?.message ?? "unknown"}`);
  return data.signedUrl;
}
