import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { requireSession } from "@/lib/guard";
import { getMilestone, getProject } from "@/lib/repo";
import { query } from "@/lib/db";
import type { AuditLog } from "@/lib/types";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSession();
  if (!("profile" in guard)) return guard;
  const milestone = await getMilestone(params.id);
  if (!milestone) return fail("Not found", "not_found", 404);
  const project = (await getProject(milestone.project_id))!;
  const p = guard.profile;
  const allowed =
    (p.role === "owner" && project.owner_id === p.id) ||
    (p.role === "certifier" && project.certifier_id === p.id) ||
    (p.role === "contractor" && project.contractor_id === p.id);
  if (!allowed) return fail("Forbidden", "forbidden", 403);

  const sinceParam = req.nextUrl.searchParams.get("since");
  let events: AuditLog[];
  if (sinceParam) {
    const res = await query<AuditLog>(
      `SELECT * FROM audit_logs WHERE milestone_id = $1 AND created_at > $2 ORDER BY created_at ASC LIMIT 50`,
      [params.id, sinceParam]
    );
    events = res.rows;
  } else {
    const res = await query<AuditLog>(
      `SELECT * FROM audit_logs WHERE milestone_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [params.id]
    );
    events = res.rows;
  }

  const milestoneRow = (await getMilestone(params.id))!;
  return ok({
    events,
    milestone: {
      status: milestoneRow.status,
      payout_status: milestoneRow.payout_status,
      payout_tx_signature: milestoneRow.payout_tx_signature,
      updated_at: milestoneRow.updated_at,
    },
  });
}
