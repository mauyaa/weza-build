# Storyboard — WEZA Build videos

Two videos, both under 3 minutes. Record in this exact order. Each row is a shot. Each shot has:
- **Camera** — what the viewer sees.
- **Audio** — what you say (word-for-word if you're nervous; key phrases otherwise).
- **Capture** — what to prepare or click.

Do not improvise. Colosseum judges watch dozens of these in a row; deviation almost always makes the video worse, not better.

Before recording: run `/api/health/solana` once and confirm `mode: live`, `lamports >= 100_000_000`, `usdcUi >= 1000`. Screenshot the JSON. Keep that screenshot — it's shot 3 of the technical demo.

---

## Video 1 — pitch (2:45 target, 3:00 hard cap)

Record on a clean neutral background. No slides, no screen share. Founder-to-camera. 1080p is enough.

| # | Time | Camera | Audio (say this) | Capture |
|---|---|---|---|---|
| 1 | 0:00–0:05 | Wide on you, eye contact. | "I'm [NAME]. I'm building WEZA Build." | 5 words of identification. Nothing else. |
| 2 | 0:05–0:15 | Same. | "Construction payments are the dirtiest corner of a 1.8 trillion-dollar industry." | Slow down on the number. |
| 3 | 0:15–0:35 | Title card overlay: **"$299B · 14% · 82% · 5%"** | "Last year, slow payments cost US construction 299 billion dollars. A 14-percent hidden tax on every project. 82 percent of contractors wait over 30 days past due. Only 5 percent of subcontractors get paid on time." | Overlay stays up through the whole stat. |
| 4 | 0:35–0:55 | Back to founder. | "This isn't a banking problem. It's a workflow problem. When a sub finishes work, the money doesn't move because the approval doesn't move. Drawings sit in email. Revisions sit in WhatsApp. The certifier has no queue. The payment waits on paperwork that never lands." | Hit "approval" hard. |
| 5 | 0:55–1:10 | Founder. | "WEZA Build is an approval-to-payout platform for construction teams. Contractors submit. Certifiers review and approve. Owners click once, and the payment moves on Solana — permanent, auditable, tied to that specific milestone." | One sentence product definition. |
| 6 | 1:10–1:40 | Cut to **screen recording of the full loop at 1.5x speed**, captioned. | Voice-over: "This is the entire loop. Submit. Review. Approve. Trigger payout. The audit trail updates live across every role." | Cue this recording up before you start. It's pre-rendered. |
| 7 | 1:40–2:00 | Founder. | "Why Solana. Drawings stay off chain. But every payout is one USDC transfer with a memo tag — project, milestone, submission, approver. Sub-cent cost. Real-time confirmation. Anyone can verify which real-world approval caused this transfer on Explorer." | "Memo tag" is the phrase that signals you know what you're doing. |
| 8 | 2:00–2:25 | Founder. | "I've shown the prototype to [N] contractor offices. [Specific quote from one]. That's why we're here. Construction is the biggest industry still running approvals on email. That's what we're replacing." | REPLACE the placeholder with a real partner quote from `docs/TRACTION.md` before recording. |
| 9 | 2:25–2:40 | Founder. | "Today: deployed, end-to-end loop, real devnet USDC moving with tagged signatures on every payout. Next 90 days: two live pilots, Nairobi and Accra. We're applying for the Colosseum accelerator to run those pilots." | If you don't have pilots yet, say "the first two pilots." Don't overclaim. |
| 10 | 2:40–2:50 | Founder, slight pause. | "WEZA Build. Approval-to-payout for construction. Link in the description." | End on the URL. |

**Common mistakes to avoid**
- Reading from the screen. Print the script, keep it below the lens.
- Rushing shot 3 (the numbers). Slow. Those four numbers *are* the pitch.
- Jargon. No "web3," no "decentralized," no "composable." You already sound like an infrastructure founder because the product is.
- Music over voice. Off.

---

## Video 2 — technical demo (2:30 target, 3:00 hard cap)

Screen-only. Three browser windows arranged side-by-side (1/3 width each). Your voice off-camera.

Before recording: run `npm run seed` against the live Supabase project, log into each of the three roles in each of the three windows, and leave them parked on their respective dashboards.

| # | Time | Shot | Audio | Click |
|---|---|---|---|---|
| 1 | 0:00–0:08 | Three windows visible. | "Three windows, one Supabase project. Owner, certifier, contractor." | Hover over each role pill. |
| 2 | 0:08–0:20 | Zoom into one browser: `/api/health/solana` JSON. | "The treasury is real. Devnet USDC funded from Circle's faucet, running on Helius RPC. Let me show you." | Curl or visit the URL; leave it up for 6 seconds. |
| 3 | 0:20–0:40 | Contractor window. | "Contractor opens the Superstructure milestone. Ball is with her. Drops a PDF, submits. One click: file goes to Supabase Storage, submission row written, audit trail updated." | Click action card → choose file → click Submit package. |
| 4 | 0:40–0:55 | Pan to certifier window — **do not refresh**. | "No refresh. Certifier's view updates live. The audit rail flashes green. That's the audit endpoint polling since-last-event." | Wait ~3 seconds for the poll to fire. |
| 5 | 0:55–1:15 | Certifier: click Request revision with a note. | "Certifier requests a revision. Ball flips to contractor." | Note: "tighten rebar spec." Click Request revision. |
| 6 | 1:15–1:30 | Contractor window. | "Contractor resubmits v2." | Drop another file, click Resubmit. |
| 7 | 1:30–1:50 | Certifier window. Click Approve. | "Certifier approves. One transaction: submission approved, milestone approved, payout ready, three audit rows." | Click Approve milestone. |
| 8 | 1:50–2:10 | Owner window, payout panel. | "Owner's turn. One click." | Click **Trigger payout · 120,000 USDC**. |
| 9 | 2:10–2:25 | Zoom on the Settled banner, then click **View on Explorer**. | "Devnet tx. Two instructions. Memo program carrying the milestone context. SPL TransferChecked of 120,000 USDC. Anyone can verify which approval caused this transfer." | Click Explorer link. Expand Memo + Token Balances. Let it breathe for 5 seconds. |
| 10 | 2:25–2:30 | Back to milestone page. | "Approval-to-payout. Off-chain workflow, on-chain proof. That's it." | End. |

**Recording tips**
- Use Screen Studio / OBS with clean cursor smoothing.
- Text size: bump the browser to 120%. Judges watch on laptops.
- One take is fine. Two takes is better. Don't shoot 10.
- If the devnet RPC is slow on one of the shots (shot 9), re-run. Explorer loading slowly looks bad.

---

## Thumbnail

Static frame, dark background, four numbers white: **$299B · 14% · 82% · 5%**. Caption: "Approval-to-payout for construction. Solana." This works as the YouTube/Vimeo/Devpost thumbnail and as slide 1 of the deck.

## Where to host

- Vimeo unlisted for pitch (judges prefer it over YouTube for hackathon submissions per Colosseum blog).
- YouTube unlisted for the demo (easier to link-embed).
- Both in `SUBMISSION_CHECKLIST.md`.
