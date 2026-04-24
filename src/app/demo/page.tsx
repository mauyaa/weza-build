import Link from "next/link";

const approvalTx = "4QmYw9WfDemoApprovalMemoTx7bU8pNairobiCertifierProof";
const payoutTx = "5TnK2sQpDemoSquadsPayoutTx9cA4rUSDCSettlementProof";

export const metadata = {
  title: "WEZA Build demo — Submit, certify, payout",
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">WEZA Build</Link>
          <Link href="/about" className="text-sm text-emerald-300 hover:underline">
            Why Solana
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 space-y-10">
        <section className="max-w-3xl">
          <div className="text-sm uppercase tracking-[0.2em] text-emerald-300 font-semibold">
            Judge demo mode
          </div>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight leading-tight">
            Submit. Certify on Solana. Payout with Squads.
          </h1>
          <p className="mt-5 text-lg text-white/70 leading-relaxed">
            A three-step Nairobi construction loop with realistic seeded data. No judge needs to hunt through dashboards: the approval transaction and payout transaction are the finale.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DemoStep
            n="1"
            title="Submit"
            actor="Contractor: Kofi Mensah"
            body="Uploads slab pour evidence for Nyali Mixed-Use Tower: cube tests, pour photos, and rebar inspection notes."
            meta="Milestone: Ground floor slab · Amount: 95,000 USDC"
          />
          <DemoStep
            n="2"
            title="Certify"
            actor="Certifier: Zanele Mbeki"
            body="Approves the milestone with a custom Anchor approval PDA. The PDA stores certifier pubkey, timestamp, project id, and milestone id."
            meta="Approval must exist before payout can move."
          />
          <DemoStep
            n="3"
            title="Payout"
            actor="Owner: Amani Otieno"
            body="Creates a Squads v4 2-of-2 payout proposal. Owner and certifier approvals are required before devnet USDC moves."
            meta="Powered by Squads multisig + SPL Token TransferChecked."
          />
        </section>

        <section className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6">
          <div className="text-sm uppercase tracking-[0.2em] text-emerald-200 font-semibold">
            Demo climax
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ExplorerCard
              label="Approval transaction"
              description="Anchor approval PDA proves certified completion."
              signature={approvalTx}
            />
            <ExplorerCard
              label="Payout transaction"
              description="Squads-approved USDC payout references the approval PDA."
              signature={payoutTx}
            />
          </div>
          <p className="mt-5 text-sm text-emerald-50/80">
            In a funded devnet run these links are replaced by the real signatures created by the certifier approval and Squads payout flow.
          </p>
        </section>
      </main>
    </div>
  );
}

function DemoStep({
  n,
  title,
  actor,
  body,
  meta,
}: {
  n: string;
  title: string;
  actor: string;
  body: string;
  meta: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="h-9 w-9 rounded-full bg-emerald-400 text-ink-950 flex items-center justify-center font-semibold">
        {n}
      </div>
      <h2 className="mt-5 text-xl font-semibold">{title}</h2>
      <div className="mt-2 text-sm text-emerald-200 font-medium">{actor}</div>
      <p className="mt-4 text-sm text-white/70 leading-relaxed">{body}</p>
      <div className="mt-5 rounded-lg bg-black/25 px-3 py-2 text-xs text-white/70">{meta}</div>
    </div>
  );
}

function ExplorerCard({
  label,
  description,
  signature,
}: {
  label: string;
  description: string;
  signature: string;
}) {
  return (
    <a
      href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border border-white/10 bg-black/25 p-5 hover:border-emerald-300/70 transition"
    >
      <div className="text-sm font-semibold text-white">{label}</div>
      <p className="mt-2 text-sm text-white/60">{description}</p>
      <div className="mt-4 mono text-xs text-emerald-200 break-all">{signature}</div>
    </a>
  );
}
