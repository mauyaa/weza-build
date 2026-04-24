import Link from "next/link";
import type { Metadata } from "next";
import { TreasuryStatus } from "@/components/treasury-status";

export const metadata: Metadata = {
  title: "WEZA Build — approval-to-payout for construction",
  description:
    "Approval-to-payout platform for construction teams. Submit drawings, certify, approve, and settle in devnet USDC on Solana.",
};

export const dynamic = "force-static";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <header className="border-b border-ink-200">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="5" className="fill-ink-950" />
              <path d="M6 16l3-8 3 6 3-6 3 8" stroke="#34d399" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-semibold tracking-tight">WEZA Build</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/signup" className="btn-ghost">Create account</Link>
            <Link href="/" className="btn-primary">Sign in</Link>
          </div>
        </div>
      </header>

      <section className="border-b border-ink-200">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight">
              Approval-to-payout<br />for construction.
            </h1>
            <p className="mt-6 text-lg text-ink-600 leading-relaxed">
              Drawings, revisions, and milestone sign-off move directly into payout — on Solana devnet, with a permanent audit trail. Workflow stays off-chain. Payment proof happens on-chain.
            </p>
            <div className="mt-10 flex gap-3">
              <Link href="/signup" className="btn-primary">Create an account</Link>
              <Link href="/" className="btn-ghost">Sign in</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-ink-200 bg-ink-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-sm uppercase tracking-wider text-ink-500 font-semibold">The real bottleneck</h2>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            <Stat big="$299B" small="slow-payment cost to US construction, 2025" />
            <Stat big="14%" small="hidden tax on project costs" />
            <Stat big="82%" small="of contractors wait 30+ days past due" />
            <Stat big="5%" small="of subcontractors get paid on time" />
          </div>
          <p className="mt-8 text-ink-600 max-w-2xl leading-relaxed">
            It isn&rsquo;t banking. It&rsquo;s workflow. Approvals sit in email and WhatsApp; the payment waits on paperwork that never lands. WEZA Build gives the approval a queue, a state machine, a certifier&rsquo;s signature, and a one-click payout the moment the milestone is approved.
          </p>
        </div>
      </section>

      <section className="border-b border-ink-200">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-sm uppercase tracking-wider text-ink-500 font-semibold">The loop</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <LoopCard title="Contractor submits" body="Drawing or evidence package lands with a note, file, sha256 — and an audit row." tone="blue" />
            <LoopCard title="Certifier decides" body="Request revision, reject, or approve. Decisions are attached to the exact version they reviewed." tone="violet" />
            <LoopCard title="Owner pays out" body="One click moves devnet USDC with a memo tying the tx to project, milestone, submission, and approver." tone="green" />
          </div>
        </div>
      </section>

      <section className="border-b border-ink-200 bg-ink-50">
        <div className="mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-sm uppercase tracking-wider text-ink-500 font-semibold">Open the chain</h2>
            <p className="mt-4 text-ink-700 leading-relaxed">
              This deploy runs a real Solana devnet treasury. The balance and address below are pulled live from our RPC — click through to Solana Explorer and verify the mint address, the ATA, and every payout signature we&rsquo;ve ever broadcast.
            </p>
            <p className="mt-4 text-ink-700 leading-relaxed">
              Every payout is a <code className="mono text-xs bg-ink-100 px-1 py-0.5 rounded">TransferChecked</code> paired with a Memo Program instruction. The memo carries project code, milestone number, submission id, and approver id, so any auditor can reconstruct which real-world approval caused the transfer.
            </p>
          </div>
          <TreasuryStatus />
        </div>
      </section>

      <section className="border-b border-ink-200">
        <div className="mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-sm uppercase tracking-wider text-ink-500 font-semibold">Why Solana</h2>
            <p className="mt-4 text-ink-700 leading-relaxed">
              Every payout is a USDC <code className="mono text-xs bg-ink-100 px-1 py-0.5 rounded">TransferChecked</code> with a Memo Program instruction carrying the off-chain context (project, milestone, submission, approver). Sub-cent fees, sub-second confirmation, readable on any Solana explorer.
            </p>
            <p className="mt-4 text-ink-700 leading-relaxed">
              Drawings and revisions stay off-chain in Supabase Storage — they don&rsquo;t belong on a public ledger.
            </p>
          </div>
          <div>
            <h2 className="text-sm uppercase tracking-wider text-ink-500 font-semibold">What it is not</h2>
            <ul className="mt-4 space-y-2 text-ink-700">
              <li>— Not a bank rail. Not escrow. Not custody.</li>
              <li>— Not AI, not web4, not a marketplace.</li>
              <li>— Not mainnet today. Devnet USDC, by design.</li>
              <li>— Not an everything-app. One loop, done well.</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-ink-500 flex items-center justify-between">
        <span>WEZA Build · Solana devnet · Colosseum submission</span>
        <Link href="/signup" className="text-brand-700 hover:underline font-medium">Get started →</Link>
      </footer>
    </div>
  );
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div>
      <div className="text-4xl font-semibold mono tracking-tight">{big}</div>
      <div className="mt-1 text-xs text-ink-500 leading-snug">{small}</div>
    </div>
  );
}

function LoopCard({ title, body, tone }: { title: string; body: string; tone: "blue" | "violet" | "green" }) {
  const color = {
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    violet: "bg-violet-50 border-violet-200 text-violet-900",
    green: "bg-emerald-50 border-emerald-200 text-emerald-900",
  }[tone];
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 text-sm leading-relaxed opacity-90">{body}</div>
    </div>
  );
}
