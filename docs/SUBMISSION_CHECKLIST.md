# Submission checklist — zero to submitted

Every item here maps to a concrete action you take outside the codebase. Check them off in order. Do not skip.

## 0 — Choose a submission target

- [ ] Open <https://www.colosseum.org/> and confirm which hackathon is currently running (Breakout, Radar, Frontier, or whichever cycle).
- [ ] Bookmark the Devpost / Colosseum submission page.
- [ ] Note the deadline (date + time in UTC + your local time).

## 1 — Merge the code

- [ ] Merge the current Cloud Agent PR into `main`.
- [ ] Confirm `main` contains Supabase migrations, seed data, Solana approval proof gating, and the Vercel build fix.
- [ ] Update the repo's default branch to `main` if it isn't already.

## 2 — Stand up Supabase (~20 minutes)

- [ ] `supabase.com` → New project (free tier is fine for the demo). Region: closest to your judges — `us-east-1` is a safe default.
- [ ] Project Settings → API: copy URL, anon key, service role key.
- [ ] Project Settings → Database → Connection string (URI format): copy.
- [ ] Authentication → Providers → Email: Enable. Uncheck "Confirm email" for the demo.
- [ ] From your laptop:
      ```bash
      export DATABASE_URL='postgres://...'
      npm run db:migrate
      ```
- [ ] Dashboard → Table Editor: confirm you see `organizations`, `profiles`, `projects`, `milestones`, `submissions`, `submission_versions`, `review_comments`, `approval_decisions`, `payout_instructions`, `audit_logs`.
- [ ] Storage: confirm the `submissions` bucket exists.
- [ ] Authentication → Triggers: confirm `on_auth_user_created`.

## 3 — Fund the Solana devnet treasury (~10 minutes)

- [ ] `solana-keygen new --outfile treasury.json --no-bip39-passphrase`.
- [ ] `solana airdrop 2 $(solana-keygen pubkey treasury.json) --url devnet` — retry until balance ≥ 2 SOL.
- [ ] Mint devnet USDC: open <https://faucet.circle.com>, select **Solana Devnet**, paste the treasury address, request `100000` (devnet USDC; it's funny money).
- [ ] Confirm balances on <https://explorer.solana.com/address/...?cluster=devnet>.
- [ ] Copy the contents of `treasury.json` (the 64-number array) — this is `SOLANA_TREASURY_KEYPAIR`.
- [ ] **Do not commit `treasury.json`.**

## 4 — Provision a real RPC (~5 minutes)

- [ ] Sign up at <https://www.helius.dev/> or <https://www.quicknode.com/>.
- [ ] Create a **devnet** endpoint.
- [ ] Copy the HTTPS URL → this is `SOLANA_RPC_URL`.

## 5 — Deploy to Vercel (~10 minutes)

- [ ] Vercel → New Project → import the GitHub repo.
- [ ] Framework preset: Next.js (auto).
- [ ] Settings → Environment Variables — add every variable from `.env.example`:
    - [ ] `NEXT_PUBLIC_SUPABASE_URL`
    - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - [ ] `SUPABASE_SERVICE_ROLE_KEY` (Encrypted)
    - [ ] `DATABASE_URL` (Encrypted)
    - [ ] `SOLANA_RPC_URL`
    - [ ] `SOLANA_CLUSTER` = `devnet`
    - [ ] `SOLANA_TREASURY_KEYPAIR` (Encrypted)
    - [ ] `WEZA_STORAGE_BUCKET` = `submissions`
- [ ] Do **not** set `WEZA_MOCK_SOLANA`.
- [ ] Deploy.
- [ ] Leave `WEZA_PUBLIC_SIGNUP=0` unless you are intentionally testing signup. Judges should use seeded demo users.

## 6 — Seed demo data (~2 minutes)

From your laptop, with the live envs loaded:

- [ ] `npm run seed`
- [ ] Confirm login at `https://YOUR-DEPLOY.vercel.app` with `owner@weza.build` / `weza1234`.

## 7 — Smoke test (~5 minutes)

Walk through `docs/SMOKE_TEST.md` end to end.

- [ ] §1 `/api/health/solana` returns `mode: live`, usdcUi ≥ 1000.
- [ ] §2 signup creates auth user + profile.
- [ ] §3 login succeeds, wrong password is rejected.
- [ ] §4 full loop runs, produces a real 88-char base58 signature.
- [ ] §4 Explorer view shows an approval **Memo instruction** first, then payout **Memo + TransferChecked** for USDC mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`.
- [ ] §4 idempotency — double-click returns same signature.
- [ ] §5 RLS sanity — running as `authenticated` for a non-member returns no project rows.
- [ ] §6 file download — member gets 302 + signed URL; non-member gets 403.
- [ ] §7 production guardrail — setting `WEZA_MOCK_SOLANA=1` in Vercel and redeploying does NOT change `mode: live` to `mock`.

## 8 — Three real user interviews (~half a day)

- [ ] Use `docs/OUTREACH.md` to send 20 cold DMs + ask for warm intros.
- [ ] Run three 20-minute interviews. Follow the script in `docs/OUTREACH.md`.
- [ ] Populate three rows in `docs/TRACTION.md` with date, firm, role, region, **direct quote**, prototype reaction, commitment.
- [ ] Pick the single strongest sentence across all three quotes. That's your pitch-video quote.

## 9 — Record the two videos (~2 hours incl. retakes)

- [ ] Read `docs/STORYBOARD.md`. Print the script.
- [ ] Pre-record: run the demo loop once to warm caches. Confirm `/api/health/solana` looks good. Screenshot it for shot 2 of the demo.
- [ ] **Pitch video** (2:45 target). One take, two at most. Founder-to-camera.
- [ ] **Technical demo** (2:30 target). Screen recording, three browsers side-by-side.
- [ ] Edit: trim top and tail, no music over voice, light captions for shot 3 of the pitch.
- [ ] Upload both to Vimeo (pitch) + YouTube (demo), unlisted.
- [ ] Add the links to the submission and to this checklist.

## 10 — Build the pitch deck (~2 hours)

- [ ] Open `docs/PITCH_DECK.md`, use it as the script.
- [ ] Build 10 slides in Pitch / Keynote / Figma.
- [ ] Export as PDF. Upload to Google Drive, make link-share viewable.

## 11 — Write the Hackathon Canvas / Devpost fields

- [ ] Use `docs/HACKATHON_CANVAS.md` to fill the canvas.
- [ ] Devpost fields map 1:1 to the canvas sections.
- [ ] Tagline: "On-chain approval-to-payout for African construction."
- [ ] Short description: "WEZA records certifier approval on Solana first, then unlocks devnet USDC payout with a permanent audit trail for Nairobi construction teams."
- [ ] Long description: combine canvas sections 1–6.

## 12 — Final sanity (30 minutes before deadline)

- [ ] `/api/health/solana` still returns `mode: live`.
- [ ] Seed data intact. Log in, open a milestone, confirm handoff + timeline render.
- [ ] Explorer link from the `settled` milestone loads.
- [ ] Submission page has: GitHub link, deploy link, pitch video, demo video, deck PDF.
- [ ] Team names and bios filled. Do not leave placeholders.

## 13 — Submit.

## 14 — After submission (this moves the needle for the accelerator stage)

- [ ] Post the demo video link in one place — Superteam Africa Telegram / Solana Africa — asking for feedback. Do not spam. One post.
- [ ] DM the Colosseum team on Twitter with the submission link; Colosseum founders retweet standout submissions during judging week.
- [ ] Reach out to one journalist who covers Solana RWAs for a short comment (Decrypt, The Defiant, Blockworks). Chance of coverage is low but nonzero; a single article linking to your deploy is priceless.
- [ ] Keep the demo live for the entire judging period. Do not reset the database. Do not rotate the treasury key. Judges will reopen the deploy days after you submit.

---

## What success looks like

- Two videos that stay under 3:00.
- Three real user quotes.
- A live deploy that never goes down during judging week.
- An approval signature and payout signature they can click through to on Solana Explorer.
- An honest narrative: one product, one loop, public approval proof before payout.

If you do all of the above, the submission is unusually complete: live product, real Solana evidence, clear market wedge, and honest traction plan. Winning still depends on judge taste and pilot evidence; do not claim inevitability, show proof.
