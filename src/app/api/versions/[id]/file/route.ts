import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { requireSession } from "@/lib/guard";
import { query } from "@/lib/db";
import { getMilestone, getProject } from "@/lib/repo";
import { createDownloadUrl } from "@/lib/storage";
import type { Submission, SubmissionVersion } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSession();
  if (!("profile" in guard)) return guard;
  const versionRes = await query<SubmissionVersion>(
    "SELECT * FROM submission_versions WHERE id = $1",
    [params.id]
  );
  const version = versionRes.rows[0];
  if (!version) return fail("Not found", "not_found", 404);
  const subRes = await query<Submission>("SELECT * FROM submissions WHERE id = $1", [version.submission_id]);
  const sub = subRes.rows[0];
  if (!sub) return fail("Not found", "not_found", 404);
  const milestone = await getMilestone(sub.milestone_id);
  if (!milestone) return fail("Not found", "not_found", 404);
  const project = (await getProject(milestone.project_id))!;
  const p = guard.profile;
  const allowed =
    (p.role === "owner" && project.owner_id === p.id) ||
    (p.role === "certifier" && project.certifier_id === p.id) ||
    (p.role === "contractor" && project.contractor_id === p.id);
  if (!allowed) return fail("Forbidden", "forbidden", 403);
  if (!version.storage_key) return fail("File not available (metadata-only)", "no_file", 404);

  const url = await createDownloadUrl(version.storage_key, { downloadName: version.file_name });
  return NextResponse.redirect(url, { status: 302 });
}
