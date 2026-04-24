# Outreach — user interviews + design partners

Goal: **three real quotes** from people who run construction projects, before the submission deadline. Colosseum weights early user validation heavily; one specific quote from a named GC is worth more than any framework.

This file is the operator's manual. Copy-paste, send, log the results in `docs/TRACTION.md`.

---

## Who to contact

In priority order:

1. **General contractors** that run two or more active projects. They feel the approval-delay pain from both sides.
2. **Quantity surveyors / architects** who certify milestones. They are the workflow bottleneck and will tell you honestly.
3. **Subcontractors** waiting on payments. The quotes from them hit hardest in a pitch.
4. **Construction-tech operators** (any region): they know who to put you in front of.

Where to find them:
- LinkedIn — search `"quantity surveyor" Nairobi`, `"project manager" Accra construction`, `"general contractor" Lagos`.
- Local WhatsApp / Telegram construction groups (ask Superteam Africa for intros).
- Your own network first. The person who owes you a favour owes you a 20-minute call.

---

## Cold DM — WhatsApp / LinkedIn (first contact)

Keep it to 4 lines. No pitch.

```
Hi [name], I'm [your name]. I'm building a tool that speeds up milestone
approval and payment for construction teams — the piece where the drawing
goes from "submitted" to "paid".

Could I borrow 20 minutes this week to hear how your approval-to-payment
cycle actually works today? I'm not selling anything. I want to learn
from someone who does this for a living.

[Your phone] or whichever day/time works.
```

**Why it works**: no product pitch, asks for time not money, names the specific bottleneck. Expect 20–30% response rate.

## Warm intro — email to someone who knows them

```
Subject: 20-minute intro to [target]?

Hi [mutual],

I'm building WEZA Build — a milestone approval-to-payout tool for
construction teams. Short version: drawings and sign-offs move in one
product, payment moves the moment the certifier approves.

Would you be open to making an intro to [target]? I only need 20
minutes of their time. I'll send them the demo afterwards so they can
poke holes in it.

I'm applying to the Colosseum Solana accelerator this month; real
design partners are what the judges weight most.

[Your name]
[Link to /about page on your deploy]
```

---

## The 20-minute call — structured script

Record with permission. Do not pitch in the first 15 minutes.

**Minutes 0–2 — setup.** "Thanks. Before I show you anything, I want to learn how you do it today. No product pitch unless you ask. Mind if I record for my notes?"

**Minutes 2–15 — use the 7 questions** from `docs/TRACTION.md`:

1. Walk me through your last milestone payment, step by step, starting at "site ready for inspection." Times for each step.
2. Who signs the milestone off? How does that sign-off travel?
3. Where does a milestone package sit the longest? Who's waiting on whom?
4. Last time you had to resubmit — what was wrong and how did you find out?
5. When do you actually see the money hit? Any project in the last six months where that took over 60 days?
6. If approval and payout happened on the same day — what changes in how you plan the next milestone?
7. What would stop you from using a tool that ran the approval queue and moved the payment when the certifier signs off?

Let them talk. Don't interrupt. The best quotes come when they're venting, not answering.

**Minutes 15–18 — show the prototype.** Share screen, walk them through the exact demo flow from `docs/DEMO_WALKTHROUGH.md`. Do not narrate features; narrate what the person on screen is doing.

**Minutes 18–20 — ask for one concrete thing:**

> "Would you be open to running one real milestone through this, on devnet, at no cost, in the next 60 days? Yes, no, or 'send me more' are all fine answers."

Even a "send me more" counts as a design partner for the deck if they reply within a week.

---

## What to capture for each interview (fill `docs/TRACTION.md`)

- Date.
- Role, firm, region.
- **Direct quote — word-for-word — of their strongest sentence about the problem.** Do not paraphrase. Judges can tell.
- Their reaction to the prototype.
- Commitment level: `none` / `intro` / `willing to pilot` / `LOI` / `live project`.

---

## Follow-up — same day

Send this within 6 hours of the call:

```
[Name] — thank you for the 20 minutes. You said [specific sentence
they said, quoted back to them]. That's the problem we're solving.

Link to the prototype: [your deploy URL]
Login: [demo creds]

If you want to see one real milestone run through it on devnet (no
cost, no commitment past testing), I can wire it up in under an hour.

Either way, I'll keep you posted on what we hear from Colosseum.
```

**Why**: most people remember being quoted back to them. It also gives them a shareable link.

---

## Outreach math

You need 3 quotes. Assume:

- 30% reply rate on cold DMs.
- 50% of replies take a call.
- 100% of calls you can quote from.

That means ~20 initial DMs → ~6 replies → 3 calls → 3 quotes. Budget two afternoons.

Warm intros convert at ~70% to a call. One warm intro is worth five cold DMs.

---

## Do not

- Pitch "blockchain" in the first message. Lead with the workflow bottleneck.
- Promise free mainnet settlement. You aren't ready. Offer devnet.
- Send the deck in the first DM. You're asking for their input, not selling.
- Record without permission. Ask, at the top of the call, explicitly.
- Fabricate quotes. Judges in this ecosystem talk to each other. A made-up quote is a submission killer.
