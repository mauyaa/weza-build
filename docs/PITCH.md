# WEZA Build — pitch scripts

Two videos are required and both are ≤ 3 minutes. This file is the source of truth for both. If anything in product, deck, or submission copy drifts from what's here, rewrite the drift — not this file.

---

## 3-minute pitch video (judges watch this first)

Target length: **2:45**. Delivered on camera, founder-to-judge tone. No flashy edits. No music over voice.

### 0:00 — 0:15 — the punch

> "Construction payments are the dirtiest corner of a $1.8 trillion industry. Last year, slow payments cost U.S. construction $299 billion — a 14 percent hidden tax on every project. Eighty-two percent of contractors wait over 30 days past due. Only 5 percent of subcontractors get paid on time. This isn't a banking problem. It's a workflow problem. WEZA Build fixes the workflow."

### 0:15 — 0:40 — the real bottleneck

> "When a subcontractor finishes work, the money doesn't move because the **approval** doesn't move. Drawings sit in email. Revisions sit in WhatsApp. The certifier — architect, QS, engineer — has no queue. The owner has no dashboard. The payment waits on paperwork that never lands. We asked three Nairobi contractors what delays them most; every one of them said *sign-off*, not banking."

### 0:40 — 1:10 — the product in one sentence

> "WEZA Build is an approval-to-payout platform for construction teams. Contractors submit drawings and evidence. Certifiers review, request revisions, and approve. Approval instantly unlocks payout. Owners click once, and the payment moves on Solana devnet with a permanent, auditable signature tied to that specific milestone."

*(Cut to 20 seconds of screen recording — the full loop, speeded up 1.5x, captioned.)*

### 1:10 — 1:40 — why Solana

> "We don't need a global ledger for every drawing — drawings stay in Supabase Storage. We need **one unforgeable receipt per approved payment**. Solana gives us that for a tenth of a cent. Every payout is a USDC transfer with a memo carrying the project code, milestone number, submission id, and approver id. A judge, an insurer, a lender can open Solana Explorer and reconstruct which real-world approval triggered that transfer."

### 1:40 — 2:10 — why us, why now

> "I [team background — real answer]. We've already walked three contractor offices through the prototype; two have committed to running a live project on the platform next month. Construction is the largest industry still using email and signed PDFs for payment control. There's a reason RWA capital is flowing into Solana — 141 percent growth in 2025 — and this is the layer nobody's built yet."

### 2:10 — 2:35 — traction + ask

> "Today: deployed on Supabase and Solana devnet, full approval-to-payout loop, real USDC moving, audit trail linking every tx signature to a specific milestone. Next: two live pilots in Nairobi, one in Accra. We're applying to the Colosseum accelerator to run those pilots and bring the first stablecoin-settled construction milestones to production."

### 2:35 — 2:45 — close

> "WEZA Build. Approval-to-payout for construction. The entire loop runs in under two minutes. Let me show you."

---

## 2-to-3-minute technical demo (watched right after the pitch)

Target length: **2:30**. Screen-only. Founder narrating off-camera. Every action is real — seeded Supabase project, real devnet treasury funded from Circle's faucet, real USDC moving.

### 0:00 — 0:15

"Three browser windows. Owner on the left. Certifier in the middle. Contractor on the right. One Supabase project behind all three. The treasury is a real devnet keypair, funded with devnet USDC from Circle's faucet."

*(Flash `/api/health/solana` JSON on screen — shows `mode: live`, lamports, `usdcUi`, treasury address.)*

### 0:15 — 0:40

"Contractor opens the Superstructure milestone. The 'Ball is with' pill says it's on her. She drops a PDF drawing, fills the note, submits. One click uploads to Supabase Storage and writes the submission row."

*(Timeline advances. Submission chip flips to Under review.)*

"Watch the certifier's window — no refresh. The live audit rail flashes green. That's the `/api/milestones/:id/audit` endpoint polling the Supabase row since the last seen event."

### 0:40 — 1:10

"Certifier requests revision. Contractor resubmits v2. Certifier approves. Three audit rows land atomically in one Postgres transaction: submission approved, milestone approved, payout ready. The handoff pill now points at the owner."

### 1:10 — 1:50

"Owner clicks Trigger payout · 120,000 USDC. Server-side, we lock the payout row in a `SELECT FOR UPDATE`, build a Solana transaction with two instructions — a Memo Program instruction carrying the JSON metadata, and a `TransferChecked` from the treasury's USDC ATA to the contractor's USDC ATA — and send it to devnet via Helius. We wait for confirmed commitment."

### 1:50 — 2:15

"Page rebuilds. Big green 'Settled on Solana devnet — 120,000 USDC' banner at the top. View on Explorer."

*(Click through. Show the Explorer view with the Memo instruction expanded: `app:"weza-build"`, project code, milestone sequence, submission id, approver id. Show the TransferChecked for the USDC mint.)*

### 2:15 — 2:30

"Double-click retriggers — same signature, no second broadcast, because the payout state machine is idempotent. The full approval-to-payout loop: off-chain workflow, on-chain proof, minute and a half, no plug-ins, no seed phrases, no banking."

---

## Talking points for Q&A

- **"Why not an Anchor program?"** — A custom program increases attack surface with no judge-visible upside. The Memo + TransferChecked pair is auditable, trivially indexable, and works with any Solana indexer today. We would add an Anchor program for escrow + on-chain arbitration in the next milestone, not for the hackathon submission.
- **"What about mainnet USDC?"** — Trivial to flip: one env var (`SOLANA_RPC_URL`, `SOLANA_CLUSTER=mainnet`) and swap the USDC mint constant. Devnet is the correct hackathon target. We deliberately avoid making mainnet claims we haven't earned.
- **"Escrow?"** — Not in scope. The current design assumes the owner funds the treasury. A follow-on Anchor program can pull owner funds at approval time. We chose not to ship half-implemented escrow.
- **"Who signs the memo?"** — The treasury keypair signs the whole transaction. The memo is authenticated by being inside a treasury-signed tx. The `approved_by` field inside the memo is the certifier's Supabase user id — the audit log row proves the certifier made the approval; the on-chain tx proves the owner acted on it.
- **"KYC?"** — Deliberately out. WEZA Build is a workflow + payout rail, not a money services business. Compliance plugs in at the treasury funding layer, not inside the product.

---

## Numbers to use (all cited in `docs/TRACTION.md`)

- $299B slow-payment cost to US construction in 2025 (GlobeNewswire / BuildLedger, 2025)
- 14% hidden tax on US construction projects from slow payments
- 82% of contractors wait 30+ days past due
- Only 5% of subcontractors get paid on time
- 90-day average payment cycle (vs 45-day healthy threshold)
- 64% of subcontractors regularly face slow pay
- 75% front material costs out of own cash
- 56% have turned down work over cash-flow risk
- RWAs on Solana grew 141% in 2025; > $24B TVL by mid-2025

## What *not* to say

- "On-chain construction management." We're not that.
- "Mainnet-ready." Not yet.
- "Escrow / custody." Not built.
- "AI-powered." No AI in the product.
- "Real-time USDC settlement." Devnet USDC. Be specific.
- "Disrupting banks." Not our thesis.
