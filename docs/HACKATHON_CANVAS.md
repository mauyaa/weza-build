# Hackathon Canvas — WEZA Build

Colosseum Frontier 2026 submission canvas.

Colosseum's canvas format, filled in for judges. Keep answers tight.

## 1. Problem

Construction payment is slow because **approval evidence** is weak. Drawings and evidence sit in email and WhatsApp; certifiers have no queue; owners have no dashboard; contractors have no portable proof when payment stalls.

- Nairobi contractors often face 30-90 day payment delays after work is certified.
- Kenya public pending bills reached hundreds of billions of shillings; contractor development-project debt is a visible share of that pressure.
- Sub-Saharan African firms consistently cite access to finance as a major operating constraint.
- Global construction payment surveys show the same root cause: disorganized approval and payment processes, not just banking rails.

## 2. Solution

An approval-to-payout platform. One screen per moment, one state machine, one audit trail, one Solana approval proof, one devnet USDC payout per approved milestone.

```
submit drawing/evidence
  → certifier review
  → request revision or approve
  → resubmit
  → Solana approval proof recorded
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

- Beachhead: Nairobi and East African construction teams dealing with delayed certification, pending bills, FX-linked materials, and weak dispute evidence.
- Expansion: African and Gulf construction firms already comfortable with dollar-linked procurement and cross-border payment complexity.
- Solana wedge: a public approval and payout trail that can be shown to owners, banks, donors, arbitrators, and off-ramp partners without trusting WEZA.

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

- Public approval evidence: certifier sign-off is a Solana Memo transaction before payout can unlock.
- Public payout evidence: USDC `TransferChecked` + structured memo ties the transfer to the approved milestone.
- Sub-cent fees and fast confirmation make the audit trail practical for thin-margin contractors.
- RWA momentum: Circle devnet USDC is a real thing, not a toy token.

Drawings and workflow stay off-chain where they belong; approval and payout proofs are the public trust layer.

## 8. Current state (submission day)

- Next.js 14 App Router deployed on Vercel.
- Supabase Postgres with SQL migrations, RLS on every user-facing table.
- Supabase Auth (email + password) with `handle_new_user` trigger.
- Supabase Storage private bucket with short-lived signed URLs.
- Solana approval proof transaction before payout unlocks.
- Real **devnet USDC** payouts via `@solana/spl-token` `TransferChecked` + **Memo Program** carrying project code / milestone / submission id / approver id.
- Funded treasury keypair (Circle faucet) on Helius devnet RPC.
- Role-aware dashboards, live cross-role audit, workflow timeline, handoff pill, Settled banner linking to Solana Explorer.
- 15-test suite; `/api/health/solana` public health check.
- Full deployment + smoke test docs.

## 9. Team

- Founder-led build: full-stack product, Supabase backend, Solana transaction flow, and deployment are implemented in this repo.
- Add the founder bio, prior domain edge, and any real advisors in the submission form. Do not leave placeholders in the final canvas.

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
