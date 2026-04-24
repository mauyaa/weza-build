# WEZA Build

**Approval-to-payout infrastructure for East African construction teams.**

WEZA Build turns construction milestone approval into a tracked workflow where the certifier's approval is recorded on Solana before payout can unlock. It is built for Nairobi and East African construction markets where subcontractors often operate across WhatsApp, PDFs, delayed bank rails, and weak dispute evidence.

**Live deployment:** [https://weza-build.vercel.app](https://weza-build.vercel.app)

## What it does

One loop, end to end:

```
submit drawing / evidence
  → certifier review
  → request revision (optional)
  → resubmit new version
  → certifier approval proof recorded on Solana
  → milestone approved
  → owner triggers payout
  → Solana devnet transaction runs
  → approval + payout signatures stored in audit trail
```

Three roles that see only what they need:

- **Owner** — approved milestones, payout queue, settled work.
- **Certifier** — submissions awaiting review, revision requests.
- **Contractor** — packages to submit, revisions to address.

## What it is not

- Not a bank settlement rail (USDC amounts are the authoritative off-chain record).
- Not real KYC / escrow / custody.
- Not an AI product.
- Not a marketplace, mobile app, or generic wallet.

## Why Nairobi / East Africa

Construction is a trust problem before it is a payment problem. Kenya's construction sector contributes roughly 6-7% of GDP, while the wider region relies on contractor networks that still settle around paper certificates, bank delays, and informal dispute records. Global construction payment surveys consistently show most contractors wait 30+ days past due; in emerging markets that delay is amplified by fragmented banking, FX, and owner-contractor information asymmetry.

WEZA is designed for a contractor in Nairobi who needs a portable proof packet: the file hash, certifier sign-off, approval transaction, payout transaction, and project audit trail in one place.

## Why Solana

Construction payouts need durable public proof that does not depend on trusting the platform operator. WEZA Build records the milestone approval as a Solana transaction with structured milestone metadata, then only unlocks payout after that approval signature exists. The payout transaction carries the project, milestone, submission, and approver context in a memo.

Drawings, comments, and revision history stay off-chain in Supabase Storage and Postgres because they may contain private commercial data. Solana stores the tamper-proof approval and settlement evidence a contractor can show to an arbitrator, bank, donor, or owner.

## Stack

- **Next.js 14 App Router** (TypeScript, Tailwind)
- **Supabase Postgres** with SQL migrations
- **Supabase Auth** (email + password) with a `handle_new_user` trigger provisioning profiles + orgs
- **Supabase Storage** (private `submissions` bucket, short-lived signed URLs)
- **Row-Level Security** on every user-facing table; all writes flow through server route handlers using the service-role key
- **Solana devnet** via `@solana/web3.js` with a pre-funded treasury keypair
- **Minimal Anchor approval program source** in `programs/weza_approval` for the next custom-program approval path
- **Vitest** + `pglite` for in-process Postgres testing

## Local development

```bash
cp .env.example .env.local
# fill in Supabase URL, anon key, service role key, DATABASE_URL, SOLANA_TREASURY_KEYPAIR

npm install
npm run db:migrate    # applies supabase/migrations/*.sql
npm run seed          # populates realistic demo data via service-role auth admin
npm run dev
```

Then open <http://localhost:3000> and sign in with `owner@weza.build` / `weza1234`.

For offline development without a devnet treasury, set `WEZA_MOCK_SOLANA=1`. **This flag is ignored in production** — the env loader refuses to honour it when `NODE_ENV=production`.

Devnet USDC is a hackathon configuration. Mainnet USDC through Circle or a local off-ramp partner changes the mint, RPC/cluster, treasury, and compliance wrapper; it does not require a product re-architecture.

## Tests

```bash
npm test
```

Runs against an in-process Postgres (pglite, WASM) so no Docker is required. Covers:

- submission / milestone / payout state machine transitions
- full submit → revise → resubmit → approve → payout loop
- on-chain approval proof is required before payout can unlock
- duplicate approve + duplicate payout idempotency (no re-broadcast)
- role enforcement (contractor cannot trigger a payout)
- payout failure + retry (milestone recoverable)
- signup metadata contract with `handle_new_user`

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full Vercel + Supabase + devnet treasury checklist, and [`docs/SMOKE_TEST.md`](docs/SMOKE_TEST.md) for the post-deploy verification sequence.

## Documents

- [`docs/PITCH.md`](docs/PITCH.md) — 3-min pitch + 2-to-3-min technical demo scripts.
- [`docs/HACKATHON_CANVAS.md`](docs/HACKATHON_CANVAS.md) — Colosseum canvas.
- [`docs/TRACTION.md`](docs/TRACTION.md) — market evidence + design-partner template.
- [`docs/RISK_REGISTER.md`](docs/RISK_REGISTER.md) — honest risk list + mitigations.
- [`docs/FRONTEND_BACKEND_CONTRACT.md`](docs/FRONTEND_BACKEND_CONTRACT.md) — API envelope, endpoints, effects.
- [`docs/DEMO_WALKTHROUGH.md`](docs/DEMO_WALKTHROUGH.md) — 2-minute demo script.
- [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md) — scope, non-goals, known limits.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deploy checklist.
- [`docs/SMOKE_TEST.md`](docs/SMOKE_TEST.md) — post-deploy smoke checks.

Public `/about` page is the judge-facing marketing surface; it sits outside the authenticated app.
