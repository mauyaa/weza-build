"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SubmissionStatus } from "@/lib/types";

const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function SubmitPanel({
  milestoneId,
  submissionStatus,
  latestVersion,
}: {
  milestoneId: string;
  submissionStatus: SubmissionStatus | null;
  latestVersion: number;
}) {
  const router = useRouter();
  const isResubmit =
    submissionStatus === "revision_requested" || submissionStatus === "rejected";
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Title is required");
    if (!file) return setError("Attach a drawing / evidence file");
    if (file.size > MAX_FILE_BYTES) return setError("File exceeds 25MB limit");
    setError(null);
    setSubmitting(true);
    const fd = new FormData();
    fd.set("title", title);
    fd.set("note", note);
    fd.set("file", file);
    const res = await fetch(`/api/milestones/${milestoneId}/submit`, {
      method: "POST",
      body: fd,
    });
    const json = await res.json();
    setSubmitting(false);
    if (!json.success) {
      setError(json.message || "Submit failed");
      return;
    }
    setTitle("");
    setNote("");
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
    startTransition(() => router.refresh());
  }

  return (
    <section className="card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-ink-700">
          {isResubmit ? `Resubmit · v${latestVersion + 1}` : latestVersion > 0 ? `New version · v${latestVersion + 1}` : "Submit package"}
        </h2>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Package title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Foundation pour — drawing package"
            maxLength={140}
          />
        </div>
        <div>
          <label className="label">Note for certifier</label>
          <textarea
            className="textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What changed in this version, references, etc."
          />
        </div>
        <div>
          <label className="label">File</label>
          <div className="flex items-center gap-3">
            <label className="btn-ghost cursor-pointer">
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                onChange={handleFile}
              />
              {file ? "Change file" : "Choose file"}
            </label>
            <div className="text-xs text-ink-500 mono truncate flex-1">
              {file ? `${file.name} · ${Math.max(1, Math.round(file.size / 1024))} KB` : "PDF, DWG, PNG — up to 25MB"}
            </div>
          </div>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-100">
          <button type="submit" className="btn-brand" disabled={submitting || pending}>
            {submitting
              ? "Uploading..."
              : pending
                ? "Updating..."
                : isResubmit
                  ? `Resubmit v${latestVersion + 1}`
                  : "Submit package"}
          </button>
        </div>
      </form>
    </section>
  );
}
