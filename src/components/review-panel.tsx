"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Action = "request_revision" | "approve" | "reject";

export function ReviewPanel({
  submissionId,
  currentVersion,
}: {
  submissionId: string;
  currentVersion: number;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Action | null>(null);
  const [, startTransition] = useTransition();

  async function run(action: Action) {
    setError(null);
    if (action === "request_revision" && !note.trim()) {
      setError("Explain what needs to change before requesting a revision.");
      return;
    }
    if (action === "reject" && !note.trim()) {
      setError("Add a note when rejecting.");
      return;
    }
    setBusy(action);
    const res = await fetch(`/api/submissions/${submissionId}/decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    const json = await res.json();
    setBusy(null);
    if (!json.success) {
      setError(json.message || "Decision failed");
      return;
    }
    setNote("");
    startTransition(() => router.refresh());
  }

  return (
    <section className="card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-ink-700">Decision · v{currentVersion}</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="label">Decision note</label>
          <textarea
            className="textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Required for revision or rejection. Optional for approval."
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-ink-100">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => run("reject")}
            disabled={busy !== null}
          >
            {busy === "reject" ? "Rejecting…" : "Reject"}
          </button>
          <button
            type="button"
            className="btn-amber"
            onClick={() => run("request_revision")}
            disabled={busy !== null}
          >
            {busy === "request_revision" ? "Requesting…" : "Request revision"}
          </button>
          <button
            type="button"
            className="btn-brand"
            onClick={() => run("approve")}
            disabled={busy !== null}
          >
            {busy === "approve" ? "Approving…" : "Approve milestone"}
          </button>
        </div>
      </div>
    </section>
  );
}
