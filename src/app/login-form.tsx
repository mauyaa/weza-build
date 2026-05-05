"use client";

import Link from "next/link";
import { useState } from "react";

const demoAccounts = [
  { email: "owner@weza.build", label: "Amani (Owner)" },
  { email: "certifier@weza.build", label: "Zanele (Certifier)" },
  { email: "contractor@weza.build", label: "Kofi (Contractor)" },
];

export function LoginForm() {
  const [email, setEmail] = useState("owner@weza.build");
  const [password, setPassword] = useState("weza1234");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.message || "Sign-in failed");
        return;
      }
      // Force a fresh request so the first /app render sees the new auth cookies.
      window.location.assign("/app");
    } catch {
      setError("Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@firm.com"
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
            placeholder="Password"
            required
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="btn-primary w-full" type="submit" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="mt-4 text-sm text-ink-500">
        Need an account?{" "}
        <Link href="/signup" className="text-brand-700 hover:underline font-medium">
          Create one
        </Link>
      </div>
      <div className="mt-8 border-t border-ink-200 pt-6">
        <div className="mb-2 text-xs uppercase tracking-wider text-ink-400">Demo accounts</div>
        <div className="space-y-1">
          {demoAccounts.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                setEmail(a.email);
                setPassword("weza1234");
              }}
              className="flex w-full items-center justify-between rounded-md border border-ink-200/50 px-3 py-2 text-left text-sm hover:bg-ink-100"
            >
              <span>{a.label}</span>
              <span className="mono text-xs text-ink-400">{a.email}</span>
            </button>
          ))}
          <div className="mt-2 text-[11px] text-ink-400">
            Password: <span className="mono">weza1234</span>
          </div>
        </div>
      </div>
    </div>
  );
}
