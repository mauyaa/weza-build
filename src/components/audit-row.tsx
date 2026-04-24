import { formatDateTime, shortSig, timeAgo } from "@/lib/format";
import type { AuditLog } from "@/lib/types";

const actionLabel: Record<AuditLog["action"], { label: string; tone: string }> = {
  "submission.submitted": { label: "Submitted", tone: "text-blue-700 bg-blue-50 border-blue-200" },
  "submission.resubmitted": { label: "Resubmitted", tone: "text-blue-700 bg-blue-50 border-blue-200" },
  "submission.comment_added": { label: "Comment", tone: "text-ink-600 bg-ink-50 border-ink-200" },
  "submission.revision_requested": { label: "Revision requested", tone: "text-amber-700 bg-amber-50 border-amber-200" },
  "submission.approved": { label: "Approved", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  "submission.rejected": { label: "Rejected", tone: "text-red-700 bg-red-50 border-red-200" },
  "approval.recorded_onchain": { label: "On-chain approval", tone: "text-violet-700 bg-violet-50 border-violet-200" },
  "milestone.approved": { label: "Milestone approved", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  "milestone.payout_ready": { label: "Payout ready", tone: "text-amber-700 bg-amber-50 border-amber-200" },
  "payout.triggered": { label: "Payout triggered", tone: "text-violet-700 bg-violet-50 border-violet-200" },
  "payout.confirmed": { label: "Payout confirmed", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  "payout.failed": { label: "Payout failed", tone: "text-red-700 bg-red-50 border-red-200" },
};

export function AuditRow({ event, compact }: { event: AuditLog; compact?: boolean }) {
  const meta = actionLabel[event.action] ?? { label: event.action, tone: "text-ink-600 bg-ink-50 border-ink-200" };
  return (
    <div className="flex gap-3 px-4 py-3">
      <span className={`chip ${meta.tone} shrink-0`}>{meta.label}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-ink-900 truncate">{event.message}</div>
        <div className="text-xs text-ink-500 mt-0.5">
          {event.actor_name ?? "system"}
          {event.actor_role ? ` · ${event.actor_role}` : ""}
          {" · "}
          {compact ? timeAgo(event.created_at) : formatDateTime(event.created_at)}
          {event.tx_signature && (
            <>
              {" · "}
              <a
                href={`https://explorer.solana.com/tx/${event.tx_signature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="mono text-brand-700 hover:underline"
              >
                {shortSig(event.tx_signature)}
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
