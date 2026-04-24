import { bytes, formatDateTime } from "@/lib/format";
import type { ApprovalDecision, SubmissionVersion } from "@/lib/types";

export function VersionHistory({
  versions,
  decisions,
  authors,
}: {
  versions: SubmissionVersion[];
  decisions: ApprovalDecision[];
  authors: Map<string, string>;
}) {
  if (versions.length === 0) {
    return <div className="card p-6 text-sm text-ink-500 text-center">No versions yet.</div>;
  }
  return (
    <ol className="space-y-3">
      {[...versions].reverse().map((v) => {
        const decision = decisions.find((d) => d.version === v.version);
        return (
          <li key={v.id} className="card p-4">
            <div className="flex items-center gap-3">
              <span className="chip bg-ink-900 text-white border-ink-900 mono">v{v.version}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-ink-900 truncate">{v.title}</div>
                <div className="text-xs text-ink-500">
                  Submitted by {authors.get(v.submitted_by) ?? "—"} · {formatDateTime(v.submitted_at)} · {v.file_name} · {bytes(v.file_size_bytes)}
                </div>
              </div>
              {v.storage_key && (
                <a
                  href={`/api/versions/${v.id}/file`}
                  className="btn-ghost text-xs shrink-0"
                >
                  Download
                </a>
              )}
            </div>
            {v.note && <div className="text-sm text-ink-700 mt-2">{v.note}</div>}
            {decision && (
              <div className="mt-3 border-t border-ink-100 pt-3 text-sm">
                <span
                  className={
                    decision.action === "approve"
                      ? "chip bg-emerald-50 text-emerald-700 border-emerald-200"
                      : decision.action === "request_revision"
                        ? "chip bg-amber-50 text-amber-700 border-amber-200"
                        : "chip bg-red-50 text-red-700 border-red-200"
                  }
                >
                  {decision.action === "approve"
                    ? "Approved"
                    : decision.action === "request_revision"
                      ? "Revision requested"
                      : "Rejected"}
                </span>
                <div className="text-xs text-ink-500 mt-1">
                  {authors.get(decision.certifier_id) ?? "Certifier"} · {formatDateTime(decision.created_at)}
                </div>
                {decision.note && <div className="text-ink-700 mt-1">{decision.note}</div>}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
