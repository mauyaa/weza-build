# Frontend / Backend Contract

All responses use the same envelope:

```json
{
  "success": true,
  "message": "string",
  "code": "string",
  "data": { "...": "payload, or null on error" },
  "details": null
}
```

Errors use the same envelope with `success: false`, a stable `code`, and an HTTP status that matches the semantic outcome.

## Data layer

- **Database:** Supabase Postgres. Schema in `supabase/migrations/0001_init.sql`.
- **RLS:** `0002_rls.sql` enables read access per project membership / org scope. Writes go through server route handlers using `SUPABASE_SERVICE_ROLE_KEY` → the service role bypasses RLS, which is the supported Supabase pattern for business-rule-enforced writes.
- **Storage:** `submissions` private bucket (`0003_storage.sql`). Server uploads with the service role; clients download via short-lived signed URLs produced by `GET /api/versions/:id/file`.

## Stable error codes

| Code                     | HTTP | Meaning                                                        |
|--------------------------|------|----------------------------------------------------------------|
| `unauthorized`           | 401  | No active Supabase session.                                    |
| `invalid_credentials`    | 401  | Wrong email/password on login.                                 |
| `forbidden`              | 403  | Wrong role or wrong assignment on the project.                 |
| `not_found`              | 404  | Resource does not exist.                                       |
| `no_file`                | 404  | Version has no stored object (metadata-only).                  |
| `validation`             | 400  | Payload rejected.                                              |
| `invalid_state`          | 409  | Entity cannot accept this action right now.                    |
| `invalid_transition`     | 409  | State machine refused the transition.                          |
| `milestone_not_approved` | 409  | Cannot pay out a milestone that is not approved.               |
| `awaiting_review`        | 409  | A version is already waiting for the certifier.                |
| `already_approved`       | 409  | Submission is already approved.                                |
| `milestone_closed`       | 409  | Milestone is already approved / paid / settled.                |
| `no_wallet`              | 409  | Contractor has no wallet configured.                           |
| `treasury_unavailable`   | 503  | `/api/health/solana` cannot reach the treasury.                |

## Endpoints

### `POST /api/auth/signup`
Body: `{ fullName, email, password (>=8), role: "owner"|"certifier"|"contractor", organizationName? }`

Effects: calls `supabase.auth.signUp` with user metadata. The `handle_new_user` SQL trigger atomically creates the matching `profiles` row and the org (for owners) or joins the oldest existing org (for contractors/certifiers). Owners and contractors also get a generated devnet wallet address. Returns `{ profile }`.

### `POST /api/auth/login`
Body: `{ email, password }` — calls `supabase.auth.signInWithPassword`. Returns `{ profile }` and sets the Supabase session cookies.

### `POST /api/auth/logout`
`supabase.auth.signOut()`; 303 redirect to `/`.

### `POST /api/milestones/:id/submit` (contractor)

Accepts **either** `multipart/form-data` with fields `title`, `note`, `file` (UI path), **or** JSON `{ title, note, fileName, fileSize }` for metadata-only test calls. Files up to 25 MB are uploaded into the `submissions` bucket at `<submission_id>/v<n>-<filename>` with a sha256. The key is stored on `submission_versions.storage_key`.

Returns `{ submission, version, milestone, audit }`.

### `GET /api/versions/:id/file`

Role-checked. Redirects (302) to a 5-minute Supabase Storage signed URL with a `Content-Disposition` filename. Returns 404 `no_file` for metadata-only versions.

### `POST /api/submissions/:id/comments`

Body: `{ body }`. Writes one comment + one `submission.comment_added` audit row. Open to owner / certifier / contractor of the project.

### `POST /api/submissions/:id/decision` (certifier)

Body: `{ action: "approve"|"request_revision"|"reject", note }`. Runs in a single transaction:

- `approve` → first records a Solana milestone approval proof, then submission `approved`, milestone `approved`, payout `ready`, `payout_instructions` row created with contractor wallet, and audit rows (`approval.recorded_onchain`, `submission.approved`, `milestone.approved`, `milestone.payout_ready`).
- `request_revision` → submission `revision_requested`, one audit row.
- `reject` → submission `rejected`, one audit row.

Returns `{ decision, submission, milestone, payout, audit }`. Idempotent on repeat-approve.

### `POST /api/milestones/:id/payout` (owner)

1. Locks payout to `triggered`; writes `payout.triggered` audit row.
2. Refuses to run unless the milestone has an approval transaction/PDA, then calls `performDevnetPayoutProof` → USDC `TransferChecked` + Memo on Solana devnet via `SOLANA_RPC_URL` using `SOLANA_TREASURY_KEYPAIR`.
3. On success: payout `confirmed`, milestone `settled`, `payout.confirmed` audit row with signature.
4. On failure: payout `failed`, milestone reverts to `approved`, retryable.

Returns `{ payout, milestone, audit, explorer_url }`. Idempotent on re-trigger — no second broadcast.

### `GET /api/milestones/:id/audit?since=<iso>`

Powers the live cross-role audit rail. Returns `{ events, milestone: { status, payout_status, payout_tx_signature, updated_at } }`. When `since` is provided, only strictly-newer events are returned.

### `GET /api/health/solana`

Returns `{ mode, publicKey, lamports, rpcUrl, cluster, explorer }` or `mode: "mock"` in non-production dev. Fails with `treasury_unavailable` if the treasury env is missing or the RPC is unreachable.

## Why the envelope is shaped this way

The frontend updates the milestone page in one round-trip after any action. Every write endpoint returns the full set of entities the page renders, so the React layer needs at most a single `router.refresh()` — never a cascade of follow-up reads.
