"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PayoutChip } from "./status-chip";
import { formatDateTime, formatUsdc, shortSig, shortWallet } from "@/lib/format";
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
  const [explorer, setExplorer] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function trigger() {
    if (!canTrigger) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/milestones/${milestone.id}/payout`, {
      method: "POST",
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) {
      setError(json.message || "Payout failed");
      return;
    }
    if (json.data?.explorer_url) setExplorer(json.data.explorer_url);
    startTransition(() => router.refresh());
  }

  const sig = payout?.tx_signature ?? milestone.payout_tx_signature;
  const explorerUrl = sig ? `https://explorer.solana.com/tx/${sig}?cluster=devnet` : explorer;

  return (
    <section className="card p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink-700">Payout</h2>
        <PayoutChip status={milestone.payout_status} />
      </div>
      <dl className="space-y-2 text-sm">
        <Row label="Amount" value={<span className="mono font-semibold">{formatUsdc(milestone.payout_amount_usdc)}</span>} />
        <Row label="Recipient" value={<span className="mono">{shortWallet(recipient)}</span>} />
        <Row label="Network" value={<span className="mono">solana-devnet</span>} />
        {payout?.triggered_at && (
          <Row label="Triggered" value={<span>{formatDateTime(payout.triggered_at)}</span>} />
        )}
        {payout?.confirmed_at && (
          <Row label="Confirmed" value={<span>{formatDateTime(payout.confirmed_at)}</span>} />
        )}
        {sig && (
          <Row
            label="Tx signature"
            value={
              <a
                href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="mono text-brand-700 hover:underline break-all"
              >
                {shortSig(sig, 10)}
              </a>
            }
          />
        )}
        {payout?.failure_reason && (
          <Row label="Last failure" value={<span className="text-red-700 text-xs">{payout.failure_reason}</span>} />
        )}
      </dl>
      {role === "owner" && canTrigger && (
        <div className="mt-4 pt-4 border-t border-ink-100">
          <button type="button" className="btn-brand w-full" disabled={busy || pending} onClick={trigger}>
            {busy
              ? "Sending on devnet..."
              : pending
                ? "Updating payout..."
                : `Trigger payout · ${formatUsdc(milestone.payout_amount_usdc)}`}
          </button>
          {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
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
