"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const demoAccounts = [
  { email: "owner@weza.build", label: "Amani (Owner)" },
  { email: "certifier@weza.build", label: "Zanele (Certifier)" },
  { email: "contractor@weza.build", label: "Kofi (Contractor)" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@weza.build");
  const [password, setPassword] = useState("weza1234");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) {
      setError(json.message || "Sign-in failed");
      return;
    }
    startTransition(() => {
      router.push("/app");
      router.refresh();
    });
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
            placeholder="••••••••"
            required
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button className="btn-primary w-full" type="submit" disabled={busy || pending}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="mt-4 text-sm text-ink-500">
        Need an account?{" "}
        <Link href="/signup" className="text-brand-700 hover:underline font-medium">
          Create one
        </Link>
      </div>
      <div className="mt-8 pt-6 border-t border-ink-200">
        <div className="text-xs uppercase tracking-wider text-ink-400 mb-2">Demo accounts</div>
        <div className="space-y-1">
          {demoAccounts.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                setEmail(a.email);
                setPassword("weza1234");
              }}
              className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-ink-100 border border-ink-200/50 flex items-center justify-between"
            >
              <span>{a.label}</span>
              <span className="text-ink-400 mono text-xs">{a.email}</span>
            </button>
          ))}
          <div className="text-[11px] text-ink-400 mt-2">Password: <span className="mono">weza1234</span></div>
        </div>
      </div>
    </div>
  );
}
