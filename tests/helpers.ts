import { PGlite } from "@electric-sql/pglite";
import { Keypair } from "@solana/web3.js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { setDbDriver, type DbDriver, type DbClientLike } from "../src/lib/db";
import type { Milestone, Profile, Project } from "../src/lib/types";
import type { OnChainApprovalProof } from "../src/lib/repo";

let pg: PGlite | null = null;

function pgliteDriver(db: PGlite): DbDriver {
  return {
    async query<T>(text: string, params: unknown[] = []) {
      const res = await db.query<T>(text, params as unknown[]);
      return { rows: res.rows as T[], rowCount: res.rows.length };
    },
    async withTx<T>(fn: (client: DbClientLike) => Promise<T>): Promise<T> {
      await db.exec("BEGIN");
      try {
        const client: DbClientLike = {
          async query<U>(text: string, params: unknown[] = []) {
            const res = await db.query<U>(text, params as unknown[]);
            return { rows: res.rows as U[], rowCount: res.rows.length };
          },
        };
        const out = await fn(client);
        await db.exec("COMMIT");
        return out;
      } catch (err) {
        await db.exec("ROLLBACK");
        throw err;
      }
    },
    async close() {
      if (pg) {
        await pg.close();
        pg = null;
      }
    },
  };
}

export async function freshDb(): Promise<PGlite> {
  setDbDriver(null);
  if (pg) {
    await pg.close().catch(() => undefined);
    pg = null;
  }
  pg = new PGlite();
  const initSql = fs.readFileSync(path.join(process.cwd(), "tests", "schema.sql"), "utf8");
  await pg.exec(initSql);
  setDbDriver(pgliteDriver(pg));
  return pg;
}

export interface Fixture {
  org_id: string;
  owner: Profile;
  certifier: Profile;
  contractor: Profile;
  project: Project;
  milestone: Milestone;
}

export async function seedFixture(): Promise<Fixture> {
  const db = await freshDb();
  const orgId = `org_${crypto.randomBytes(8).toString("hex")}`;
  await db.query("INSERT INTO organizations (id, name) VALUES ($1, $2)", [orgId, "Test Org"]);

  const mk = async (role: "owner" | "certifier" | "contractor", name: string, wallet: string | null) => {
    const id = crypto.randomUUID();
    await db.query(
      `INSERT INTO profiles (id, org_id, full_name, email, role, wallet_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, orgId, name, `${role}@t.com`, role, wallet]
    );
    const res = await db.query<Profile>("SELECT * FROM profiles WHERE id = $1", [id]);
    return res.rows[0];
  };

  const owner = await mk("owner", "O", Keypair.generate().publicKey.toBase58());
  const certifier = await mk("certifier", "C", null);
  const contractor = await mk("contractor", "K", Keypair.generate().publicKey.toBase58());

  const projectId = `prj_${crypto.randomBytes(8).toString("hex")}`;
  await db.query(
    `INSERT INTO projects (id, org_id, name, code, owner_id, certifier_id, contractor_id, contract_value_usdc)
     VALUES ($1, $2, 'Test Project', 'TP-01', $3, $4, $5, 1000)`,
    [projectId, orgId, owner.id, certifier.id, contractor.id]
  );
  const project = (await db.query<Project>("SELECT * FROM projects WHERE id = $1", [projectId]))
    .rows[0];

  const milestoneId = `mil_${crypto.randomBytes(8).toString("hex")}`;
  await db.query(
    `INSERT INTO milestones (id, project_id, sequence, title, scope, payout_amount_usdc)
     VALUES ($1, $2, 1, 'M1', 'scope', 100)`,
    [milestoneId, projectId]
  );
  const milestone = (
    await db.query<Milestone>("SELECT * FROM milestones WHERE id = $1", [milestoneId])
  ).rows[0];

  return { org_id: orgId, owner, certifier, contractor, project, milestone };
}

export function approvalProof(milestoneId: string): OnChainApprovalProof {
  return {
    txSignature: `APPROVAL_SIG_${crypto.randomBytes(8).toString("hex")}`,
    approvalPda: `approval_pda_${milestoneId}`,
    network: "solana-devnet",
    recordedAt: new Date().toISOString(),
  };
}
