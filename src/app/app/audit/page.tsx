import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/session";
import { recentAudit } from "@/lib/views";
import { AuditRow } from "@/components/audit-row";

export default async function AuditPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");
  const events = await recentAudit(profile, 200);
  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Audit</h1>
        <span className="text-xs text-ink-500">{events.length} events</span>
      </div>
      <div className="card divide-y divide-ink-100">
        {events.length === 0 ? (
          <div className="p-10 text-sm text-ink-500 text-center">No events yet.</div>
        ) : (
          events.map((e) => <AuditRow key={e.id} event={e} />)
        )}
      </div>
    </div>
  );
}
