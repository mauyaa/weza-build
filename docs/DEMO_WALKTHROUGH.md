# 2-minute demo walkthrough

The demo shows the full Nairobi contractor loop: submit evidence, request a revision, resubmit, record certifier approval on Solana, unlock payout, and end on the payout Explorer link.

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
| 1:15 | Certifier | **Record approval on Solana** | Approval Memo transaction lands first; milestone becomes *Approved*, payout becomes *Ready*, and the approval proof appears on the page. |
| 1:30 | Owner | Open the milestone from *Pay out* action card | Payout panel shows **Trigger payout · 120,000 USDC**. |
| 1:40 | Owner | Click it | Payout flips *Triggered → Confirmed*. Large green banner lands at the top of the page: **Settled on Solana devnet · 120,000 USDC** with **View on Explorer**. |
| 1:55 | Owner | Click **View on Explorer** | Solana Explorer devnet opens with the real transaction signature. |

## Strongest proof points on camera

- **Ball is with · {person} · {verb}** — the workflow-not-payment signal.
- Cross-role live updates — no manual refresh between windows; the audit rail flashes green on new events.
- Version history with decisions attached + downloadable files via short-lived Supabase Storage signed URLs.
- Purple **Certifier approval recorded on Solana devnet** banner before payout is available.
- Big green **Settled on Solana devnet** banner when payout lands, with a **View on Explorer** button.
- Payout locked until the on-chain approval proof exists — cannot be bypassed in UI or API.
- Idempotent payout — double-click does not re-broadcast (verifiable from devtools).

## One-sentence Solana explanation

> WEZA records the certifier approval on Solana first, then uses that public approval proof to unlock payout, so the contractor leaves with an audit trail they can show without trusting us.

## Things to avoid saying

- "We settle real USDC on mainnet." — we don't.
- "Escrow / custody / bank rail." — not built.
- "AI-powered." — no AI anywhere.
- "Everything is on-chain." — private drawings stay off-chain; approval and payout proof are on-chain.
