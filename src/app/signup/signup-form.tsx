"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

type Role = "owner" | "certifier" | "contractor";

const roles: { value: Role; title: string; desc: string }[] = [
  { value: "owner", title: "Owner", desc: "Approves payouts, runs the workspace." },
  { value: "certifier", title: "Certifier", desc: "QS, architect or engineer signing off milestones." },
  { value: "contractor", title: "Contractor", desc: "Submits drawings and evidence for review." },
];

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("owner");
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        password,
        role,
        organizationName: role === "owner" ? organizationName : undefined,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) {
      setError(json.message || "Signup failed");
      return;
    }
    startTransition(() => {
      router.push("/app");
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-md">
      <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label">Role</label>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "text-left rounded-lg border px-3 py-2 transition",
                  role === r.value
                    ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20"
                    : "border-ink-200 hover:border-ink-300 bg-white"
                )}
              >
                <div className="text-sm font-semibold text-ink-900">{r.title}</div>
                <div className="text-[11px] text-ink-500 leading-snug mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Full name</label>
          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            required
          />
        </div>

        <div>
          <label className="label">Work email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@firm.com"
            required
          />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
        </div>

        {role === "owner" && (
          <div>
            <label className="label">Organization name</label>
            <input
              className="input"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Harambee Construction Holdings"
            />
          </div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button className="btn-primary w-full" type="submit" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="mt-4 text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/" className="text-brand-700 hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </div>
  );
}
