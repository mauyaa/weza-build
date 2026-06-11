# WEZA Build

**Approval-to-payout infrastructure for construction projects, with verifiable Solana payout proof.**

WEZA links a construction milestone approval to a real Solana devnet transaction signature and a permanent audit record. Drawings, review notes, and revisions stay private off-chain. The payout proof is public and independently verifiable.

- **Live MVP:** [https://weza-build.vercel.app](https://weza-build.vercel.app)
- **GitHub:** [https://github.com/mauyaa/weza-build](https://github.com/mauyaa/weza-build)
- **Demo walkthrough:** [`docs/DEMO_WALKTHROUGH.md`](docs/DEMO_WALKTHROUGH.md)

## Try the live demo

Use the accounts in this order. Password for all three: `weza1234`.

| Step | Role | Account | Action |
| --- | --- | --- | --- |
| 1 | Contractor | `contractor@weza.build` | Submit a milestone/drawing package |
| 2 | Certifier | `certifier@weza.build` | Approve the submitted package |
| 3 | Owner | `owner@weza.build` | Trigger the Solana devnet payout |
| 4 | Any role | same accounts | Open the full transaction signature and milestone/payment audit trail |

The reviewer should see:

```text
Contractor submission
  -> Certifier approval
  -> Owner payout authorization
  -> Solana devnet transaction confirmation
  -> Full signature recorded in the audit trail
```

Devnet payout amounts are intentionally demo-sized so the complete flow can be repeated from a faucet-funded treasury. They are proof transactions, not mainnet settlement.

## What WEZA is

WEZA is an approval-to-payout platform for construction teams:

- Contractors submit evidence packages and resubmit revisions.
- Certifiers approve, reject, or request revision on an exact version.
- Owners can trigger payout only after certifier approval.
- Confirmed Solana signatures become part of the milestone/payment audit record.

The backend enforces these rules. A payout cannot be triggered before approval or broadcast twice. A failed or unconfirmed payout remains failed and never appears as successful proof.

## Why Solana

Construction payment disputes often start with a missing link between approval and payment. WEZA creates that link:

1. The certifier approves a specific submission version in WEZA.
2. The owner triggers the approved payout.
3. WEZA broadcasts a devnet USDC `TransferChecked` transaction with a Memo instruction.
4. The memo links the transaction to the project, milestone, submission, and approver.
5. WEZA stores the confirmed transaction signature in the audit trail.

The workflow stays off-chain because drawings and review discussions should remain private. The payout moment goes on-chain because payment proof should be durable and independently verifiable.

## Current status

**Live MVP deployed.** The repository includes:

- Three role-aware demo accounts
- Submission versioning and revision loops
- Approval-gated payouts
- Real Solana devnet payout proof
- Full transaction signature and Explorer link
- Milestone/payment audit trail
- Duplicate payout protection and failure recovery
- Automated state-machine, authorization, database, and payout tests

## Tech stack

- Next.js 14 App Router, React, TypeScript, Tailwind CSS
- Supabase Auth, Postgres, Storage, and Row-Level Security
- Solana devnet via `@solana/web3.js` and `@solana/spl-token`
- Devnet USDC `TransferChecked` plus Memo Program instruction
- Vitest and pglite for isolated Postgres tests
- Vercel deployment

## Local setup

Requirements: Node.js 20+, a Supabase project, and a funded Solana devnet treasury.

```bash
npm install
cp .env.example .env.local
# Fill in Supabase, DATABASE_URL, and Solana treasury values.

npm run db:migrate
npm run seed
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For local UI work without broadcasting transactions, set `WEZA_MOCK_SOLANA=1`. Mock mode is refused in production.

## Verification

```bash
npm test
npm run build
```

The critical tests cover:

- Contractor submit/resubmit rules
- Certifier approve/reject/request-revision permissions
- Owner-only payout after approval
- Duplicate approve and duplicate payout idempotency
- Failed and unconfirmed payout handling
- Transaction signature persistence
- Audit creation for every major action

For deployed verification, follow [`docs/SMOKE_TEST.md`](docs/SMOKE_TEST.md).

## Repository structure

```text
src/app/          Next.js pages and server route handlers
src/components/   Role workflow, payout proof, and audit UI
src/lib/          Domain rules, state machine, database, Solana integration
supabase/         SQL migrations and RLS policies
scripts/          Migration, seeding, and treasury setup
tests/            State-machine, authorization, database, and full-flow tests
docs/             Demo, deployment, release, pitch, and risk documentation
public/brand/     WEZA brand assets
```

## What grant support will fund

Grant support will fund an AI coding subscription used to harden and ship the real product codebase: stronger automated verification, production monitoring, security review, payout reliability, deployment tooling, and faster iteration with construction design partners.

The proposed next phase is documented in [`docs/SUPERTEAM_AGENTIC_ENGINEERING_GRANT.md`](docs/SUPERTEAM_AGENTIC_ENGINEERING_GRANT.md): AI-assisted milestone verification with human certifier accountability, followed by an audited Anchor escrow program.

## Ownership and license

WEZA Build is a solo-founder project designed, built, and shipped by **Bevan Mauya Bosire**.

Copyright (c) 2026 Bevan Mauya Bosire. All rights reserved. This repository is proprietary and shared for grant, hackathon, and accelerator review. See [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE).
