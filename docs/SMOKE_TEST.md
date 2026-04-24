# Smoke test checklist

Run this against a fresh deploy (or locally with the full env set) after every non-trivial change. Each step has a clear pass/fail condition.

## 0. Preconditions

- `docs/DEPLOYMENT.md` steps 1–6 complete.
- `npm run seed` was run against the target Supabase project.
- `NEXT_PUBLIC_BASE_URL` in this document refers to either `http://localhost:3000` (local) or `https://YOUR-DEPLOY.vercel.app` (hosted).

Throughout this script, `BASE` is that URL.

## 1. Health check — Solana treasury

```bash
curl -s "$BASE/api/health/solana" | jq
```

**Pass:** `data.mode == "live"`, `data.lamports >= 10_000_000` (≈ 0.01 SOL), `data.usdcUi >= 1000`, `data.cluster == "devnet"`.

**Fail:** `mode: mock` (production env mis-set), `treasury_unavailable` (RPC or treasury not configured), `lamports` low (SOL airdrop), or `usdcUi` low (top up from <https://faucet.circle.com>).

## 2. Signup + Supabase Auth + profile trigger

```bash
curl -s -c /tmp/c -X POST "$BASE/api/auth/signup" \
  -H "content-type: application/json" \
  -d '{"fullName":"Smoke Owner","email":"smoke@weza.build","password":"smoketest","role":"owner","organizationName":"Smoke Co"}'
```

**Pass:** envelope `success: true` and `data.profile.org_id` non-empty. In the Supabase dashboard, a row exists in `auth.users`, a matching row exists in `public.profiles`, and a new `public.organizations` row has the correct name.

**Fail:** `email_exists` (clean up and re-run), any 5xx, or the profile row is missing (trigger not installed).

Log out:

```bash
curl -s -b /tmp/c -X POST "$BASE/api/auth/logout" -i | head -1
```

## 3. Login with a demo account

```bash
curl -s -c /tmp/c -X POST "$BASE/api/auth/login" \
  -H "content-type: application/json" \
  -d '{"email":"contractor@weza.build","password":"weza1234"}' | jq .success
```

**Pass:** `true`. Wrong password returns `success:false`, `code: invalid_credentials`.

## 4. Full workflow loop

The steps below match `docs/DEMO_WALKTHROUGH.md` with API calls instead of UI clicks. All calls assume you've logged in with the matching role.

**As contractor**, pick an `awaiting_submission` milestone (seed creates one titled "Superstructure — L1 slab"). Submit a real file:

```bash
MID=<milestone id from /app/milestones/... URL or dashboard>
echo "test" > /tmp/drawing.pdf
curl -s -b /tmp/c -X POST "$BASE/api/milestones/$MID/submit" \
  -F "title=L1 slab" -F "note=first" -F "file=@/tmp/drawing.pdf" | jq .data.submission.status
```

**Pass:** `"under_review"`. In Supabase Storage, the `submissions` bucket now contains `<submission_id>/v1-drawing.pdf`.

**As certifier**, approve:

```bash
SID=<submission_id from the previous response>
curl -s -c /tmp/c -X POST "$BASE/api/auth/login" \
  -H "content-type: application/json" -d '{"email":"certifier@weza.build","password":"weza1234"}' > /dev/null
curl -s -b /tmp/c -X POST "$BASE/api/submissions/$SID/decision" \
  -H "content-type: application/json" -d '{"action":"approve","note":"ok"}' | jq .data.milestone.payout_status
```

**Pass:** `"ready"`.

**As owner**, trigger payout:

```bash
curl -s -c /tmp/c -X POST "$BASE/api/auth/login" \
  -H "content-type: application/json" -d '{"email":"owner@weza.build","password":"weza1234"}' > /dev/null
curl -s -b /tmp/c -X POST "$BASE/api/milestones/$MID/payout" | jq '{status: .data.payout.status, sig: .data.payout.tx_signature, explorer: .data.explorer_url}'
```

**Pass:** `status == "confirmed"`, `sig` is a ~88-char base58 string (not starting with `MOCK_`), and opening `explorer` loads the transaction on Solana Explorer devnet. The Explorer view should show **two instructions**: a Memo instruction with a JSON payload (`app:"weza-build"`, `project`, `milestone`, `milestone_id`, `submission_id`, `approved_by`) and an SPL-Token `TransferChecked` for the USDC mint (`4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`).

**Idempotency:**

```bash
curl -s -b /tmp/c -X POST "$BASE/api/milestones/$MID/payout" | jq .data.payout.tx_signature
```

**Pass:** same signature returned, no second on-chain transaction (check `/api/health/solana` — treasury lamports only decreased by 5000 for the whole loop).

## 5. RLS sanity

From the Supabase dashboard SQL editor, run as the `authenticated` role:

```sql
SET ROLE authenticated;
SELECT auth.uid() = '<some-unrelated-user-uuid>';
SELECT count(*) FROM projects; -- should return only that user's rows
RESET ROLE;
```

**Pass:** rows returned match the user's project membership, no cross-org leakage.

## 6. File download authorization

**As contractor**, request a signed URL for your own version:

```bash
curl -s -b /tmp/c -i "$BASE/api/versions/$SVID/file" | head -1
```

**Pass:** `HTTP/1.1 302` with a Supabase signed URL in the `location` header; fetching it returns the uploaded bytes.

**As a user who is not a member of that project** (create a second owner via `/signup` and log in):

```bash
curl -s -b /tmp/c -i "$BASE/api/versions/$SVID/file" | head -3
```

**Pass:** `HTTP/1.1 403` with code `forbidden`.

## 7. Production-only guardrails

In your Vercel deployment **Settings → Environment Variables**, set `WEZA_MOCK_SOLANA=1`, redeploy, and hit `/api/health/solana`.

**Pass:** returns `mode: "live"` (the env loader refuses mock in production). If it returns `mode: "mock"` in production, escalate — a newer branch has broken the guard.

Remove the var again after the test.

---

## One-command smoke (local)

With the full env in `.env.local`:

```bash
npm run build && npm start &
sleep 3
./scripts/smoke.sh
```

Where `scripts/smoke.sh` runs the cURL sequence above in order. The script is not shipped because the live signatures depend on real devnet; always run it interactively.
