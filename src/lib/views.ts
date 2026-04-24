import { query } from "./db";
import type {
  AuditLog,
  Milestone,
  Profile,
  Submission,
} from "./types";

export interface DashboardKpis {
  active_projects: number;
  pending_review: number;
  revision_requested: number;
  payout_ready: number;
  settled: number;
  total_settled_usdc: number;
}

export async function dashboardKpis(profile: Profile): Promise<DashboardKpis> {
  const sql = `
    WITH scope AS (
      SELECT id FROM projects p
      WHERE p.org_id = $1
        AND (
          ($2 = 'owner' AND p.owner_id = $3)
          OR ($2 = 'certifier' AND p.certifier_id = $3)
          OR ($2 = 'contractor' AND p.contractor_id = $3)
        )
    )
    SELECT
      (SELECT COUNT(*) FROM scope)::int AS active_projects,
      (SELECT COUNT(*) FROM milestones m
         WHERE m.project_id IN (SELECT id FROM scope) AND m.status = 'under_review')::int AS pending_review,
      (SELECT COUNT(*) FROM submissions s
         JOIN milestones m ON m.id = s.milestone_id
         WHERE m.project_id IN (SELECT id FROM scope) AND s.status = 'revision_requested')::int AS revision_requested,
      (SELECT COUNT(*) FROM milestones m
         WHERE m.project_id IN (SELECT id FROM scope) AND m.payout_status = 'ready')::int AS payout_ready,
      (SELECT COUNT(*) FROM milestones m
         WHERE m.project_id IN (SELECT id FROM scope) AND m.status = 'settled')::int AS settled,
      (SELECT COALESCE(SUM(m.payout_amount_usdc), 0)::float FROM milestones m
         WHERE m.project_id IN (SELECT id FROM scope) AND m.status = 'settled') AS total_settled_usdc
  `;
  const res = await query<DashboardKpis>(sql, [profile.org_id, profile.role, profile.id]);
  return res.rows[0];
}

export interface ActionItem {
  kind:
    | "submit_required"
    | "revision_required"
    | "review_required"
    | "payout_ready"
    | "payout_triggered";
  project_id: string;
  project_name: string;
  milestone_id: string;
  milestone_title: string;
  submission_id: string | null;
  amount_usdc: number | null;
  updated_at: string;
}

export async function actionQueue(profile: Profile, limit = 8): Promise<ActionItem[]> {
  if (profile.role === "contractor") {
    const res = await query<ActionItem>(
      `
      SELECT
        CASE
          WHEN m.status = 'awaiting_submission' THEN 'submit_required'
          WHEN s.status = 'revision_requested' THEN 'revision_required'
          ELSE 'submit_required'
        END AS kind,
        p.id AS project_id, p.name AS project_name,
        m.id AS milestone_id, m.title AS milestone_title,
        s.id AS submission_id,
        m.payout_amount_usdc::float AS amount_usdc,
        m.updated_at AS updated_at
      FROM milestones m
      JOIN projects p ON p.id = m.project_id
      LEFT JOIN submissions s ON s.milestone_id = m.id
      WHERE p.org_id = $1 AND p.contractor_id = $2
        AND (m.status = 'awaiting_submission' OR s.status = 'revision_requested' OR s.status = 'rejected')
      ORDER BY m.updated_at DESC
      LIMIT $3
      `,
      [profile.org_id, profile.id, limit]
    );
    return res.rows;
  }
  if (profile.role === "certifier") {
    const res = await query<ActionItem>(
      `
      SELECT
        'review_required' AS kind,
        p.id AS project_id, p.name AS project_name,
        m.id AS milestone_id, m.title AS milestone_title,
        s.id AS submission_id,
        m.payout_amount_usdc::float AS amount_usdc,
        s.updated_at AS updated_at
      FROM submissions s
      JOIN milestones m ON m.id = s.milestone_id
      JOIN projects p ON p.id = m.project_id
      WHERE p.org_id = $1 AND p.certifier_id = $2
        AND s.status = 'under_review'
      ORDER BY s.updated_at ASC
      LIMIT $3
      `,
      [profile.org_id, profile.id, limit]
    );
    return res.rows;
  }
  const res = await query<ActionItem>(
    `
    SELECT
      CASE WHEN m.payout_status = 'ready' THEN 'payout_ready'
           WHEN m.payout_status = 'triggered' THEN 'payout_triggered'
           ELSE 'payout_ready' END AS kind,
      p.id AS project_id, p.name AS project_name,
      m.id AS milestone_id, m.title AS milestone_title,
      NULL::text AS submission_id,
      m.payout_amount_usdc::float AS amount_usdc,
      m.updated_at AS updated_at
    FROM milestones m
    JOIN projects p ON p.id = m.project_id
    WHERE p.org_id = $1 AND p.owner_id = $2
      AND m.payout_status IN ('ready','triggered')
    ORDER BY m.updated_at DESC
    LIMIT $3
    `,
    [profile.org_id, profile.id, limit]
  );
  return res.rows;
}

export async function recentAudit(profile: Profile, limit = 10): Promise<AuditLog[]> {
  const res = await query<AuditLog>(
    `
    SELECT a.* FROM audit_logs a
    LEFT JOIN projects p ON p.id = a.project_id
    WHERE a.org_id = $1
      AND (p.id IS NULL OR (
        ($2 = 'owner' AND p.owner_id = $3)
        OR ($2 = 'certifier' AND p.certifier_id = $3)
        OR ($2 = 'contractor' AND p.contractor_id = $3)
      ))
    ORDER BY a.created_at DESC
    LIMIT $4
    `,
    [profile.org_id, profile.role, profile.id, limit]
  );
  return res.rows;
}

export interface MilestoneRow extends Milestone {
  project_name: string;
  submission_status: Submission["status"] | null;
  submission_id: string | null;
  current_version: number;
}

export async function milestonesForProject(projectId: string): Promise<MilestoneRow[]> {
  const res = await query<MilestoneRow>(
    `
    SELECT m.*, p.name AS project_name,
      s.status AS submission_status, s.id AS submission_id, COALESCE(s.current_version, 0) AS current_version
    FROM milestones m
    JOIN projects p ON p.id = m.project_id
    LEFT JOIN submissions s ON s.milestone_id = m.id
    WHERE m.project_id = $1
    ORDER BY m.sequence ASC
    `,
    [projectId]
  );
  return res.rows;
}
