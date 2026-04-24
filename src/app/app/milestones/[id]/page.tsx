import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/session";
import {
  getLatestPayout,
  getMilestone,
  getProfile,
  getProject,
  getSubmissionForMilestone,
  listAudit,
  listComments,
  listDecisions,
  listVersions,
} from "@/lib/repo";
import { formatDate, formatUsdc, shortSig } from "@/lib/format";
import { MilestoneChip, PayoutChip, SubmissionChip } from "@/components/status-chip";
import { SubmitPanel } from "@/components/submit-panel";
import { ReviewPanel } from "@/components/review-panel";
import { PayoutPanel } from "@/components/payout-panel";
import { VersionHistory } from "@/components/version-history";
import { CommentThread } from "@/components/comment-thread";
import { LiveMilestoneAudit } from "@/components/live-audit";
import { HandoffPill } from "@/components/handoff-pill";

export const dynamic = "force-dynamic";

export default async function MilestonePage({ params }: { params: { id: string } }) {
  const profile = (await getCurrentProfile())!;
  const milestone = await getMilestone(params.id);
  if (!milestone) notFound();
  const project = (await getProject(milestone.project_id))!;
  if (
    !(
      (profile.role === "owner" && project.owner_id === profile.id) ||
      (profile.role === "certifier" && project.certifier_id === profile.id) ||
      (profile.role === "contractor" && project.contractor_id === profile.id)
    )
  ) {
    notFound();
  }
  const submission = await getSubmissionForMilestone(milestone.id);
  const [versions, comments, decisions, payout, audit, contractor, certProfile, ownerProfile] =
    await Promise.all([
      submission ? listVersions(submission.id) : Promise.resolve([]),
      submission ? listComments(submission.id) : Promise.resolve([]),
      submission ? listDecisions(submission.id) : Promise.resolve([]),
      getLatestPayout(milestone.id),
      listAudit({ orgId: project.org_id, projectId: project.id, limit: 50 }).then((rows) =>
        rows.filter((a) => a.milestone_id === milestone.id)
      ),
      getProfile(project.contractor_id),
      getProfile(project.certifier_id),
      getProfile(project.owner_id),
    ]);
  if (!contractor || !certProfile || !ownerProfile) notFound();

  const isOwner = profile.role === "owner" && project.owner_id === profile.id;
  const isCertifier = profile.role === "certifier" && project.certifier_id === profile.id;
  const isContractor = profile.role === "contractor" && project.contractor_id === profile.id;

  const subStatus = submission?.status ?? null;
  const canSubmit =
    isContractor &&
    (milestone.status === "awaiting_submission" ||
      subStatus === null ||
      subStatus === "draft" ||
      subStatus === "revision_requested" ||
      subStatus === "rejected");
  const canReview = isCertifier && subStatus === "under_review";
  const canPayout =
    isOwner && milestone.status === "approved" && (payout?.status === "ready" || payout?.status === "failed");

  const authors = new Map<string, string>();
  authors.set(contractor.id, contractor.full_name);
  authors.set(certProfile.id, certProfile.full_name);
  authors.set(ownerProfile.id, ownerProfile.full_name);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs text-ink-500">
            <Link href={`/app/projects/${project.id}`} className="hover:underline">
              {project.name}
            </Link>
            <span className="mx-1.5">/</span>
            <span className="mono">Milestone {milestone.sequence}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">{milestone.title}</h1>
          <div className="flex gap-2 mt-3 flex-wrap items-center">
            <MilestoneChip status={milestone.status} />
            <PayoutChip status={milestone.payout_status} />
            {submission && <SubmissionChip status={submission.status} />}
            <span className="text-xs text-ink-500">Due {formatDate(milestone.due_date)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <HandoffPill
            milestoneStatus={milestone.status}
            submissionStatus={subStatus}
            payoutStatus={milestone.payout_status}
            ownerName={ownerProfile.full_name}
            certifierName={certProfile.full_name}
            contractorName={contractor.full_name}
          />
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">Payout</div>
            <div className="mono font-semibold text-xl">{formatUsdc(milestone.payout_amount_usdc)}</div>
          </div>
        </div>
      </div>

      {milestone.approval_tx_signature && (
        <OnChainApprovalBanner
          signature={milestone.approval_tx_signature}
          pda={milestone.approval_pda}
          network={milestone.approval_network}
        />
      )}

      {milestone.status === "settled" && milestone.payout_tx_signature && (
        <SettledBanner signature={milestone.payout_tx_signature} amount={milestone.payout_amount_usdc} />
      )}

      <WorkflowTimeline
        milestoneStatus={milestone.status}
        submissionStatus={subStatus}
        payoutStatus={milestone.payout_status}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {canSubmit && (
            <SubmitPanel
              milestoneId={milestone.id}
              submissionStatus={subStatus}
              latestVersion={submission?.current_version ?? 0}
            />
          )}

          {canReview && submission && (
            <ReviewPanel
              submissionId={submission.id}
              currentVersion={submission.current_version}
            />
          )}

          {submission && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-ink-700">Versions</h2>
              <VersionHistory versions={versions} decisions={decisions} authors={authors} />
            </section>
          )}

          {submission && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-ink-700">Discussion</h2>
              <CommentThread
                submissionId={submission.id}
                comments={comments}
                authors={authors}
                canPost={!!submission && submission.status !== "approved" && submission.status !== "rejected"}
              />
            </section>
          )}
        </div>

        <div className="space-y-6">
          <PayoutPanel
            milestone={milestone}
            payout={payout}
            recipient={contractor.wallet_address}
            canTrigger={canPayout}
            role={profile.role}
          />

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-ink-700">Audit trail</h2>
            <LiveMilestoneAudit milestoneId={milestone.id} initial={audit} />
          </section>
        </div>
      </div>
    </div>
  );
}

function SettledBanner({ signature, amount }: { signature: string; amount: number }) {
  return (
    <div className="card border-emerald-200 bg-emerald-50/60 p-5 flex items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg">
        ✓
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-emerald-900">
          Settled on Solana devnet · {formatUsdc(amount)}
        </div>
        <div className="text-xs text-emerald-800/80 mt-0.5">
          Tx <span className="mono">{shortSig(signature, 10)}</span>
        </div>
      </div>
      <a
        href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
        target="_blank"
        rel="noreferrer"
        className="btn-brand shrink-0"
      >
        View on Explorer
      </a>
    </div>
  );
}

function OnChainApprovalBanner({
  signature,
  pda,
  network,
}: {
  signature: string;
  pda: string | null;
  network: string | null;
}) {
  return (
    <div className="card border-violet-200 bg-violet-50/70 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-violet-950">
          Certifier approval recorded on {network ?? "solana-devnet"}
        </div>
        <div className="text-xs text-violet-900/75 mt-1">
          Approval PDA <span className="mono">{shortSig(pda ?? undefined, 8)}</span> unlocks the payout queue.
        </div>
      </div>
      <a
        href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
        target="_blank"
        rel="noreferrer"
        className="btn-ghost bg-white"
      >
        View approval tx
      </a>
    </div>
  );
}

function WorkflowTimeline({
  milestoneStatus,
  submissionStatus,
  payoutStatus,
}: {
  milestoneStatus: string;
  submissionStatus: string | null;
  payoutStatus: string;
}) {
  const steps = [
    {
      key: "submit",
      label: "Submitted",
      done: submissionStatus !== null,
    },
    {
      key: "review",
      label: "Under review",
      done:
        submissionStatus === "under_review" ||
        submissionStatus === "revision_requested" ||
        submissionStatus === "resubmitted" ||
        submissionStatus === "approved" ||
        submissionStatus === "rejected",
      active: submissionStatus === "under_review" || submissionStatus === "revision_requested",
    },
    {
      key: "approve",
      label: "Approved",
      done: submissionStatus === "approved",
    },
    {
      key: "payout_ready",
      label: "Payout ready",
      done: ["ready", "triggered", "confirmed"].includes(payoutStatus),
    },
    {
      key: "payout",
      label: "Payout confirmed",
      done: payoutStatus === "confirmed" || milestoneStatus === "settled",
    },
  ];
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div
                className={
                  s.done
                    ? "h-5 w-5 rounded-full bg-emerald-500 text-white text-[11px] flex items-center justify-center"
                    : s.active
                      ? "h-5 w-5 rounded-full bg-amber-500 text-white text-[11px] flex items-center justify-center"
                      : "h-5 w-5 rounded-full border-2 border-ink-200"
                }
              >
                {s.done ? "✓" : ""}
              </div>
              <span className={`text-xs font-medium ${s.done ? "text-ink-900" : "text-ink-500"}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px flex-1 ${s.done ? "bg-emerald-400" : "bg-ink-200"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
