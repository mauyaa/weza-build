"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import type { ReviewComment } from "@/lib/types";

export function CommentThread({
  submissionId,
  comments,
  authors,
  canPost,
}: {
  submissionId: string;
  comments: ReviewComment[];
  authors: Map<string, string>;
  canPost: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function post() {
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/submissions/${submissionId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) {
      setError(json.message || "Comment failed");
      return;
    }
    setBody("");
    startTransition(() => router.refresh());
  }

  return (
    <div className="card">
      <ul className="divide-y divide-ink-100">
        {comments.length === 0 ? (
          <li className="p-6 text-sm text-ink-500 text-center">No comments yet.</li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className="p-4">
              <div className="text-xs text-ink-500">
                <span className="font-medium text-ink-700">{authors.get(c.author_id) ?? "—"}</span>
                <span className="mx-1.5">·</span>
                v{c.version} · {formatDateTime(c.created_at)}
              </div>
              <div className="text-sm text-ink-900 mt-1 whitespace-pre-wrap">{c.body}</div>
            </li>
          ))
        )}
      </ul>
      {canPost && (
        <div className="p-4 border-t border-ink-100 space-y-2">
          <textarea
            className="textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment for the team"
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex justify-end">
            <button type="button" className="btn-ghost" onClick={post} disabled={busy || pending || !body.trim()}>
              {busy ? "Posting..." : pending ? "Refreshing..." : "Post comment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
