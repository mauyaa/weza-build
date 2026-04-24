"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatUsdc, timeAgo } from "@/lib/format";
import type { Role } from "@/lib/types";
import type { ProjectSummary } from "@/lib/repo";

export function ProjectsTable({
  projects,
  role,
}: {
  projects: ProjectSummary[];
  role: Role;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.owner_name.toLowerCase().includes(term) ||
        p.certifier_name.toLowerCase().includes(term) ||
        p.contractor_name.toLowerCase().includes(term)
    );
  }, [q, projects]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          className="input max-w-sm"
          placeholder="Search projects, code, or team member…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="text-xs text-ink-500">
          {filtered.length} of {projects.length}
        </span>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 border-b border-ink-200 text-xs uppercase tracking-wider text-ink-500">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Project</th>
              <th className="text-left px-4 py-3 font-semibold">Team</th>
              <th className="text-right px-4 py-3 font-semibold">Contract</th>
              <th className="text-left px-4 py-3 font-semibold">Progress</th>
              <th className="text-right px-4 py-3 font-semibold">Payout ready</th>
              <th className="text-left px-4 py-3 font-semibold">Next action</th>
              <th className="text-right px-4 py-3 font-semibold">Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {filtered.map((p) => {
              const pct = p.total_milestones === 0 ? 0 : Math.round((p.settled / p.total_milestones) * 100);
              const nextAction = computeNextAction(p, role);
              return (
                <tr key={p.id} className="hover:bg-ink-50/60 transition">
                  <td className="px-4 py-3">
                    <Link href={`/app/projects/${p.id}`} className="font-medium text-ink-900 hover:underline">
                      {p.name}
                    </Link>
                    <div className="text-xs text-ink-500 mono">{p.code}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    <div className="text-xs">Owner: {p.owner_name}</div>
                    <div className="text-xs">Certifier: {p.certifier_name}</div>
                    <div className="text-xs">Contractor: {p.contractor_name}</div>
                  </td>
                  <td className="px-4 py-3 text-right mono">{formatUsdc(p.contract_value_usdc)}</td>
                  <td className="px-4 py-3 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-ink-100 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-ink-500 mono">
                        {p.settled}/{p.total_milestones}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right mono text-amber-600">{p.payout_ready}</td>
                  <td className="px-4 py-3">
                    <span className="chip bg-ink-100 text-ink-700 border-ink-200">{nextAction}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-ink-500">{timeAgo(p.last_activity_at)}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-500">
                  No projects match “{q}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function computeNextAction(p: ProjectSummary, role: Role): string {
  if (role === "owner") {
    if (p.payout_ready > 0) return `Pay out ${p.payout_ready}`;
    if (p.active_milestones > 0) return "Awaiting approval";
    if (p.settled === p.total_milestones && p.total_milestones > 0) return "Complete";
    return "Idle";
  }
  if (role === "certifier") {
    if (p.active_milestones > 0) return `Review ${p.active_milestones}`;
    return "Clear";
  }
  const open = p.total_milestones - p.settled - p.approved_milestones;
  if (open > 0) return `Submit ${open}`;
  return "Up to date";
}
