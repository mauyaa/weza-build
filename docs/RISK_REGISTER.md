# Risk register

A short, honest list. Every risk has a mitigation that is already implemented or is explicitly marked as post-hackathon. Judges reward founders who see their own risks; they penalise ones who don't.

## Operational

| Risk | Mitigation today | Post-hackathon |
|---|---|---|
| Treasury runs out of SOL (fees) | `/api/health/solana` surfaces balance; deployment doc requires 2 SOL minimum | Automated top-up alert |
| Treasury runs out of devnet USDC | Same health check exposes USDC UI balance; doc points at Circle faucet | Owner-funded pull escrow (Anchor program) |
| Solana RPC rate-limited | Dedicated Helius / QuickNode endpoint, not public devnet | Fall-through to second RPC provider |
| Supabase project deleted or migrated | Migrations idempotent; `schema_migrations` table records applied files | Nightly `pg_dump` to S3 / Storage |
| Vercel cold start | App is server-components heavy; all hot paths cache nothing sensitive | Move `/api/milestones/[id]/audit` to Edge runtime if polling overhead shows |

## Correctness

| Risk | Mitigation today |
|---|---|
| Double-broadcast a payout | `triggerPayout` short-circuits when `payout.status in ('triggered','confirmed')`. `tests/flow.test.ts` covers it. |
| Approving the wrong submission | State machine only accepts approve from `under_review`; certifier-role + assignment-on-project both enforced server-side. |
| Failed payout leaves milestone stuck | Failure path sets `payout.status=failed`, reverts milestone to `approved`. `tests/flow.test.ts` covers retry. |
| Concurrent approve + payout | Every transitioning UPDATE is wrapped in `SELECT … FOR UPDATE` inside a single transaction. |
| Out-of-order audit rows | All audits written inside the same transaction as their state change. |

## Security

| Risk | Mitigation today |
|---|---|
| Wrong user reads another org's data | RLS policies on every user-facing table (`supabase/migrations/0002_rls.sql`) |
| Wrong user writes to another project | No client writes allowed; every write route validates role + project membership before calling the repo |
| Service role key leaked | Server-only import (`src/lib/supabase-service.ts` has `"use client"` nowhere); Vercel encrypts the env var |
| File URL shared past permission | Signed URLs expire in 5 minutes |
| Treasury keypair leaked | Env-only secret; rotation documented in `docs/DEPLOYMENT.md` |
| Memo payload manipulated | Memo is inside a tx signed by the treasury; the repo constructs it server-side from the milestone row, not from user input |

## Product / trust

| Risk | Mitigation today |
|---|---|
| Certifier collusion (approves early for a kickback) | Audit log records `approved_by`; memo on-chain carries the certifier id; tamper-evident | 
| Owner refuses to trigger an approved payout | Product limitation today; post-hackathon escrow pulls funds at approval time |
| Contractor disputes rejection | Audit log + version history; no on-chain arbitration yet |
| Wallet UX is hostile to contractors | We generate a devnet wallet at signup; production adds a guided onboarding + custodial option |

## Scope discipline

| Temptation | Answer |
|---|---|
| Add AI drawing review | No. Out of scope. Adds risk without judge-visible upside. |
| Add Anchor program for escrow | Post-hackathon. The submission wins on a narrow, working loop, not on more code. |
| Add mobile app | No. Responsive web is sufficient for the demo and the 90-day plan. |
| Add multi-chain | No. Solana-only. Multi-chain dilutes the pitch. |
| Add on-chain storage of drawings | No. Belongs off-chain. Already reflected in the docs. |
