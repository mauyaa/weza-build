import Link from "next/link";
import { getCurrentProfile } from "@/lib/session";
import { listProjectsForUser } from "@/lib/repo";
import { actionQueue, dashboardKpis, recentAudit } from "@/lib/views";
import { formatUsdc } from "@/lib/format";
import { AuditRow } from "@/components/audit-row";
import { ActionCard } from "@/components/action-card";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const [kpis, queue, audit, projects] = await Promise.all([
    dashboardKpis(profile),
    actionQueue(profile),
    recentAudit(profile, 8),
    listProjectsForUser(profile),
  ]);

  const roleTitle = {
    owner: "Payout cockpit",
    certifier: "Review desk",
    contractor: "Build queue",
  }[profile.role];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{roleTitle}</h1>
        <span className="text-xs text-ink-500">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Kpi label="Active projects" value={kpis.active_projects} />
        <Kpi label="Pending review" value={kpis.pending_review} tone="blue" />
        <Kpi label="Revision requested" value={kpis.revision_requested} tone="amber" />
        <Kpi label="Payout ready" value={kpis.payout_ready} tone="amber" />
        <Kpi label="Settled" value={kpis.settled} tone="green" />
        <Kpi
          label="Value settled"
          value={formatUsdc(kpis.total_settled_usdc)}
          tone="green"
          valueClass="text-base"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-ink-700">Next up</h2>
          {queue.length === 0 ? (
            <div className="card p-6 text-sm text-ink-500 text-center">Nothing waiting on you.</div>
          ) : (
            <div className="space-y-2">
              {queue.map((item) => (
                <ActionCard key={`${item.kind}:${item.milestone_id}`} item={item} role={profile.role} />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <h2 className="text-sm font-semibold text-ink-700">Projects</h2>
            <Link href="/app/projects" className="text-xs text-brand-700 hover:underline">
              View all
            </Link>
          </div>
          <div className="card divide-y divide-ink-100">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/app/projects/${p.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-ink-50 transition"
              >
                <div className="flex-1">
                  <div className="font-medium text-ink-900">{p.name}</div>
                  <div className="text-xs text-ink-500 mono">{p.code} · {formatUsdc(p.contract_value_usdc)}</div>
                </div>
                <div className="text-xs text-ink-500 flex gap-4">
                  <Stat n={p.active_milestones} label="active" />
                  <Stat n={p.payout_ready} label="ready" tone="amber" />
                  <Stat n={p.settled} label="settled" tone="green" />
                </div>
              </Link>
            ))}
            {projects.length === 0 && (
              <div className="p-8 text-sm text-ink-500 text-center">No projects assigned yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-700">Activity</h2>
            <Link href="/app/audit" className="text-xs text-brand-700 hover:underline">
              View all
            </Link>
          </div>
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

function Kpi({
  label,
  value,
  tone = "ink",
  valueClass,
}: {
  label: string;
  value: number | string;
  tone?: "ink" | "blue" | "amber" | "green";
  valueClass?: string;
}) {
  const toneClass = {
    ink: "text-ink-900",
    blue: "text-blue-700",
    amber: "text-amber-600",
    green: "text-emerald-700",
  }[tone];
  return (
    <div className="kpi">
      <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">{label}</div>
      <div className={`text-2xl font-semibold mono ${toneClass} ${valueClass ?? ""}`}>{value}</div>
    </div>
  );
}

function Stat({ n, label, tone = "ink" }: { n: number; label: string; tone?: "ink" | "amber" | "green" }) {
  const color = { ink: "text-ink-700", amber: "text-amber-600", green: "text-emerald-700" }[tone];
  return (
    <div className="flex items-baseline gap-1">
      <span className={`mono font-semibold ${color}`}>{n}</span>
      <span className="text-[11px] uppercase tracking-wider text-ink-400">{label}</span>
    </div>
  );
}
