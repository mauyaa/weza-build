import type { MilestoneStatus, PayoutStatus, SubmissionStatus } from "@/lib/types";

interface Props {
  milestoneStatus: MilestoneStatus;
  submissionStatus: SubmissionStatus | null;
  payoutStatus: PayoutStatus;
  ownerName: string;
  certifierName: string;
  contractorName: string;
}

export function HandoffPill({
  milestoneStatus,
  submissionStatus,
  payoutStatus,
  ownerName,
  certifierName,
  contractorName,
}: Props) {
  const { who, verb, tone } = resolve({
    milestoneStatus,
    submissionStatus,
    payoutStatus,
    ownerName,
    certifierName,
    contractorName,
  });
  const cls = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ink: "bg-ink-100 text-ink-700 border-ink-200",
  }[tone];
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs font-medium ${cls}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">Ball is with</div>
      <div className="leading-tight">
        <span className="font-semibold">{who}</span> · {verb}
      </div>
    </div>
  );
}

function resolve(p: Props): { who: string; verb: string; tone: "blue" | "amber" | "violet" | "green" | "ink" } {
  const { milestoneStatus, submissionStatus, payoutStatus, ownerName, certifierName, contractorName } = p;
  if (milestoneStatus === "settled" || payoutStatus === "confirmed") {
    return { who: "Done", verb: "settled", tone: "green" };
  }
  if (payoutStatus === "triggered") {
    return { who: "Network", verb: "confirming payout", tone: "violet" };
  }
  if (milestoneStatus === "approved" && (payoutStatus === "ready" || payoutStatus === "failed")) {
    return { who: ownerName, verb: payoutStatus === "failed" ? "retry payout" : "trigger payout", tone: "amber" };
  }
  if (submissionStatus === "under_review" || submissionStatus === "submitted" || submissionStatus === "resubmitted") {
    return { who: certifierName, verb: "review submission", tone: "blue" };
  }
  if (submissionStatus === "revision_requested") {
    return { who: contractorName, verb: "resubmit", tone: "amber" };
  }
  if (submissionStatus === "rejected") {
    return { who: contractorName, verb: "rejected — open dispute", tone: "ink" };
  }
  return { who: contractorName, verb: "submit package", tone: "blue" };
}
