"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PayoutChip } from "./status-chip";
import { SolanaProof } from "./solana-proof";
import { formatDateTime, formatUsdc, shortWallet } from "@/lib/format";
import type { Milestone, PayoutInstruction, Role } from "@/lib/types";

export function PayoutPanel({
  milestone,
  payout,
  recipient,
  canTrigger,
  role,
}: {
  milestone: Milestone;
  payout: PayoutInstruction | null;
  recipient: string | null;
  canTrigger: boolean;
  role: Role;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function trigger() {
    if (!canTrigger) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/milestones/${milestone.id}/payout`, {
        method: "POST",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.message || "Payout failed before Solana confirmation");
        startTransition(() => router.refresh());
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Payout request could not reach the server. No success was recorded.");
    } finally {
      setBusy(false);
    }
  }

  const sig = payout?.tx_signature ?? milestone.payout_tx_signature;
  const isRetry = payout?.status === "failed";

  return (
    <section className="card p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink-700">Solana payout</h2>
        <PayoutChip status={milestone.payout_status} />
      </div>
      <dl className="space-y-2 text-sm">
        <Row label="Amount" value={<span className="mono font-semibold">{formatUsdc(milestone.payout_amount_usdc)}</span>} />
        <Row label="Recipient" value={<span className="mono">{shortWallet(recipient)}</span>} />
        <Row label="Network" value={<span className="mono">solana-devnet</span>} />
        <Row label="Purpose" value={<span className="text-xs">Verifiable devnet payout proof</span>} />
        {payout?.triggered_at && (
          <Row label="Triggered" value={<span>{formatDateTime(payout.triggered_at)}</span>} />
        )}
        {payout?.confirmed_at && (
          <Row label="Confirmed" value={<span>{formatDateTime(payout.confirmed_at)}</span>} />
        )}
        {payout?.failure_reason && (
          <Row label="Last failure" value={<span className="text-red-700 text-xs">{payout.failure_reason}</span>} />
        )}
      </dl>
      <div className="mt-4">
        {sig ? (
          <SolanaProof signature={sig} amount={milestone.payout_amount_usdc} />
        ) : (
          <div className="rounded-lg border border-dashed border-ink-300 bg-ink-50 p-3 text-xs leading-relaxed text-ink-600">
            <span className="font-semibold text-ink-800">Solana proof appears here after confirmation.</span>{" "}
            WEZA records the devnet transaction signature and links it to the milestone/payment audit trail.
          </div>
        )}
      </div>
      {role === "owner" && canTrigger && (
        <div className="mt-4 pt-4 border-t border-ink-100">
          <button type="button" className="btn-brand w-full" disabled={busy || pending} onClick={trigger}>
            {busy
              ? "Sending on devnet..."
              : pending
                ? "Updating payout..."
                : `${isRetry ? "Retry payout" : "Trigger payout"} · ${formatUsdc(milestone.payout_amount_usdc)}`}
          </button>
          {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
        </div>
      )}
      {!sig && !canTrigger && (
        <div className="mt-4 border-t border-ink-100 pt-4 text-xs text-ink-500">
          {role === "owner"
            ? "Payout is locked until the certifier approves this milestone."
            : "Only the project owner can trigger payout after certifier approval."}
        </div>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-ink-500 text-xs uppercase tracking-wider">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
