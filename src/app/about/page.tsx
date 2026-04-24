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
              On-chain milestone approval<br />for African construction.
            </h1>
            <p className="mt-6 text-lg text-ink-600 leading-relaxed">
              Nairobi contractors often wait 30–90 days after work is certified, while paper approvals vanish into email, WhatsApp, and bank queues. WEZA Build turns each certified construction milestone into a public Solana approval record before payout can unlock.
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
          <h2 className="text-sm uppercase tracking-wider text-ink-500 font-semibold">East African payment trust gap</h2>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            <Stat big="30–90d" small="common contractor payment delay after approval" />
            <Stat big="40%" small="of Sub-Saharan African firms identify finance as a major constraint (World Bank)" />
            <Stat big="KES" small="local contracts, dollar-linked materials, thin cash buffers" />
            <Stat big="24/7" small="public audit evidence outside any one operator" />
          </div>
          <p className="mt-8 text-ink-600 max-w-2xl leading-relaxed">
            The problem is counterparty trust before it is payment rails. WEZA gives owners, certifiers, contractors, lenders, donors, and arbitrators a shared record: the exact package submitted, the certifier&rsquo;s approval transaction, and the USDC payout proof.
          </p>
        </div>
      </section>

      <section className="border-b border-ink-200">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-sm uppercase tracking-wider text-ink-500 font-semibold">The loop</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <LoopCard title="Contractor submits" body="Drawing or evidence package lands with version, file hash, and private storage pointer." tone="blue" />
            <LoopCard title="Certifier signs on-chain" body="Approval records a milestone PDA; payout cannot become ready without that Solana proof." tone="violet" />
            <LoopCard title="Owner pays out" body="One click moves devnet USDC and links the transfer to the approval record." tone="green" />
          </div>
        </div>
      </section>

      <section className="border-b border-ink-200 bg-ink-50">
        <div className="mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-sm uppercase tracking-wider text-ink-500 font-semibold">Open the chain</h2>
            <p className="mt-4 text-ink-700 leading-relaxed">
              This deploy makes Solana load-bearing: certifier approval is recorded first, then payout unlocks. The treasury balance and address below are pulled live from RPC — click through to Solana Explorer and verify the mint, ATA, approval, and payout signatures.
            </p>
            <p className="mt-4 text-ink-700 leading-relaxed">
              The hackathon build ships a minimal Anchor milestone-approval program design and a devnet proof path. Payout remains a <code className="mono text-xs bg-ink-100 px-1 py-0.5 rounded">TransferChecked</code> with structured memo context, so any auditor can reconstruct which real-world approval caused the transfer.
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
              In low-trust construction markets, the differentiator is not just cheap payment. It is a permanent, public audit trail a Nairobi contractor can show a dispute board, bank, donor, or main contractor without trusting WEZA as the operator.
            </p>
            <p className="mt-4 text-ink-700 leading-relaxed">
              Drawings and revisions stay off-chain in Supabase Storage; hashes, approvals, and payout signatures are the public proof layer. Moving from devnet USDC to mainnet USDC is a treasury/RPC/mint configuration swap, not a workflow rewrite.
            </p>
          </div>
          <div>
            <h2 className="text-sm uppercase tracking-wider text-ink-500 font-semibold">What it is not</h2>
            <ul className="mt-4 space-y-2 text-ink-700">
              <li>— Not a bank rail. Not escrow. Not custody.</li>
              <li>— Not AI, not web4, not a marketplace.</li>
              <li>— Not mainnet today. Devnet USDC now; mainnet USDC is a config swap with the right treasury and off-ramp partner.</li>
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
