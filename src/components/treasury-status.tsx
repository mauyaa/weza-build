"use client";

import { useEffect, useState } from "react";

interface HealthResponse {
  success: boolean;
  data: {
    mode: "live" | "mock";
    publicKey?: string;
    lamports?: number;
    usdcUi?: number;
    usdcMint?: string;
    cluster?: string;
    treasury_explorer?: string;
    usdc_ata_explorer?: string;
    usdc_mint_explorer?: string;
  } | null;
  message: string;
}

export function TreasuryStatus() {
  const [data, setData] = useState<HealthResponse | null>(null);

  useEffect(() => {
    let stopped = false;
    (async () => {
      try {
        const res = await fetch("/api/health/solana", { cache: "no-store" });
        const json = (await res.json()) as HealthResponse;
        if (!stopped) setData(json);
      } catch {
        // ignore; section will render the "unavailable" state
      }
    })();
    return () => {
      stopped = true;
    };
  }, []);

  const live = data?.success && data.data?.mode === "live";
  const d = data?.data;

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
          Live devnet treasury
        </div>
        {live ? (
          <span className="chip bg-emerald-50 text-emerald-700 border-emerald-200">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        ) : data && data.data?.mode === "mock" ? (
          <span className="chip bg-amber-50 text-amber-700 border-amber-200">Mock</span>
        ) : data ? (
          <span className="chip bg-red-50 text-red-700 border-red-200">Offline</span>
        ) : (
          <span className="chip bg-ink-100 text-ink-500 border-ink-200">Checking…</span>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <Row label="USDC balance" value={live && d?.usdcUi != null ? `${d.usdcUi.toLocaleString()} USDC` : "—"} mono />
        <Row
          label="SOL balance"
          value={live && d?.lamports != null ? `${(d.lamports / 1e9).toFixed(3)} SOL` : "—"}
          mono
        />
        <Row label="Cluster" value={live ? d?.cluster ?? "—" : "—"} mono />
        <Row
          label="Treasury"
          value={
            live && d?.publicKey && d?.treasury_explorer ? (
              <a
                href={d.treasury_explorer}
                target="_blank"
                rel="noreferrer"
                className="mono text-brand-700 hover:underline"
              >
                {short(d.publicKey)}
              </a>
            ) : (
              "—"
            )
          }
        />
        <Row
          label="USDC mint"
          value={
            live && d?.usdcMint && d?.usdc_mint_explorer ? (
              <a
                href={d.usdc_mint_explorer}
                target="_blank"
                rel="noreferrer"
                className="mono text-brand-700 hover:underline"
              >
                {short(d.usdcMint)}
              </a>
            ) : (
              "—"
            )
          }
        />
        <Row label="Source" value="Circle devnet faucet" />
      </dl>

      {!live && data && (
        <p className="mt-4 text-xs text-ink-500 leading-relaxed">
          {data.message || "Treasury is not live from this deploy."}
        </p>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className={`mt-0.5 text-ink-900 ${mono ? "mono font-semibold" : ""}`}>{value}</dd>
    </div>
  );
}

function short(s: string) {
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-6)}`;
}
