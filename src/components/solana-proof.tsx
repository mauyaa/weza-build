import { formatUsdc } from "@/lib/format";

export function SolanaProof({
  signature,
  amount,
  compact = false,
}: {
  signature: string;
  amount?: number | string | null;
  compact?: boolean;
}) {
  const explorer = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

  return (
    <div className={`rounded-xl border border-emerald-300 bg-emerald-50 ${compact ? "p-3" : "p-5"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Solana payout proof
          </div>
          <div className="mt-1 font-semibold text-emerald-950">
            Confirmed on Solana devnet{amount != null ? ` - ${formatUsdc(amount)}` : ""}
          </div>
        </div>
        <span className="chip border-emerald-300 bg-white text-emerald-800">Audit record updated</span>
      </div>
      <div className="mt-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
          Transaction signature
        </div>
        <code className="mono mt-1 block break-all rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-emerald-950">
          {signature}
        </code>
      </div>
      {!compact && (
        <p className="mt-3 text-xs leading-relaxed text-emerald-900">
          WEZA approval recorded -&gt; owner triggered payout -&gt; Solana signature recorded -&gt;
          milestone/payment audit trail updated.
        </p>
      )}
      <a
        href={explorer}
        target="_blank"
        rel="noreferrer"
        className={`${compact ? "mt-2 text-xs font-semibold text-emerald-800 hover:underline" : "btn-brand mt-4 w-full"}`}
      >
        Open Solana Explorer (Devnet)
      </a>
    </div>
  );
}
