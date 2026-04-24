export type Role = "owner" | "certifier" | "contractor";

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "resubmitted"
  | "approved"
  | "rejected";

export type MilestoneStatus =
  | "awaiting_submission"
  | "under_review"
  | "approved"
  | "disputed"
  | "payout_triggered"
  | "settled";

export type PayoutStatus =
  | "not_ready"
  | "ready"
  | "triggered"
  | "confirmed"
  | "failed"
  | "held";

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string; // uuid from auth.users
  org_id: string;
  full_name: string;
  email: string;
  role: Role;
  wallet_address: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  code: string;
  owner_id: string;
  certifier_id: string;
  contractor_id: string;
  contract_value_usdc: number;
  created_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  sequence: number;
  title: string;
  scope: string;
  payout_amount_usdc: number;
  status: MilestoneStatus;
  payout_status: PayoutStatus;
  payout_tx_signature: string | null;
  payout_triggered_at: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  milestone_id: string;
  contractor_id: string;
  status: SubmissionStatus;
  current_version: number;
  created_at: string;
  updated_at: string;
}

export interface SubmissionVersion {
  id: string;
  submission_id: string;
  version: number;
  title: string;
  note: string;
  file_name: string;
  file_sha256: string;
  file_size_bytes: number;
  storage_key: string | null;
  submitted_by: string;
  submitted_at: string;
}

export interface ReviewComment {
  id: string;
  submission_id: string;
  version: number;
  author_id: string;
  body: string;
  created_at: string;
}

export type ApprovalAction = "request_revision" | "approve" | "reject";

export interface ApprovalDecision {
  id: string;
  submission_id: string;
  version: number;
  certifier_id: string;
  action: ApprovalAction;
  note: string;
  created_at: string;
}

export interface PayoutInstruction {
  id: string;
  milestone_id: string;
  amount_usdc: number;
  recipient_wallet: string;
  status: PayoutStatus;
  tx_signature: string | null;
  network: string;
  triggered_by: string | null;
  triggered_at: string | null;
  confirmed_at: string | null;
  failure_reason: string | null;
  created_at: string;
}

export type AuditAction =
  | "submission.submitted"
  | "submission.resubmitted"
  | "submission.comment_added"
  | "submission.revision_requested"
  | "submission.approved"
  | "submission.rejected"
  | "milestone.approved"
  | "milestone.payout_ready"
  | "payout.triggered"
  | "payout.confirmed"
  | "payout.failed";

export interface AuditLog {
  id: string;
  org_id: string;
  project_id: string | null;
  milestone_id: string | null;
  submission_id: string | null;
  actor_id: string | null;
  actor_role: Role | null;
  actor_name: string | null;
  action: AuditAction;
  message: string;
  tx_signature: string | null;
  created_at: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  code: string;
  data: T | null;
  details?: Record<string, unknown> | null;
}
