# Release readiness

## In scope (shipped)

- One product loop: submit → review → revise → approve → payout → audit.
- Role-aware surfaces for owner, certifier, contractor.
- Real **Supabase Auth** (email + password) with a `handle_new_user` trigger provisioning profile + org.
- **Row-Level Security** on every user-facing table. All privileged writes happen server-side with the service-role key.
- **Real file upload** to Supabase Storage (private `submissions` bucket), with short-lived signed URLs for downloads.
- Submission versioning, per-version decisions and comments.
- Milestone + payout state machines enforced in DB `CHECK`, repo, and API.
- **Solana-gated approval**: certifier approval stores an approval PDA + approval signature before payout can become ready.
- **Real Solana devnet payout** via `@solana/web3.js` + pre-funded treasury keypair. Signature stored and surfaced in audit trail + Explorer link.
- Idempotent approve and payout endpoints.
- `GET /api/health/solana` returning treasury balance + cluster.
- Live cross-role audit polling (`?since=`) with a soft flash on new rows and automatic page refresh on status transitions.
- Searchable projects table with progress bar and role-aware next-action.
- Vitest (on in-process pglite Postgres) covering critical state transitions, duplicate handling, and the full loop.

## Explicit non-goals

- No bank rails, real USDC custody, or escrow. Amounts are tracked off-chain; devnet USDC proves the approval-to-payout path for hackathon review.
- No real KYC / AML.
- No AI, no web4 claims, no mobile app, no marketplace.
- No on-chain storage of drawings, comments, or revisions.
- Minimal Anchor program only: `programs/weza_approval` records the approval PDA. Workflow details stay in Supabase.

## Production guardrails

- `WEZA_MOCK_SOLANA` is refused when `NODE_ENV=production` (see `src/lib/env.ts`). If the env var is set, `/api/health/solana` still reports live.
- Treasury keypair must be explicitly configured via `SOLANA_TREASURY_KEYPAIR`. There is no ephemeral fallback — the app refuses to start a payout if the treasury is not configured.
- Payout refuses to execute unless `milestones.approval_tx_signature` and `milestones.approval_pda` exist.
- Devnet USDC is a config layer: moving to mainnet USDC changes cluster/RPC/mint/treasury and adds Circle or local off-ramp compliance; it does not require rewriting the workflow.
- Airdrop fallback removed. In production the deployer funds the treasury once; the app never calls `requestAirdrop`.
- Signed download URLs expire after 5 minutes.

## Known limits

- Contractor / certifier signup joins the oldest existing org. A proper owner-issued invite flow is on the roadmap.
- No email verification, password reset, MFA, or SSO. Supabase Auth supports all of these — wiring is outside hackathon scope.
- Vercel serverless functions cold-start on first hit to a route; the audit polling endpoint warms up the runtime within ~2 seconds.

## Verification

```bash
npm install
npm run db:migrate      # against a throwaway Supabase project or local Postgres
npm run seed            # realistic construction projects + demo accounts
npm test                # 13/13 pass against pglite
npm run build           # clean
npm start               # point env to the Supabase project
```

Post-deploy: follow `docs/SMOKE_TEST.md`.
