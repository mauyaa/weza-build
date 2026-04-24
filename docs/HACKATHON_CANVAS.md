# Hackathon Canvas — WEZA Build

Colosseum's canvas format, filled in for judges. Keep answers tight.

## 1. Problem

Construction payment is slow because **approval** is slow. Drawings and evidence sit in email and WhatsApp; certifiers have no queue; owners have no dashboard. The resulting delay is quantifiable:

- $299 B annual cost to US construction in 2025 (BuildLedger / GlobeNewswire).
- 14% hidden project tax.
- 82% of contractors wait 30+ days past due.
- Only 5% of subcontractors get paid on time.
- 90-day average payment cycle vs 45-day healthy threshold.
- Root cause cited by both GCs and subs: *lack of organized process* — not banking.

## 2. Solution

An approval-to-payout platform. One screen per moment, one state machine, one audit trail, one devnet USDC payout per approved milestone.

```
submit drawing/evidence
  → certifier review
  → request revision or approve
  → resubmit
  → milestone approved
  → owner triggers payout
  → devnet USDC transfer + memo with milestone metadata
  → tx signature stored in audit trail
```

## 3. Users

| Role       | Core jobs                                                         |
|------------|-------------------------------------------------------------------|
| Owner      | Approve the work done, trigger payouts, monitor settled value.    |
| Certifier  | Review submissions, request revisions, sign off milestones.       |
| Contractor | Submit drawings and evidence, respond to revisions, get paid.     |

## 4. Market

- $1.8 T US construction industry.
- RWAs on Solana grew **141% in 2025**, > $24 B TVL by mid-2025.
- Beachhead market: African and Gulf construction firms already using USDC informally for cross-border material payments. Supabase / Vercel reach + Solana fee structure make this the first place the unit economics work.

## 5. Business model (post-hackathon)

- **Per-payout fee** (0.25–0.5%) on milestones that settle through WEZA Build.
- **Seat pricing** for certifiers / owners at firm scale ($99–$299 / seat / month) once volume justifies it.
- Not a line of credit. Not a custody business.

## 6. Competitors and why WEZA Build is different

| Competitor           | Why they lose to WEZA Build                               |
|----------------------|------------------------------------------------------------|
| Procore / Autodesk   | Approval workflow exists but payment is a separate silo.  |
| Stripe Payments      | Approval workflow is not their problem.                   |
| Generic stablecoin apps | Start from money movement; construction starts from approval. |
| Existing construction payment tools | Built on ACH/bank rails; 5-day settle, not real-time. |

We're not "another payments app." We're the workflow tool that happens to settle in USDC. On-chain only appears once, at the moment an approval earns it.

## 7. Why Solana

- Sub-cent per payout (USDC `TransferChecked` + Memo ≈ 5000 lamports).
- Sub-second confirmation via Helius / QuickNode devnet RPC.
- Solana Pay / Memo program already standard for structured receipts.
- RWA momentum: Circle devnet USDC is a real thing, not a toy token.

Anything else we'd use Solana for would be overbuilding. Drawings and workflow stay off-chain where they belong.

## 8. Current state (submission day)

- Next.js 14 App Router deployed on Vercel.
- Supabase Postgres with 3 SQL migrations, RLS on every user-facing table.
- Supabase Auth (email + password) with `handle_new_user` trigger.
- Supabase Storage private bucket with short-lived signed URLs.
- Real **devnet USDC** payouts via `@solana/spl-token` `TransferChecked` + **Memo Program** carrying project code / milestone / submission id / approver id.
- Funded treasury keypair (Circle faucet) on Helius devnet RPC.
- Role-aware dashboards, live cross-role audit, workflow timeline, handoff pill, Settled banner linking to Solana Explorer.
- 14/14 tests passing; `/api/health/solana` public health check.
- Full deployment + smoke test docs.

## 9. Team

- *Founder / engineer* — [real bio]. Prior work in [relevant]. Why this problem: [one honest sentence].
- Advisors: [list or omit honestly].

## 10. 90-day plan after Colosseum

- Close two live pilots (Nairobi + Accra) on devnet, then move those pilots to mainnet once payout volume justifies it.
- Add owner-funded escrow on an Anchor program.
- Add an invoicing surface + Solana Pay QR for partial-completion payments.
- Add a public read-only project view (for lenders / insurers / regulators).

## 11. Risks (see `docs/RISK_REGISTER.md` for detail)

- **Funding the treasury.** Owners fund it manually today. Next milestone: on-chain pull-based escrow.
- **Approval dispute.** No on-chain arbitration yet; audit log is the evidence layer.
- **Wallet UX for contractors.** We generate a demo wallet at signup; production adds a guided wallet-onboarding step.
- **Solana RPC availability.** Mitigated by dedicated provider (Helius / QuickNode), not the public endpoint.

## 12. The ask

$250K Colosseum accelerator pre-seed. We run the two committed pilots, harden the escrow path, and come out of the cohort with live mainnet settlement on real construction milestones.
