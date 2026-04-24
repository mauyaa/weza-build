import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { created } from "@/lib/api";
import { handleDomain, requireSession } from "@/lib/guard";
import { getMilestone, getSubmissionForMilestone, submitPackage } from "@/lib/repo";
import { storeFile } from "@/lib/storage";

const MAX_FILE_BYTES = 25 * 1024 * 1024;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSession();
  if (!("profile" in guard)) return guard;

  const contentType = req.headers.get("content-type") || "";
  let title = "";
  let note = "";
  let file: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    title = String(form.get("title") ?? "").trim();
    note = String(form.get("note") ?? "").trim();
    const uploaded = form.get("file");
    if (uploaded instanceof File && uploaded.size > 0) file = uploaded;
  } else {
    const body = await req.json().catch(() => null);
    if (!body) return handleDomain(new Error("Invalid body"));
    title = String(body.title ?? "").trim();
    note = String(body.note ?? "").trim();
    if (body.fileName) {
      try {
        const result = await submitPackage({
          milestoneId: params.id,
          actor: guard.profile,
          title,
          note,
          fileName: String(body.fileName),
          fileSize: Number(body.fileSize) || 0,
          fileSha256: crypto
            .createHash("sha256")
            .update(`${body.fileName}:${body.fileSize}:${Date.now()}`)
            .digest("hex"),
          storageKey: null,
        });
        return created(result, "Submission accepted", "submitted");
      } catch (err) {
        return handleDomain(err);
      }
    }
  }

  if (!title || title.length < 3) return handleDomain(new Error("Title is required"));
  if (!file) return handleDomain(new Error("Attach a drawing or evidence file"));
  if (file.size > MAX_FILE_BYTES) return handleDomain(new Error("File exceeds 25MB limit"));

  try {
    const milestone = await getMilestone(params.id);
    if (!milestone) return handleDomain(new Error("Milestone not found"));
    const existing = await getSubmissionForMilestone(milestone.id);
    const tentativeSubmissionId =
      existing?.id ?? `sub_tmp_${crypto.randomBytes(6).toString("hex")}`;
    const nextVersion = (existing?.current_version ?? 0) + 1;
    const stored = await storeFile(file, {
      submissionId: tentativeSubmissionId,
      version: nextVersion,
    });
    const result = await submitPackage({
      milestoneId: params.id,
      actor: guard.profile,
      title,
      note,
      fileName: file.name,
      fileSize: stored.sizeBytes,
      fileSha256: stored.sha256,
      storageKey: stored.storageKey,
    });
    return created(result, "Submission accepted", "submitted");
  } catch (err) {
    return handleDomain(err);
  }
}
