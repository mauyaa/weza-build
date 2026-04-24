import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/session";
import { getProfile, getProject, listAudit } from "@/lib/repo";
import { milestonesForProject } from "@/lib/views";
import { formatUsdc, formatDate, timeAgo } from "@/lib/format";
import { MilestoneChip, PayoutChip, SubmissionChip } from "@/components/status-chip";
import { AuditRow } from "@/components/audit-row";

export default async function ProjectDetail({ params }: { params: { id: string } }) {
  const profile = (await getCurrentProfile())!;
  const project = await getProject(params.id);
  if (!project) notFound();
  if (
    !(
      (profile.role === "owner" && project.owner_id === profile.id) ||
      (profile.role === "certifier" && project.certifier_id === profile.id) ||
      (profile.role === "contractor" && project.contractor_id === profile.id)
    )
  ) {
    notFound();
  }
  const [owner, certifier, contractor, milestones, audit] = await Promise.all([
    getProfile(project.owner_id),
    getProfile(project.certifier_id),
    getProfile(project.contractor_id),
    milestonesForProject(project.id),
    listAudit({ orgId: project.org_id, projectId: project.id, limit: 20 }),
  ]);

  const totalValue = Number(project.contract_value_usdc);
  const settledValue = milestones
    .filter((m) => m.status === "settled")
    .reduce((acc, m) => acc + Number(m.payout_amount_usdc), 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs text-ink-500 mono">{project.code}</div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        </div>
        <div className="flex gap-6 text-sm">
          <Metric label="Contract" value={formatUsdc(totalValue)} />
          <Metric label="Settled" value={formatUsdc(settledValue)} tone="green" />
          <Metric
            label="Progress"
            value={`${milestones.filter((m) => m.status === "settled").length}/${milestones.length}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {owner && <TeamCard title="Owner" profile={owner} />}
        {certifier && <TeamCard title="Certifier" profile={certifier} />}
        {contractor && <TeamCard title="Contractor" profile={contractor} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-ink-700">Milestones</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 border-b border-ink-200 text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold w-10">#</th>
                  <th className="text-left px-4 py-3 font-semibold">Milestone</th>
                  <th className="text-left px-4 py-3 font-semibold">Submission</th>
                  <th className="text-left px-4 py-3 font-semibold">Milestone state</th>
                  <th className="text-left px-4 py-3 font-semibold">Payout</th>
                  <th className="text-right px-4 py-3 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {milestones.map((m) => (
                  <tr key={m.id} className="hover:bg-ink-50/60 transition">
                    <td className="px-4 py-3 mono text-ink-500">{m.sequence}</td>
                    <td className="px-4 py-3">
                      <Link href={`/app/milestones/${m.id}`} className="font-medium text-ink-900 hover:underline">
                        {m.title}
                      </Link>
                      <div className="text-xs text-ink-500">Due {formatDate(m.due_date)}</div>
                    </td>
                    <td className="px-4 py-3">
                      {m.submission_status ? (
                        <SubmissionChip status={m.submission_status} />
                      ) : (
                        <span className="text-xs text-ink-400">No submission</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><MilestoneChip status={m.status} /></td>
                    <td className="px-4 py-3"><PayoutChip status={m.payout_status} /></td>
                    <td className="px-4 py-3 text-right mono">{formatUsdc(m.payout_amount_usdc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-ink-700">Activity</h2>
          <div className="card divide-y divide-ink-100">
            {audit.length === 0 ? (
              <div className="p-6 text-sm text-ink-500 text-center">No events yet.</div>
            ) : (
              audit.map((e) => <AuditRow key={e.id} event={e} compact />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone = "ink" }: { label: string; value: string; tone?: "ink" | "green" }) {
  const color = tone === "green" ? "text-emerald-700" : "text-ink-900";
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">{label}</span>
      <span className={`mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function TeamCard({ title, profile }: { title: string; profile: { full_name: string; email: string; wallet_address: string | null } }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">{title}</div>
      <div className="font-medium mt-1">{profile.full_name}</div>
      <div className="text-xs text-ink-500">{profile.email}</div>
      {profile.wallet_address && (
        <div className="text-xs text-ink-500 mono mt-1">{profile.wallet_address.slice(0, 6)}…{profile.wallet_address.slice(-6)}</div>
      )}
    </div>
  );
}
