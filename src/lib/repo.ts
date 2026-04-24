import type { DbClientLike } from "./db";
import { query, withTx } from "./db";
import {
  canTransitionMilestone,
  canTransitionPayout,
  canTransitionSubmission,
} from "./state-machine";
import type {
  ApprovalAction,
  ApprovalDecision,
  AuditAction,
  AuditLog,
  Milestone,
  MilestoneStatus,
  PayoutInstruction,
  PayoutStatus,
  Profile,
  Project,
  ReviewComment,
  Role,
  Submission,
  SubmissionStatus,
  SubmissionVersion,
} from "./types";

export class DomainError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;
  constructor(code: string, message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// -- Helpers ---------------------------------------------------------------

async function first<T extends object>(sql: string, params: unknown[] = []): Promise<T | null> {
  const res = await query<T>(sql, params);
  return res.rows[0] ?? null;
}

async function many<T extends object>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await query<T>(sql, params);
  return res.rows;
}

async function firstTx<T extends object>(
  client: DbClientLike,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const res = await client.query<T>(sql, params);
  return res.rows[0] ?? null;
}

async function optionalColumnExists(table: string, column: string): Promise<boolean> {
  const res = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
     ) AS exists`,
    [table, column]
  );
  return Boolean(res.rows[0]?.exists);
}

async function manyTx<T extends object>(
  client: DbClientLike,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await client.query<T>(sql, params);
  return res.rows;
}

// -- Lookups ---------------------------------------------------------------

export async function getProfile(id: string): Promise<Profile | null> {
  return first<Profile>("SELECT * FROM profiles WHERE id = $1", [id]);
}

export async function listProfiles(): Promise<Profile[]> {
  return many<Profile>("SELECT * FROM profiles ORDER BY role, full_name");
}

export async function getProject(id: string): Promise<Project | null> {
  return first<Project>("SELECT * FROM projects WHERE id = $1", [id]);
}

export interface ProjectSummary extends Project {
  owner_name: string;
  certifier_name: string;
  contractor_name: string;
  active_milestones: number;
  approved_milestones: number;
  payout_ready: number;
  settled: number;
  total_milestones: number;
  last_activity_at: string | null;
}

export async function listProjectsForUser(profile: Profile): Promise<ProjectSummary[]> {
  const sql = `
    SELECT p.*,
      o.full_name AS owner_name,
      c.full_name AS certifier_name,
      k.full_name AS contractor_name,
      (SELECT COUNT(*) FROM milestones m WHERE m.project_id = p.id)::int AS total_milestones,
      (SELECT COUNT(*) FROM milestones m WHERE m.project_id = p.id AND m.status IN ('awaiting_submission','under_review','disputed'))::int AS active_milestones,
      (SELECT COUNT(*) FROM milestones m WHERE m.project_id = p.id AND m.status = 'approved')::int AS approved_milestones,
      (SELECT COUNT(*) FROM milestones m WHERE m.project_id = p.id AND m.payout_status = 'ready')::int AS payout_ready,
      (SELECT COUNT(*) FROM milestones m WHERE m.project_id = p.id AND m.status = 'settled')::int AS settled,
      (SELECT MAX(a.created_at) FROM audit_logs a WHERE a.project_id = p.id) AS last_activity_at
    FROM projects p
    JOIN profiles o ON o.id = p.owner_id
    JOIN profiles c ON c.id = p.certifier_id
    JOIN profiles k ON k.id = p.contractor_id
    WHERE p.org_id = $1
      AND (
        ($2 = 'owner' AND p.owner_id = $3)
        OR ($2 = 'certifier' AND p.certifier_id = $3)
        OR ($2 = 'contractor' AND p.contractor_id = $3)
      )
    ORDER BY p.created_at DESC
  `;
  return many<ProjectSummary>(sql, [profile.org_id, profile.role, profile.id]);
}

export async function getMilestone(id: string): Promise<Milestone | null> {
  return first<Milestone>("SELECT * FROM milestones WHERE id = $1", [id]);
}

export async function listMilestonesForProject(projectId: string): Promise<Milestone[]> {
  return many<Milestone>(
    "SELECT * FROM milestones WHERE project_id = $1 ORDER BY sequence ASC",
    [projectId]
  );
}

export async function getSubmissionForMilestone(milestoneId: string): Promise<Submission | null> {
  return first<Submission>("SELECT * FROM submissions WHERE milestone_id = $1", [milestoneId]);
}

export async function getSubmission(id: string): Promise<Submission | null> {
  return first<Submission>("SELECT * FROM submissions WHERE id = $1", [id]);
}

export async function listVersions(submissionId: string): Promise<SubmissionVersion[]> {
  return many<SubmissionVersion>(
    "SELECT * FROM submission_versions WHERE submission_id = $1 ORDER BY version ASC",
    [submissionId]
  );
}

export async function listComments(submissionId: string): Promise<ReviewComment[]> {
  return many<ReviewComment>(
    "SELECT * FROM review_comments WHERE submission_id = $1 ORDER BY created_at ASC",
    [submissionId]
  );
}

export async function listDecisions(submissionId: string): Promise<ApprovalDecision[]> {
  return many<ApprovalDecision>(
    "SELECT * FROM approval_decisions WHERE submission_id = $1 ORDER BY created_at ASC",
    [submissionId]
  );
}

export async function listAudit(opts: {
  orgId: string;
  projectId?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  const limit = opts.limit ?? 100;
  if (opts.projectId) {
    return many<AuditLog>(
      "SELECT * FROM audit_logs WHERE org_id = $1 AND project_id = $2 ORDER BY created_at DESC LIMIT $3",
      [opts.orgId, opts.projectId, limit]
    );
  }
  return many<AuditLog>(
    "SELECT * FROM audit_logs WHERE org_id = $1 ORDER BY created_at DESC LIMIT $2",
    [opts.orgId, limit]
  );
}

export async function getLatestPayout(milestoneId: string): Promise<PayoutInstruction | null> {
  return first<PayoutInstruction>(
    "SELECT * FROM payout_instructions WHERE milestone_id = $1 ORDER BY created_at DESC LIMIT 1",
    [milestoneId]
  );
}

export async function getLatestApproval(submissionId: string): Promise<ApprovalDecision | null> {
  return first<ApprovalDecision>(
    "SELECT * FROM approval_decisions WHERE submission_id = $1 AND action = 'approve' ORDER BY created_at DESC LIMIT 1",
    [submissionId]
  );
}

// -- Audit write -----------------------------------------------------------

interface WriteAuditArgs {
  orgId: string;
  projectId?: string | null;
  milestoneId?: string | null;
  submissionId?: string | null;
  actor: Profile | null;
  action: AuditAction;
  message: string;
  txSignature?: string | null;
}

async function writeAuditTx(client: DbClientLike, args: WriteAuditArgs): Promise<AuditLog> {
  const res = await client.query<AuditLog>(
    `INSERT INTO audit_logs
       (org_id, project_id, milestone_id, submission_id, actor_id, actor_role, actor_name, action, message, tx_signature)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      args.orgId,
      args.projectId ?? null,
      args.milestoneId ?? null,
      args.submissionId ?? null,
      args.actor?.id ?? null,
      args.actor?.role ?? null,
      args.actor?.full_name ?? null,
      args.action,
      args.message,
      args.txSignature ?? null,
    ]
  );
  return res.rows[0];
}

export async function writeAudit(args: WriteAuditArgs): Promise<AuditLog> {
  return withTx((client) => writeAuditTx(client, args));
}

// -- State machine helpers (transactional) --------------------------------

async function transitionMilestone(
  client: DbClientLike,
  milestoneId: string,
  next: MilestoneStatus,
  extra: {
    payout_status?: PayoutStatus;
    payout_tx_signature?: string | null;
    payout_triggered_at?: string | null;
    approval_tx_signature?: string | null;
    approval_pda?: string | null;
    approval_network?: string | null;
  } = {}
): Promise<Milestone> {
  const current = await firstTx<Milestone>(client, "SELECT * FROM milestones WHERE id = $1 FOR UPDATE", [milestoneId]);
  if (!current) throw new DomainError("not_found", "Milestone not found", 404);
  if (!canTransitionMilestone(current.status, next)) {
    throw new DomainError(
      "invalid_transition",
      `Milestone cannot move from ${current.status} to ${next}`,
      409
    );
  }
  const res = await client.query<Milestone>(
    `UPDATE milestones SET
       status = $2,
       payout_status = COALESCE($3, payout_status),
       payout_tx_signature = COALESCE($4, payout_tx_signature),
       payout_triggered_at = COALESCE($5, payout_triggered_at),
       approval_tx_signature = COALESCE($6, approval_tx_signature),
       approval_pda = COALESCE($7, approval_pda),
       approval_network = COALESCE($8, approval_network)
     WHERE id = $1
     RETURNING *`,
    [
      milestoneId,
      next,
      extra.payout_status ?? null,
      extra.payout_tx_signature ?? null,
      extra.payout_triggered_at ?? null,
      extra.approval_tx_signature ?? null,
      extra.approval_pda ?? null,
      extra.approval_network ?? null,
    ]
  );
  return res.rows[0];
}

async function transitionPayout(
  client: DbClientLike,
  milestoneId: string,
  next: PayoutStatus
): Promise<Milestone> {
  const current = await firstTx<Milestone>(client, "SELECT * FROM milestones WHERE id = $1 FOR UPDATE", [milestoneId]);
  if (!current) throw new DomainError("not_found", "Milestone not found", 404);
  if (!canTransitionPayout(current.payout_status, next)) {
    throw new DomainError(
      "invalid_transition",
      `Payout cannot move from ${current.payout_status} to ${next}`,
      409
    );
  }
  const res = await client.query<Milestone>(
    "UPDATE milestones SET payout_status = $2 WHERE id = $1 RETURNING *",
    [milestoneId, next]
  );
  return res.rows[0];
}

async function transitionSubmission(
  client: DbClientLike,
  submissionId: string,
  next: SubmissionStatus,
  version?: number
): Promise<Submission> {
  const current = await firstTx<Submission>(
    client,
    "SELECT * FROM submissions WHERE id = $1 FOR UPDATE",
    [submissionId]
  );
  if (!current) throw new DomainError("not_found", "Submission not found", 404);
  if (!canTransitionSubmission(current.status, next)) {
    throw new DomainError(
      "invalid_transition",
      `Submission cannot move from ${current.status} to ${next}`,
      409
    );
  }
  const res = await client.query<Submission>(
    `UPDATE submissions
     SET status = $2,
         current_version = COALESCE($3, current_version)
     WHERE id = $1
     RETURNING *`,
    [submissionId, next, version ?? null]
  );
  return res.rows[0];
}

// -- Business operations ---------------------------------------------------

export interface SubmitPackageInput {
  milestoneId: string;
  actor: Profile;
  title: string;
  note: string;
  fileName: string;
  fileSize: number;
  fileSha256: string;
  storageKey?: string | null;
}

export interface SubmitPackageResult {
  submission: Submission;
  version: SubmissionVersion;
  milestone: Milestone;
  audit: AuditLog;
}

export async function submitPackage(input: SubmitPackageInput): Promise<SubmitPackageResult> {
  if (input.actor.role !== "contractor") {
    throw new DomainError("forbidden", "Only contractors can submit packages", 403);
  }
  const milestone = await getMilestone(input.milestoneId);
  if (!milestone) throw new DomainError("not_found", "Milestone not found", 404);
  const project = await getProject(milestone.project_id);
  if (!project) throw new DomainError("not_found", "Project not found", 404);
  if (project.contractor_id !== input.actor.id) {
    throw new DomainError("forbidden", "Only assigned contractor can submit", 403);
  }
  if (
    milestone.status === "approved" ||
    milestone.status === "payout_triggered" ||
    milestone.status === "settled"
  ) {
    throw new DomainError(
      "milestone_closed",
      "Milestone is already approved and cannot accept submissions",
      409
    );
  }

  return withTx(async (client) => {
    let sub = await firstTx<Submission>(
      client,
      "SELECT * FROM submissions WHERE milestone_id = $1 FOR UPDATE",
      [input.milestoneId]
    );
    let isFirst = false;
    if (!sub) {
      const inserted = await client.query<Submission>(
        `INSERT INTO submissions (milestone_id, contractor_id, status, current_version)
         VALUES ($1, $2, 'draft', 0) RETURNING *`,
        [input.milestoneId, input.actor.id]
      );
      sub = inserted.rows[0];
      isFirst = true;
    } else {
      if (sub.status === "approved") {
        throw new DomainError("already_approved", "Submission is already approved", 409);
      }
      if (sub.status === "submitted" || sub.status === "under_review" || sub.status === "resubmitted") {
        throw new DomainError(
          "awaiting_review",
          "A version is already awaiting certifier review",
          409
        );
      }
      if (sub.status !== "draft" && sub.status !== "revision_requested" && sub.status !== "rejected") {
        throw new DomainError("invalid_state", `Cannot submit from ${sub.status}`, 409);
      }
    }

    const nextVersion = sub.current_version + 1;
    const versionRes = await client.query<SubmissionVersion>(
      `INSERT INTO submission_versions
         (submission_id, version, title, note, file_name, file_sha256, file_size_bytes, storage_key, submitted_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        sub.id,
        nextVersion,
        input.title,
        input.note,
        input.fileName,
        input.fileSha256,
        input.fileSize,
        input.storageKey ?? null,
        input.actor.id,
      ]
    );
    const version = versionRes.rows[0];

    const nextStatus: SubmissionStatus = isFirst ? "submitted" : "resubmitted";
    await client.query(
      "UPDATE submissions SET status = $2, current_version = $3 WHERE id = $1",
      [sub.id, nextStatus, nextVersion]
    );
    // Automatic chain: newly-submitted or resubmitted versions are immediately under review
    // because the certifier has something to look at.
    await client.query(
      "UPDATE submissions SET status = 'under_review' WHERE id = $1",
      [sub.id]
    );

    if (milestone.status === "awaiting_submission" || milestone.status === "disputed") {
      await transitionMilestone(client, milestone.id, "under_review");
    }

    const refreshedSub = (await firstTx<Submission>(
      client,
      "SELECT * FROM submissions WHERE id = $1",
      [sub.id]
    ))!;
    const refreshedMilestone = (await firstTx<Milestone>(
      client,
      "SELECT * FROM milestones WHERE id = $1",
      [milestone.id]
    ))!;

    const auditAction: AuditAction = isFirst ? "submission.submitted" : "submission.resubmitted";
    const audit = await writeAuditTx(client, {
      orgId: project.org_id,
      projectId: project.id,
      milestoneId: milestone.id,
      submissionId: sub.id,
      actor: input.actor,
      action: auditAction,
      message: isFirst
        ? `Submitted v${nextVersion}: ${input.title}`
        : `Resubmitted v${nextVersion}: ${input.title}`,
    });

    return { submission: refreshedSub, version, milestone: refreshedMilestone, audit };
  });
}

export interface AddCommentInput {
  submissionId: string;
  actor: Profile;
  body: string;
}

export async function addComment(input: AddCommentInput): Promise<ReviewComment> {
  const sub = await first<Submission>("SELECT * FROM submissions WHERE id = $1", [input.submissionId]);
  if (!sub) throw new DomainError("not_found", "Submission not found", 404);
  const milestone = await getMilestone(sub.milestone_id);
  if (!milestone) throw new DomainError("not_found", "Milestone not found", 404);
  const project = (await getProject(milestone.project_id))!;
  const allowed: Role[] = ["certifier", "contractor", "owner"];
  if (!allowed.includes(input.actor.role)) {
    throw new DomainError("forbidden", "Not permitted", 403);
  }
  if (input.actor.role === "certifier" && project.certifier_id !== input.actor.id) {
    throw new DomainError("forbidden", "Not the assigned certifier", 403);
  }
  if (input.actor.role === "contractor" && project.contractor_id !== input.actor.id) {
    throw new DomainError("forbidden", "Not the assigned contractor", 403);
  }
  if (input.actor.role === "owner" && project.owner_id !== input.actor.id) {
    throw new DomainError("forbidden", "Not the project owner", 403);
  }

  const body = input.body.trim();
  if (!body) throw new DomainError("validation", "Comment body required", 400);

  return withTx(async (client) => {
    const res = await client.query<ReviewComment>(
      `INSERT INTO review_comments (submission_id, version, author_id, body)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [sub.id, sub.current_version, input.actor.id, body]
    );
    const comment = res.rows[0];
    await writeAuditTx(client, {
      orgId: project.org_id,
      projectId: project.id,
      milestoneId: milestone.id,
      submissionId: sub.id,
      actor: input.actor,
      action: "submission.comment_added",
      message: `Comment on v${sub.current_version}`,
    });
    return comment;
  });
}

export interface DecideInput {
  submissionId: string;
  actor: Profile;
  action: ApprovalAction;
  note: string;
  onChainApproval?: OnChainApprovalProof | null;
}

export interface DecideResult {
  decision: ApprovalDecision;
  submission: Submission;
  milestone: Milestone;
  payout: PayoutInstruction | null;
  audit: AuditLog[];
}

export interface OnChainApprovalProof {
  txSignature: string;
  approvalPda: string;
  network: string;
  recordedAt?: string | null;
}

export async function decide(input: DecideInput): Promise<DecideResult> {
  if (input.actor.role !== "certifier") {
    throw new DomainError("forbidden", "Only certifiers can decide", 403);
  }
  const sub = await first<Submission>("SELECT * FROM submissions WHERE id = $1", [input.submissionId]);
  if (!sub) throw new DomainError("not_found", "Submission not found", 404);
  const milestone = (await getMilestone(sub.milestone_id))!;
  const project = (await getProject(milestone.project_id))!;
  if (project.certifier_id !== input.actor.id) {
    throw new DomainError("forbidden", "Not the assigned certifier", 403);
  }

  if (sub.status === "approved" && input.action === "approve") {
    const last = await first<ApprovalDecision>(
      "SELECT * FROM approval_decisions WHERE submission_id = $1 ORDER BY created_at DESC LIMIT 1",
      [sub.id]
    );
    return {
      decision: last!,
      submission: sub,
      milestone,
      payout: await getLatestPayout(milestone.id),
      audit: [],
    };
  }

  if (sub.status !== "under_review") {
    throw new DomainError(
      "invalid_state",
      `Cannot decide on a submission in state ${sub.status}`,
      409
    );
  }

  return withTx(async (client) => {
    const audits: AuditLog[] = [];
    if (input.action === "approve" && !input.onChainApproval) {
      throw new DomainError(
        "approval_not_onchain",
        "A Solana approval transaction is required before payout can unlock",
        409
      );
    }
    const proof = input.onChainApproval ?? null;
    const decRes = await client.query<ApprovalDecision>(
      `INSERT INTO approval_decisions
         (submission_id, version, certifier_id, action, note,
          approval_tx_signature, approval_pda, approval_network, approval_recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
               CASE WHEN $9::timestamptz IS NULL AND $6::text IS NULL THEN NULL ELSE COALESCE($9::timestamptz, now()) END)
       RETURNING *`,
      [
        sub.id,
        sub.current_version,
        input.actor.id,
        input.action,
        input.note.trim(),
        proof?.txSignature ?? null,
        proof?.approvalPda ?? null,
        proof?.network ?? null,
        proof?.recordedAt ?? null,
      ]
    );
    const decision = decRes.rows[0];
    let payout: PayoutInstruction | null = null;

    if (input.action === "request_revision") {
      await transitionSubmission(client, sub.id, "revision_requested");
      audits.push(
        await writeAuditTx(client, {
          orgId: project.org_id,
          projectId: project.id,
          milestoneId: milestone.id,
          submissionId: sub.id,
          actor: input.actor,
          action: "submission.revision_requested",
          message: `Revision requested on v${sub.current_version}`,
        })
      );
    } else if (input.action === "approve") {
      await transitionSubmission(client, sub.id, "approved");
      await transitionMilestone(client, milestone.id, "approved", {
        payout_status: "ready",
        approval_tx_signature: proof!.txSignature,
        approval_pda: proof!.approvalPda,
        approval_network: proof!.network,
      });
      const contractor = (await firstTx<Profile>(
        client,
        "SELECT * FROM profiles WHERE id = $1",
        [project.contractor_id]
      ))!;
      if (!contractor.wallet_address) {
        throw new DomainError(
          "no_wallet",
          "Contractor wallet not configured — cannot make payout ready",
          409
        );
      }
      const payoutRes = await client.query<PayoutInstruction>(
        `INSERT INTO payout_instructions
           (milestone_id, amount_usdc, recipient_wallet, status, network)
         VALUES ($1, $2, $3, 'ready', 'solana-devnet') RETURNING *`,
        [milestone.id, milestone.payout_amount_usdc, contractor.wallet_address]
      );
      payout = payoutRes.rows[0];
      audits.push(
        await writeAuditTx(client, {
          orgId: project.org_id,
          projectId: project.id,
          milestoneId: milestone.id,
          submissionId: sub.id,
          actor: input.actor,
          action: "approval.recorded_onchain",
          message: `On-chain approval recorded at ${proof!.approvalPda}`,
          txSignature: proof!.txSignature,
        })
      );
      audits.push(
        await writeAuditTx(client, {
          orgId: project.org_id,
          projectId: project.id,
          milestoneId: milestone.id,
          submissionId: sub.id,
          actor: input.actor,
          action: "submission.approved",
          message: `Approved v${sub.current_version}`,
        })
      );
      audits.push(
        await writeAuditTx(client, {
          orgId: project.org_id,
          projectId: project.id,
          milestoneId: milestone.id,
          submissionId: sub.id,
          actor: input.actor,
          action: "milestone.approved",
          message: `Milestone ${milestone.title} approved`,
        })
      );
      audits.push(
        await writeAuditTx(client, {
          orgId: project.org_id,
          projectId: project.id,
          milestoneId: milestone.id,
          submissionId: sub.id,
          actor: input.actor,
          action: "milestone.payout_ready",
          message: `Payout ready: ${Number(milestone.payout_amount_usdc).toFixed(2)} USDC`,
        })
      );
    } else if (input.action === "reject") {
      await transitionSubmission(client, sub.id, "rejected");
      audits.push(
        await writeAuditTx(client, {
          orgId: project.org_id,
          projectId: project.id,
          milestoneId: milestone.id,
          submissionId: sub.id,
          actor: input.actor,
          action: "submission.rejected",
          message: `Rejected v${sub.current_version}`,
        })
      );
    }

    const refreshedSub = (await firstTx<Submission>(
      client,
      "SELECT * FROM submissions WHERE id = $1",
      [sub.id]
    ))!;
    const refreshedMilestone = (await firstTx<Milestone>(
      client,
      "SELECT * FROM milestones WHERE id = $1",
      [milestone.id]
    ))!;
    return { decision, submission: refreshedSub, milestone: refreshedMilestone, payout, audit: audits };
  });
}

export interface OnChainRunArgs {
  amountUsdc: number;
  recipient: string;
  memo: {
    projectCode: string;
    milestoneSequence: number;
    milestoneId: string;
    submissionId?: string | null;
    approvedBy: string;
  };
}

export interface TriggerPayoutInput {
  milestoneId: string;
  actor: Profile;
  runOnChain: (args: OnChainRunArgs) => Promise<{
    txSignature: string;
    network: string;
    confirmed: boolean;
  }>;
}

export interface TriggerPayoutResult {
  payout: PayoutInstruction;
  milestone: Milestone;
  audit: AuditLog[];
}

export async function triggerPayout(input: TriggerPayoutInput): Promise<TriggerPayoutResult> {
  if (input.actor.role !== "owner") {
    throw new DomainError("forbidden", "Only owners can trigger payouts", 403);
  }
  const milestone = await getMilestone(input.milestoneId);
  if (!milestone) throw new DomainError("not_found", "Milestone not found", 404);
  const project = (await getProject(milestone.project_id))!;
  if (project.owner_id !== input.actor.id) {
    throw new DomainError("forbidden", "Not the project owner", 403);
  }
  const payout = await getLatestPayout(milestone.id);
  if (!payout) throw new DomainError("not_found", "No payout instruction", 404);

  // Idempotency: if already triggered or confirmed, return current state.
  if (payout.status === "triggered" || payout.status === "confirmed") {
    return { payout, milestone, audit: [] };
  }
  if (milestone.status !== "approved") {
    throw new DomainError(
      "milestone_not_approved",
      "Milestone must be approved before payout",
      409
    );
  }
  if (!milestone.approval_tx_signature || !milestone.approval_pda) {
    throw new DomainError(
      "approval_not_onchain",
      "Milestone payout is locked until the certifier approval is recorded on Solana",
      409
    );
  }
  if (payout.status !== "ready" && payout.status !== "failed") {
    throw new DomainError("invalid_state", `Payout in state ${payout.status}`, 409);
  }

  // Move to triggered first (lock), then perform on-chain call.
  const audits: AuditLog[] = [];
  await withTx(async (client) => {
    await client.query(
      `UPDATE payout_instructions
         SET status = 'triggered', triggered_by = $2, triggered_at = now()
       WHERE id = $1`,
      [payout.id, input.actor.id]
    );
    await transitionPayout(client, milestone.id, "triggered");
    await transitionMilestone(client, milestone.id, "payout_triggered");
    audits.push(
      await writeAuditTx(client, {
        orgId: project.org_id,
        projectId: project.id,
        milestoneId: milestone.id,
        actor: input.actor,
        action: "payout.triggered",
        message: `Payout triggered: ${Number(payout.amount_usdc).toFixed(2)} USDC to ${shortWallet(
          payout.recipient_wallet
        )}`,
      })
    );
  });

  try {
    const approvedSubmission = await first<Submission>(
      `SELECT s.* FROM submissions s WHERE s.milestone_id = $1`,
      [milestone.id]
    );
    const result = await input.runOnChain({
      amountUsdc: Number(payout.amount_usdc),
      recipient: payout.recipient_wallet,
      memo: {
        projectCode: project.code,
        milestoneSequence: milestone.sequence,
        milestoneId: milestone.id,
        submissionId: approvedSubmission?.id ?? null,
        approvedBy: project.certifier_id,
      },
    });
    await withTx(async (client) => {
      if (result.confirmed) {
        await client.query(
          `UPDATE payout_instructions
             SET tx_signature = $2, status = 'confirmed', confirmed_at = now()
           WHERE id = $1`,
          [payout.id, result.txSignature]
        );
        await client.query(
          `UPDATE milestones
             SET status = 'settled',
                 payout_status = 'confirmed',
                 payout_tx_signature = $2,
                 payout_triggered_at = COALESCE(payout_triggered_at, now())
           WHERE id = $1`,
          [milestone.id, result.txSignature]
        );
        audits.push(
          await writeAuditTx(client, {
            orgId: project.org_id,
            projectId: project.id,
            milestoneId: milestone.id,
            actor: input.actor,
            action: "payout.confirmed",
            message: `Payout confirmed on ${result.network}`,
            txSignature: result.txSignature,
          })
        );
      } else {
        await client.query(
          "UPDATE payout_instructions SET tx_signature = $2 WHERE id = $1",
          [payout.id, result.txSignature]
        );
      }
    });
    const refreshedPayout = (await getLatestPayout(milestone.id))!;
    const refreshedMilestone = (await getMilestone(milestone.id))!;
    return { payout: refreshedPayout, milestone: refreshedMilestone, audit: audits };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await withTx(async (client) => {
      await client.query(
        `UPDATE payout_instructions SET status = 'failed', failure_reason = $2 WHERE id = $1`,
        [payout.id, reason]
      );
      await client.query(
        `UPDATE milestones SET payout_status = 'failed', status = 'approved' WHERE id = $1`,
        [milestone.id]
      );
      audits.push(
        await writeAuditTx(client, {
          orgId: project.org_id,
          projectId: project.id,
          milestoneId: milestone.id,
          actor: input.actor,
          action: "payout.failed",
          message: `Payout failed: ${reason}`,
        })
      );
    });
    const refreshedPayout = (await getLatestPayout(milestone.id))!;
    const refreshedMilestone = (await getMilestone(milestone.id))!;
    return { payout: refreshedPayout, milestone: refreshedMilestone, audit: audits };
  }
}

function shortWallet(w: string): string {
  if (w.length < 10) return w;
  return `${w.slice(0, 4)}…${w.slice(-4)}`;
}
