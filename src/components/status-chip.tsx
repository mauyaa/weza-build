import { cn } from "@/lib/cn";
import {
  milestoneLabel,
  payoutLabel,
  submissionLabel,
} from "@/lib/state-machine";
import type {
  MilestoneStatus,
  PayoutStatus,
  SubmissionStatus,
} from "@/lib/types";

type Tone = "ink" | "blue" | "amber" | "green" | "red" | "violet";

const toneClass: Record<Tone, string> = {
  ink: "bg-ink-100 text-ink-700 border-ink-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red: "bg-red-50 text-red-700 border-red-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
};

function Dot({ tone }: { tone: Tone }) {
  const color = {
    ink: "bg-ink-400",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    green: "bg-emerald-500",
    red: "bg-red-500",
    violet: "bg-violet-500",
  }[tone];
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", color)} />;
}

export function SubmissionChip({ status }: { status: SubmissionStatus }) {
  const tone: Tone = {
    draft: "ink",
    submitted: "blue",
    under_review: "blue",
    revision_requested: "amber",
    resubmitted: "blue",
    approved: "green",
    rejected: "red",
  }[status] as Tone;
  return (
    <span className={cn("chip", toneClass[tone])}>
      <Dot tone={tone} />
      {submissionLabel(status)}
    </span>
  );
}

export function MilestoneChip({ status }: { status: MilestoneStatus }) {
  const tone: Tone = {
    awaiting_submission: "ink",
    under_review: "blue",
    approved: "green",
    disputed: "red",
    payout_triggered: "violet",
    settled: "green",
  }[status] as Tone;
  return (
    <span className={cn("chip", toneClass[tone])}>
      <Dot tone={tone} />
      {milestoneLabel(status)}
    </span>
  );
}

export function PayoutChip({ status }: { status: PayoutStatus }) {
  const tone: Tone = {
    not_ready: "ink",
    ready: "amber",
    triggered: "violet",
    confirmed: "green",
    failed: "red",
    held: "ink",
  }[status] as Tone;
  return (
    <span className={cn("chip", toneClass[tone])}>
      <Dot tone={tone} />
      {payoutLabel(status)}
    </span>
  );
}
