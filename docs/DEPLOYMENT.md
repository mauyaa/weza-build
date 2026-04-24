# Deployment checklist

WEZA Build runs on the following stack in production:

- **Next.js 14 App Router** hosted on **Vercel**
- **Postgres + Auth + Storage** hosted on **Supabase**
- **Solana devnet** accessed through a dedicated RPC (**Helius** or **QuickNode** recommended)
- A pre-funded **devnet treasury keypair** stored as a Vercel secret

Follow the steps in order. Each step is idempotent.

---

## 1. Create the Supabase project

1. Sign in at `https://supabase.com/dashboard` and create a new project.
2. Note down from **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. From **Project Settings → Database → Connection string**, copy the `URI` format → `DATABASE_URL`.
4. In **Authentication → Providers → Email**:
   - Enable Email.
   - Disable "Confirm email" for the demo (or keep it on and confirm users manually).

## 2. Apply migrations

Two options — either works.

**Option A — via this repo (no Supabase CLI required):**

```bash
export DATABASE_URL='postgres://postgres:PASSWORD@db.YOUR_REF.supabase.co:5432/postgres?sslmode=require'
npm run db:migrate
```

This runs every file in `supabase/migrations/` in order and records them in a `schema_migrations` table.

**Option B — via the Supabase CLI:**

```bash
supabase link --project-ref YOUR_REF
supabase db push
```

After migration you should see the following in the Supabase dashboard:

- Tables: `organizations`, `profiles`, `projects`, `milestones`, `submissions`, `submission_versions`, `review_comments`, `approval_decisions`, `payout_instructions`, `audit_logs`.
- Storage bucket: `submissions` (private).
- Trigger: `on_auth_user_created` on `auth.users`.
- RLS enabled on every user-facing table with read policies.

## 3. Provision a Solana devnet treasury (SOL for fees + devnet USDC for payouts)

From any machine with the Solana CLI:

```bash
solana-keygen new --outfile treasury.json --no-bip39-passphrase
ADDR=$(solana-keygen pubkey treasury.json)
solana airdrop 2 "$ADDR" --url devnet      # covers fees + ATA rent
```

Then mint **devnet USDC** into the treasury using Circle's faucet: <https://faucet.circle.com>. Select **Solana Devnet**, paste `$ADDR`, request a meaningful amount (e.g. 100,000 USDC — this is devnet funny-money). The faucet will auto-create the treasury's USDC Associated Token Account.

Circle's devnet USDC mint (hard-coded in `src/lib/solana.ts`): `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`.

Copy the contents of `treasury.json` (a JSON array of 64 numbers) — that's the value of `SOLANA_TREASURY_KEYPAIR`. Never commit `treasury.json` to the repo.

## 4. Provision a Solana RPC

The public `https://api.devnet.solana.com` is heavily rate-limited and will fail intermittently under a live demo. Use a dedicated devnet endpoint:

- **Helius** — `https://rpc.helius.xyz/?api-key=YOUR_KEY&cluster=devnet`
- **QuickNode** — pick the Solana Devnet plan and use the HTTPS endpoint.
- **Triton One** — any devnet plan.

Paste it into `SOLANA_RPC_URL`.

## 5. Seed the demo accounts

Run from your machine, pointed at the hosted Supabase:

```bash
export NEXT_PUBLIC_SUPABASE_URL=...
export NEXT_PUBLIC_SUPABASE_ANON_KEY=...
export SUPABASE_SERVICE_ROLE_KEY=...
export DATABASE_URL=...
npm run seed
```

The seed script:

- Deletes and recreates `owner@weza.build`, `certifier@weza.build`, `contractor@weza.build` (password `weza1234`) via the service-role Auth Admin API.
- Fires the `handle_new_user` trigger, which provisions a profile and org for each.
- Creates two projects with milestones in every state (settled / under review / payout ready / awaiting).

## 6. Deploy the Next.js app to Vercel

1. Import the Git repo in the Vercel dashboard.
2. Framework preset: **Next.js** (auto-detected).
3. Add the following environment variables in **Settings → Environment Variables**:

   | Name | Environments | Value |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | from step 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | from step 1 |
   | `SUPABASE_URL` | Production, Preview | **same as** `NEXT_PUBLIC_SUPABASE_URL` (server runtime; fixes `/` 500 if public vars were missing at first build) |
   | `SUPABASE_ANON_KEY` | Production, Preview | **same as** `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | from step 1 (encrypted) |
   | `DATABASE_URL` | Production, Preview | from step 1 (encrypted) |
   | `SOLANA_RPC_URL` | Production, Preview | from step 4 |
   | `SOLANA_CLUSTER` | Production, Preview | `devnet` |
   | `SOLANA_TREASURY_KEYPAIR` | Production, Preview | from step 3 (encrypted) |
   | `WEZA_STORAGE_BUCKET` | Production, Preview | `submissions` |

4. **Do NOT set `WEZA_MOCK_SOLANA` in production.** The env loader refuses it when `NODE_ENV=production`; this is defence in depth.
5. Deploy.

## 7. Post-deploy verification

Open `https://YOUR-DEPLOY.vercel.app/api/health/solana`. You should see:

```json
{
  "success": true,
  "data": {
    "mode": "live",
    "publicKey": "<treasury base58>",
    "lamports": 5000000000,
    "rpcUrl": "https://rpc.helius.xyz/...",
    "cluster": "devnet",
    "explorer": "https://explorer.solana.com/address/<pubkey>?cluster=devnet"
  }
}
```

If `mode` is `mock` or `lamports` is low, stop and fix. `mock` in production is blocked by the env loader, so if you see it something upstream is wrong. Low lamports means re-airdrop the treasury.

Then sign in at the deployment URL with any of the demo accounts and run the demo from `docs/DEMO_WALKTHROUGH.md`. The entire flow should render live data from Supabase, upload files to Storage, and produce a real devnet signature on payout.

---

## Rotation / recovery

- **Service role key** rotates in Supabase dashboard → **API → Reset service role**. Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel and redeploy.
- **Treasury keypair** rotates by generating a new one, airdropping to it, and updating `SOLANA_TREASURY_KEYPAIR` in Vercel.
- **Database reset** — re-run `npm run db:migrate` against `DATABASE_URL`; migrations are idempotent.
