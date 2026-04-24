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

> "WEZA Build is an approval-to-payout platform for construction teams. Contractors submit drawings and evidence. Certifiers review, request revisions, and approve. Approval is recorded as a Solana transaction before payout unlocks. Owners click once, and the payment moves on Solana devnet with a permanent, auditable signature tied to that specific milestone."

*(Cut to 20 seconds of screen recording — the full loop, speeded up 1.5x, captioned.)*

### 1:10 — 1:40 — why Solana

> "We don't need a global ledger for every drawing — drawings stay in Supabase Storage. We need **one unforgeable receipt for approval and one for payout**. Solana gives us that for a tenth of a cent. Approval is a structured Memo transaction; payout is a USDC transfer with memo context. A judge, insurer, or lender can open Solana Explorer and reconstruct which real-world approval unlocked the transfer."

### 1:40 — 2:10 — why us, why now

> "I [team background — real answer]. The next step is three Nairobi operator interviews and one live milestone pilot; the repo includes the exact script and evidence log so we do not fake traction. Construction is one of the largest industries still using email and signed PDFs for payment control. That's the trust layer Solana can make portable."

### 2:10 — 2:35 — traction + ask

> "Today: deployed on Supabase and Solana devnet, full approval-to-payout loop, approval proof before payout, devnet USDC moving, audit trail linking every tx signature to a specific milestone. Next: Nairobi interviews, one live milestone pilot, then a mainnet USDC/off-ramp partner. We're applying to the Colosseum accelerator to turn the working loop into a production wedge."

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

"Certifier requests revision. Contractor resubmits v2. Certifier approves. First, WEZA records a Solana approval Memo transaction with the milestone metadata. Only after that proof exists do the database rows move to submission approved, milestone approved, payout ready. The handoff pill now points at the owner."

### 1:10 — 1:50

"Owner clicks Trigger payout · 120,000 USDC. Server-side, we first verify the approval signature exists. Then we lock the payout row in a `SELECT FOR UPDATE`, build a Solana transaction with two instructions — a Memo Program instruction carrying the JSON metadata, and a `TransferChecked` from the treasury's USDC ATA to the contractor's USDC ATA — and send it to devnet via Helius. We wait for confirmed commitment."

### 1:50 — 2:15

"Page rebuilds. Big green 'Settled on Solana devnet — 120,000 USDC' banner at the top. View on Explorer."

*(Click through. Show the Explorer view with the Memo instruction expanded: `app:"weza-build"`, project code, milestone sequence, submission id, approver id. Show the TransferChecked for the USDC mint.)*

### 2:15 — 2:30

"Double-click retriggers — same signature, no second broadcast, because the payout state machine is idempotent. The full approval-to-payout loop: off-chain workflow, on-chain proof, minute and a half, no plug-ins, no seed phrases, no banking."

---

## Talking points for Q&A

- **"Why not only Anchor?"** — The shipped proof path is a real Solana Memo transaction judges can inspect today. The repo includes a minimal Anchor approval program as the next custom-program path, but the live demo prioritizes a reliable, indexable proof over a half-deployed program.
- **"What about mainnet USDC?"** — Trivial to flip: one env var (`SOLANA_RPC_URL`, `SOLANA_CLUSTER=mainnet`) and swap the USDC mint constant. Devnet is the correct hackathon target. We deliberately avoid making mainnet claims we haven't earned.
- **"Escrow?"** — Not in scope. The current design assumes the owner funds the treasury. A follow-on Anchor program can pull owner funds at approval time. We chose not to ship half-implemented escrow.
- **"Who signs the memo?"** — The treasury keypair signs the on-chain approval and payout transactions. The `certifier` / `approved_by` fields tie the transaction to the certifier's Supabase identity; the audit log proves the certifier action, and Solana proves WEZA cannot quietly rewrite the approval/payout timeline later.
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
- Kenya national government pending bills reached Sh524B by Dec 2024, with contractor development-project debt around Sh243.19B (Eastleigh Voice, 2025)

## What *not* to say

- "On-chain construction management." We're not that.
- "Mainnet-ready." Not yet.
- "Escrow / custody." Not built.
- "AI-powered." No AI in the product.
- "Real-time USDC settlement." Devnet USDC. Be specific.
- "Disrupting banks." Not our thesis.
