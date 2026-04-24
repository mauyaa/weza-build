/* eslint-disable no-console */
/**
 * Seed a Supabase/Postgres project with realistic WEZA Build demo data.
 *
 * Requirements in the env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DATABASE_URL
 *
 * The script creates three auth users, lets the handle_new_user trigger
 * provision their profile + org, then wires up projects, milestones,
 * submissions, versions, decisions, payouts, and audit rows using the
 * same repo functions the API uses — so seeded state is exactly what
 * the live flow produces.
 */
import { Keypair } from "@solana/web3.js";
import crypto from "node:crypto";
import { closePool, query, withTx } from "../src/lib/db";
import { supabaseService } from "../src/lib/supabase-service";
import { addComment, decide, submitPackage, writeAudit } from "../src/lib/repo";
import { approvalPda } from "../src/lib/solana-approval";
import type { Profile } from "../src/lib/types";

const ALL_EMAILS = [
  "owner@weza.build",
  "certifier@weza.build",
  "contractor@weza.build",
];

async function ensureAuthUser(
  email: string,
  password: string,
  metadata: Record<string, unknown>
): Promise<string> {
  const svc = supabaseService();
  // Delete any existing user with this email (idempotent reseed).
  const { data: list } = await svc.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) {
    await svc.auth.admin.deleteUser(existing.id);
  }
  const { data, error } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error || !data.user) throw new Error(`Failed to create ${email}: ${error?.message}`);
  return data.user.id;
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function wipeData() {
  await query(`
    TRUNCATE audit_logs, payout_instructions, approval_decisions,
             review_comments, submission_versions, submissions,
             milestones, projects, profiles, organizations
    RESTART IDENTITY CASCADE;
  `);
}

async function main() {
  console.log("Seeding WEZA Build demo data…");
  await wipeData();

  const ownerId = await ensureAuthUser("owner@weza.build", "weza1234", {
    full_name: "Amani Otieno",
    role: "owner",
    organization_name: "Harambee Construction Holdings",
  });
  const certifierId = await ensureAuthUser("certifier@weza.build", "weza1234", {
    full_name: "Zanele Mbeki",
    role: "certifier",
  });
  const contractorId = await ensureAuthUser("contractor@weza.build", "weza1234", {
    full_name: "Kofi Mensah",
    role: "contractor",
  });

  // Give owner + contractor devnet wallets.
  await query("UPDATE profiles SET wallet_address = $1 WHERE id = $2", [
    Keypair.generate().publicKey.toBase58(),
    ownerId,
  ]);
  await query("UPDATE profiles SET wallet_address = $1 WHERE id = $2", [
    Keypair.generate().publicKey.toBase58(),
    contractorId,
  ]);

  const owner = (await query<Profile>("SELECT * FROM profiles WHERE id = $1", [ownerId])).rows[0];
  const certifier = (await query<Profile>("SELECT * FROM profiles WHERE id = $1", [certifierId])).rows[0];
  const contractor = (await query<Profile>("SELECT * FROM profiles WHERE id = $1", [contractorId])).rows[0];

  const orgId = owner.org_id;

  // Project 1 — Nyali Mixed-Use Tower.
  const p1Id = (
    await query<{ id: string }>(
      `INSERT INTO projects (org_id, name, code, owner_id, certifier_id, contractor_id, contract_value_usdc)
       VALUES ($1, 'Nyali Mixed-Use Tower', 'NMT-24', $2, $3, $4, 1250000)
       RETURNING id`,
      [orgId, ownerId, certifierId, contractorId]
    )
  ).rows[0].id;

  // Milestone A: fully settled (pre-approved + paid on devnet).
  const m1aRes = await query<{ id: string }>(
    `INSERT INTO milestones (project_id, sequence, title, scope, payout_amount_usdc, status, payout_status, due_date)
     VALUES ($1, 1, 'Site clearance & setting out', 'Survey, grading, and boundary pegs', 48000, 'settled', 'confirmed', '2025-02-10')
     RETURNING id`,
    [p1Id]
  );
  const m1a = m1aRes.rows[0].id;
  const sigA = "DEMO" + crypto.randomBytes(32).toString("base64").slice(0, 60);
  await query("UPDATE milestones SET payout_tx_signature = $1, payout_triggered_at = now() WHERE id = $2", [
    sigA,
    m1a,
  ]);
  const subARes = await query<{ id: string }>(
    `INSERT INTO submissions (milestone_id, contractor_id, status, current_version)
     VALUES ($1, $2, 'approved', 1) RETURNING id`,
    [m1a, contractorId]
  );
  const subA = subARes.rows[0].id;
  await query(
    `INSERT INTO submission_versions (submission_id, version, title, note, file_name, file_sha256, file_size_bytes, submitted_by)
     VALUES ($1, 1, 'Site clearance photo log', 'Final cleared site with benchmark pegs', 'NMT-site-clearance-v1.pdf', $2, 2430112, $3)`,
    [subA, sha256("NMT-site-clearance-v1"), contractorId]
  );
  const approvalSigA = "DEMO_APPROVAL_" + crypto.randomBytes(24).toString("base64url");
  await query(
    `UPDATE milestones
       SET approval_tx_signature = $2, approval_pda = $3, approval_network = 'solana-devnet'
     WHERE id = $1`,
    [m1a, approvalSigA, approvalPda(m1a)]
  );
  await query(
    `INSERT INTO approval_decisions
       (submission_id, version, certifier_id, action, note,
        approval_tx_signature, approval_pda, approval_network, approval_recorded_at)
     VALUES ($1, 1, $2, 'approve', 'Accepted on seed.', $3, $4, 'solana-devnet', now())`,
    [subA, certifierId, approvalSigA, approvalPda(m1a)]
  );
  await query(
    `INSERT INTO payout_instructions (milestone_id, amount_usdc, recipient_wallet, status, tx_signature, network, triggered_by, triggered_at, confirmed_at)
     VALUES ($1, 48000, $2, 'confirmed', $3, 'solana-devnet', $4, now(), now())`,
    [m1a, contractor.wallet_address, sigA, ownerId]
  );
  for (const ev of [
    { actor: contractor, action: "submission.submitted", message: "Submitted v1: Site clearance photo log" },
    {
      actor: certifier,
      action: "approval.recorded_onchain",
      message: `On-chain approval recorded at ${approvalPda(m1a)}`,
      txSignature: approvalSigA,
    },
    { actor: certifier, action: "submission.approved", message: "Approved v1" },
    { actor: certifier, action: "milestone.approved", message: "Milestone Site clearance & setting out approved" },
    { actor: certifier, action: "milestone.payout_ready", message: "Payout ready: 48000.00 USDC" },
    { actor: owner, action: "payout.triggered", message: "Payout triggered: 48000.00 USDC" },
    { actor: owner, action: "payout.confirmed", message: "Payout confirmed on solana-devnet", txSignature: sigA },
  ] as const) {
    await writeAudit({
      orgId,
      projectId: p1Id,
      milestoneId: m1a,
      submissionId: subA,
      actor: ev.actor,
      action: ev.action as never,
      message: ev.message,
      txSignature: (ev as { txSignature?: string }).txSignature ?? null,
    });
  }

  // Milestone B: in revision loop (currently under_review on v2).
  const m1b = (
    await query<{ id: string }>(
      `INSERT INTO milestones (project_id, sequence, title, scope, payout_amount_usdc, due_date)
       VALUES ($1, 2, 'Foundation & piling', 'Rebar, formwork, concrete pour & cure', 180000, '2025-04-30')
       RETURNING id`,
      [p1Id]
    )
  ).rows[0].id;
  const sub1 = await submitPackage({
    milestoneId: m1b,
    actor: contractor,
    title: "Foundation pour — drawing package",
    note: "Rebar schedule and pour plan for Grid A–C",
    fileName: "NMT-foundation-v1.pdf",
    fileSize: 4880112,
    fileSha256: sha256("NMT-foundation-v1"),
  });
  await addComment({
    submissionId: sub1.submission.id,
    actor: certifier,
    body: "Grid B rebar spacing deviates from structural drawing S-104. Please align to 150mm centres.",
  });
  await decide({
    submissionId: sub1.submission.id,
    actor: certifier,
    action: "request_revision",
    note: "Revise rebar spacing on Grid B.",
  });
  const sub1v2 = await submitPackage({
    milestoneId: m1b,
    actor: contractor,
    title: "Foundation pour — drawing package (revised)",
    note: "Rebar spacing corrected to 150mm centres on Grid B.",
    fileName: "NMT-foundation-v2.pdf",
    fileSize: 4912004,
    fileSha256: sha256("NMT-foundation-v2"),
  });
  await addComment({
    submissionId: sub1v2.submission.id,
    actor: certifier,
    body: "Received. Will finalise review today.",
  });

  // Milestone C: approved + payout ready — the demo star.
  const m1c = (
    await query<{ id: string }>(
      `INSERT INTO milestones (project_id, sequence, title, scope, payout_amount_usdc, due_date)
       VALUES ($1, 3, 'Ground floor slab', 'Slab pour and curing evidence', 95000, '2025-05-22')
       RETURNING id`,
      [p1Id]
    )
  ).rows[0].id;
  const sub1c = await submitPackage({
    milestoneId: m1c,
    actor: contractor,
    title: "Ground floor slab — pour evidence",
    note: "Cube test results attached.",
    fileName: "NMT-gf-slab-v1.pdf",
    fileSize: 3110544,
    fileSha256: sha256("NMT-gf-slab-v1"),
  });
  await addComment({
    submissionId: sub1c.submission.id,
    actor: certifier,
    body: "Cube strengths within tolerance. Ready to sign off.",
  });
  await decide({
    submissionId: sub1c.submission.id,
    actor: certifier,
    action: "approve",
    note: "Cube tests pass; slab accepted.",
    onChainApproval: {
      txSignature: "DEMO_APPROVAL_" + crypto.randomBytes(24).toString("base64url"),
      approvalPda: approvalPda(m1c),
      network: "solana-devnet",
      recordedAt: new Date().toISOString(),
    },
  });

  // Milestone D: awaiting submission.
  await query(
    `INSERT INTO milestones (project_id, sequence, title, scope, payout_amount_usdc, due_date)
     VALUES ($1, 4, 'Superstructure — L1 slab', 'Formwork, rebar, pour for Level 1', 120000, '2025-06-30')`,
    [p1Id]
  );

  // Project 2 — Karen Courtyard Housing.
  const p2Id = (
    await query<{ id: string }>(
      `INSERT INTO projects (org_id, name, code, owner_id, certifier_id, contractor_id, contract_value_usdc)
       VALUES ($1, 'Karen Courtyard Housing', 'KCH-24', $2, $3, $4, 640000)
       RETURNING id`,
      [orgId, ownerId, certifierId, contractorId]
    )
  ).rows[0].id;
  await query(
    `INSERT INTO milestones (project_id, sequence, title, scope, payout_amount_usdc, due_date)
     VALUES ($1, 1, 'Earthworks & cut-to-fill', 'Bulk earthworks balance', 52000, '2025-05-05')`,
    [p2Id]
  );
  const m2b = (
    await query<{ id: string }>(
      `INSERT INTO milestones (project_id, sequence, title, scope, payout_amount_usdc, due_date)
       VALUES ($1, 2, 'Retaining walls', 'RC retaining wall pours', 78000, '2025-06-10')
       RETURNING id`,
      [p2Id]
    )
  ).rows[0].id;
  await submitPackage({
    milestoneId: m2b,
    actor: contractor,
    title: "Retaining walls — pour package",
    note: "Shutter strike photos attached.",
    fileName: "KCH-retain-v1.pdf",
    fileSize: 2810880,
    fileSha256: sha256("KCH-retain-v1"),
  });

  console.log("Seed complete.");
  console.log("Password for demo accounts: weza1234");
  for (const e of ALL_EMAILS) console.log("  •", e);
  await closePool();
}

main().catch(async (err) => {
  console.error("Seed failed:", err);
  await closePool();
  process.exit(1);
});
