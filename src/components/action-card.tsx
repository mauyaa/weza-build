import Link from "next/link";
import { formatUsdc, timeAgo } from "@/lib/format";
import type { Role } from "@/lib/types";
import type { ActionItem } from "@/lib/views";

const config: Record<ActionItem["kind"], { label: string; cta: string; tone: string }> = {
  submit_required: {
    label: "Submit package",
    cta: "Submit",
    tone: "border-l-blue-400",
  },
  revision_required: {
    label: "Revision requested",
    cta: "Resubmit",
    tone: "border-l-amber-400",
  },
  review_required: {
    label: "Pending review",
    cta: "Review",
    tone: "border-l-blue-400",
  },
  payout_ready: {
    label: "Payout ready",
    cta: "Trigger payout",
    tone: "border-l-emerald-400",
  },
  payout_triggered: {
    label: "Payout in flight",
    cta: "Open",
    tone: "border-l-violet-400",
  },
};

export function ActionCard({ item, role }: { item: ActionItem; role: Role }) {
  const cfg = config[item.kind];
  const href = `/app/milestones/${item.milestone_id}`;
  return (
    <Link
      href={href}
      className={`card flex items-center px-4 py-3 gap-4 border-l-4 ${cfg.tone} hover:shadow-pop transition`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">{cfg.label}</div>
        <div className="font-medium text-ink-900 truncate">{item.milestone_title}</div>
        <div className="text-xs text-ink-500 truncate">
          {item.project_name}
          {item.amount_usdc != null && <> · {formatUsdc(item.amount_usdc)}</>}
          <> · {timeAgo(item.updated_at)}</>
        </div>
      </div>
      <div className="text-sm font-medium text-ink-900 shrink-0">
        {cfg.cta} →
      </div>
    </Link>
  );
}
