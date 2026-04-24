import type {
  MilestoneStatus,
  PayoutStatus,
  SubmissionStatus,
} from "./types";

export const SUBMISSION_STATUSES: SubmissionStatus[] = [
  "draft",
  "submitted",
  "under_review",
  "revision_requested",
  "resubmitted",
  "approved",
  "rejected",
];

export const MILESTONE_STATUSES: MilestoneStatus[] = [
  "awaiting_submission",
  "under_review",
  "approved",
  "disputed",
  "payout_triggered",
  "settled",
];

export const PAYOUT_STATUSES: PayoutStatus[] = [
  "not_ready",
  "ready",
  "triggered",
  "confirmed",
  "failed",
  "held",
];

const submissionTransitions: Record<SubmissionStatus, SubmissionStatus[]> = {
  draft: ["submitted"],
  submitted: ["under_review"],
  under_review: ["revision_requested", "approved", "rejected"],
  revision_requested: ["resubmitted"],
  resubmitted: ["under_review"],
  approved: [],
  rejected: [],
};

const milestoneTransitions: Record<MilestoneStatus, MilestoneStatus[]> = {
  awaiting_submission: ["under_review"],
  under_review: ["approved", "awaiting_submission", "disputed"],
  approved: ["payout_triggered", "disputed"],
  disputed: ["under_review", "approved"],
  payout_triggered: ["settled", "approved"],
  settled: [],
};

const payoutTransitions: Record<PayoutStatus, PayoutStatus[]> = {
  not_ready: ["ready", "held"],
  ready: ["triggered", "held"],
  triggered: ["confirmed", "failed"],
  confirmed: [],
  failed: ["ready", "triggered"],
  held: ["ready"],
};

export function canTransitionSubmission(
  from: SubmissionStatus,
  to: SubmissionStatus
): boolean {
  if (from === to) return true;
  return submissionTransitions[from]?.includes(to) ?? false;
}

export function canTransitionMilestone(
  from: MilestoneStatus,
  to: MilestoneStatus
): boolean {
  if (from === to) return true;
  return milestoneTransitions[from]?.includes(to) ?? false;
}

export function canTransitionPayout(
  from: PayoutStatus,
  to: PayoutStatus
): boolean {
  if (from === to) return true;
  return payoutTransitions[from]?.includes(to) ?? false;
}

export function submissionLabel(s: SubmissionStatus): string {
  return {
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under review",
    revision_requested: "Revision requested",
    resubmitted: "Resubmitted",
    approved: "Approved",
    rejected: "Rejected",
  }[s];
}

export function milestoneLabel(s: MilestoneStatus): string {
  return {
    awaiting_submission: "Awaiting submission",
    under_review: "Under review",
    approved: "Approved",
    disputed: "Disputed",
    payout_triggered: "Payout triggered",
    settled: "Settled",
  }[s];
}

export function payoutLabel(s: PayoutStatus): string {
  return {
    not_ready: "Not ready",
    ready: "Ready",
    triggered: "Triggered",
    confirmed: "Confirmed",
    failed: "Failed",
    held: "Held",
  }[s];
}
