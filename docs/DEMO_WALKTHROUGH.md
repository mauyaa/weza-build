# 2-minute demo walkthrough

**The UX is unchanged from the pre-migration branch.** The UI, the state machine, the role-aware surfaces, the handoff pill, and the Settled banner all behave identically. What's different is the plumbing: Supabase Postgres, Supabase Auth, Supabase Storage, and a real devnet transaction signature every single time.

Seed produces **Nyali Mixed-Use Tower** (NMT-24) with four milestones in four different states so every surface is populated on the first click.

## Pre-flight (off-camera)

With `.env.local` pointed at your Supabase project + funded devnet treasury:

```bash
npm run db:migrate
npm run seed
npm run build && npm start
```

Open three browser profiles (or private windows): owner, certifier, contractor. Demo password is `weza1234`. A role-selector signup lives at `/signup` for live provisioning demos.

Before going on camera, hit `/api/health/solana` — confirm `mode: "live"`, `lamports` healthy.

## Demo path (0:00 — 2:00)

| Time | Who | Action | On-screen proof |
|------|-----|--------|------------------|
| 0:00 | Contractor | Log in | `Build queue` dashboard — three action cards across three states. |
| 0:10 | Contractor | Open *Superstructure — L1 slab* | Milestone page. Header shows **Ball is with · Kofi Mensah · submit package**. Timeline empty. |
| 0:20 | Contractor | Drop a real PDF, click **Submit package** | Timeline jumps to *Under review*; submission chip flips; file lands in the Supabase Storage `submissions` bucket; audit rail row appears. |
| 0:35 | Certifier | Switch window — milestone is **already updated live** (no refresh) | `Review desk` dashboard counts have moved. Handoff on the milestone is now **Ball is with · Zanele Mbeki · review submission**. |
| 0:45 | Certifier | **Request revision** with a note | Submission chip → *Revision requested*. Handoff → **Ball is with · Kofi · resubmit**. Contractor's audit rail flashes green in real time. |
| 1:00 | Contractor | Resubmit v2 | v1 shows the revision decision attached; v2 goes under review. |
| 1:15 | Certifier | **Approve milestone** | Milestone *Approved*, payout *Ready*. Three audit rows land. Handoff flips to **Ball is with · Amani Otieno · trigger payout**. |
| 1:30 | Owner | Open the milestone from *Pay out* action card | Payout panel shows **Trigger payout · 120,000 USDC**. |
| 1:40 | Owner | Click it | Payout flips *Triggered → Confirmed*. Large green banner lands at the top of the page: **Settled on Solana devnet · 120,000 USDC** with **View on Explorer**. |
| 1:55 | Owner | Click **View on Explorer** | Solana Explorer devnet opens with the real transaction signature. |

## Strongest proof points on camera

- **Ball is with · {person} · {verb}** — the workflow-not-payment signal.
- Cross-role live updates — no manual refresh between windows; the audit rail flashes green on new events.
- Version history with decisions attached + downloadable files via short-lived Supabase Storage signed URLs.
- Big green **Settled on Solana devnet** banner when the milestone lands on chain, with a **View on Explorer** button.
- Payout locked until approved — cannot be bypassed in UI or API.
- Idempotent payout — double-click does not re-broadcast (verifiable from devtools).

## One-sentence Solana explanation

> The workflow stays off-chain because drawings and revisions must; the payout moment runs on Solana devnet and we store the signature in the audit trail as permanent proof the owner paid the approved milestone.

## Things to avoid saying

- "We settle real USDC on mainnet." — we don't.
- "Escrow / custody / bank rail." — not built.
- "AI-powered." — no AI anywhere.
- "Everything is on-chain." — only the payout moment.
