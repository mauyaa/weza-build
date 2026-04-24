# Pitch deck — 10 slides

Build this in whatever tool you want (Pitch, Keynote, Figma Slides). Use the site's dark background, `#0E121C`, and emerald accent `#34D399` to match the product.

One slide = one idea. No slide has more than 12 words on screen. Speaker notes are what you say; the slide is what the judge sees.

---

## Slide 1 — Cover

**On-screen:** "WEZA Build · Approval-to-payout for construction."
Below: "Solana · Colosseum Breakout 2026"
Corner: your name + email.

**Speaker notes (5s):** "WEZA Build. Approval-to-payout for construction."

---

## Slide 2 — Four numbers

**On-screen (huge mono type, four stats, nothing else):**
```
$299B          14%
82%             5%
```

Under each, one line of 8pt type:
- $299B — slow-payment cost, US construction, 2025
- 14% — hidden tax on total project cost
- 82% — of contractors wait 30+ days past due
- 5% — of subcontractors paid on time

**Speaker notes (20s):** "Last year, slow payments cost US construction 299 billion dollars. A 14-percent hidden tax on every project. 82 percent of contractors wait over 30 days past due. Only 5 percent of subcontractors get paid on time."

---

## Slide 3 — Why it's slow (the real bottleneck)

**On-screen:** four boxes in a row:

`Drawing in email` → `Revision in WhatsApp` → `Certifier has no queue` → `Owner has no dashboard`

Below, one line: **"Approval is slow. So payment is slow."**

**Speaker notes (15s):** "This isn't a banking problem. It's a workflow problem. Drawings sit in email. Revisions sit in WhatsApp. The certifier has no queue. The owner has no dashboard. The payment waits on paperwork that never lands."

---

## Slide 4 — What WEZA Build is

**On-screen:** one sentence, centred:

> "An approval-to-payout platform for construction teams. Workflow off-chain. Payout proof on Solana."

**Speaker notes (10s):** "WEZA Build is an approval-to-payout platform for construction teams. Contractors submit. Certifiers review and approve. Owners trigger payout. Workflow stays off-chain. Payout proof happens on Solana."

---

## Slide 5 — The loop (diagram)

**On-screen:** horizontal flow of five chips:

`Submit` → `Review` → `Approve` → `Payout ready` → `Settled on Solana devnet`

Emerald chip for the last one. Replace with a clean SVG from the product's workflow timeline if you have time.

**Speaker notes (10s):** "Five states. Every one visible in the product. Every transition written to an audit trail."

---

## Slide 6 — Live screenshot

**On-screen:** single screenshot of the milestone page mid-payout — the one with the **Settled on Solana devnet** banner and a visible signature. One caption below: "Real devnet USDC. Signature links to Solana Explorer."

**Speaker notes (10s):** "This is the product. The green banner is a real devnet transaction we just ran. Click that link and you see the memo that ties the USDC movement to the exact milestone the certifier approved."

---

## Slide 7 — Why Solana (specific)

**On-screen:** two columns.

- **On-chain (narrow):** USDC TransferChecked + Memo. Sub-cent cost. Sub-second confirm.
- **Off-chain (everything else):** Drawings, revisions, comments, decisions, full audit log.

**Speaker notes (15s):** "We don't put drawings on a public ledger. They don't belong there. On-chain is one transfer per approved milestone, with a memo tagging project, milestone, submission, and approver. That's the primitive construction lenders, insurers, and regulators actually want."

---

## Slide 8 — Market + traction

**On-screen:** two rows.

Row 1: "Market — 1.8T US construction · 141% YoY growth in Solana RWAs · $24B Solana RWA TVL mid-2025."
Row 2: "Traction — [N] contractor conversations · [N] design partners · Live on devnet."

**Speaker notes (20s):** "1.8-trillion-dollar industry. Real-world assets on Solana grew 141 percent last year, passing 24 billion TVL. We've walked the prototype through [N] contractor offices. [Best partner quote, 1 line]. Two committed pilots in the 90-day plan."

*Replace [N] and the quote with real content from `docs/TRACTION.md` before recording.*

---

## Slide 9 — What we're not (scope discipline)

**On-screen:** four crossed-out items. Dark, almost apologetic styling.

- ~~On-chain construction management~~
- ~~Escrow / custody~~
- ~~AI drawing review~~
- ~~Mainnet USDC settlement (today)~~

Below: **"One loop. Done."**

**Speaker notes (15s):** "We say no to a lot. No AI. No escrow until we've earned it. No custody claims. No mainnet until the devnet pilots prove the unit economics. We're shipping one loop — done."

---

## Slide 10 — The ask

**On-screen:**

- Colosseum accelerator, $250K pre-seed.
- Two live pilots in 90 days (Nairobi + Accra).
- First stablecoin-settled construction milestones on mainnet in Q2.

Bottom: founder name + email + `weza.build` (or your deploy URL).

**Speaker notes (15s):** "We're applying to the Colosseum accelerator. The ask is 250,000 dollars in pre-seed to run two pilots in Nairobi and Accra, then move the first production milestones to mainnet in Q2. Thank you."

---

## Rules that make the deck fast to build

1. Same font on every slide (Inter or Geist, 56pt title, 24pt body, 10pt caption).
2. One slide, one idea. If it has a bullet list, split it.
3. Numbers in tabular-nums mono.
4. Every claim on a fact slide (2, 8) is hyperlinked to a source in the speaker notes.
5. No stock photos.

## Reading order for the judge

Most judges skim the deck first, then watch the pitch, then open the live deploy. Optimise slides 1, 2, 6, 10 — those are the ones they actually read.
