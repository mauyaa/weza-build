import { fail, ok } from "@/lib/api";
import { env } from "@/lib/env";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "SOLANA_TREASURY_KEYPAIR",
] as const;

const REQUIRED_TABLES = [
  "organizations",
  "profiles",
  "projects",
  "milestones",
  "submissions",
  "submission_versions",
  "review_comments",
  "approval_decisions",
  "payout_instructions",
  "audit_logs",
] as const;

function isSet(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

async function databaseStatus() {
  const tableNames = REQUIRED_TABLES.map((table) => `public.${table}`);
  const [connection, migrations, tables] = await Promise.all([
    query<{ ok: number }>("select 1 as ok"),
    query<{ count: string }>("select count(*)::text as count from schema_migrations"),
    query<{ rel: string }>(
      "select rel from unnest($1::text[]) as rel where to_regclass(rel) is not null",
      [tableNames]
    ),
  ]);

  const present = new Set(tables.rows.map((row) => row.rel.replace("public.", "")));
  const missingTables = REQUIRED_TABLES.filter((table) => !present.has(table));

  return {
    connected: connection.rows[0]?.ok === 1,
    migrationsApplied: Number(migrations.rows[0]?.count ?? 0),
    missingTables,
  };
}

export async function GET() {
  const envChecks = Object.fromEntries(REQUIRED_ENV.map((name) => [name, isSet(name)]));
  const aliasChecks = {
    SUPABASE_URL: isSet("SUPABASE_URL"),
    SUPABASE_ANON_KEY: isSet("SUPABASE_ANON_KEY"),
  };

  let db:
    | Awaited<ReturnType<typeof databaseStatus>>
    | { connected: false; migrationsApplied: 0; missingTables: readonly string[]; error: string };

  try {
    db = await databaseStatus();
  } catch (err) {
    db = {
      connected: false,
      migrationsApplied: 0,
      missingTables: REQUIRED_TABLES,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const checks = {
    nodeEnv: process.env.NODE_ENV || "development",
    env: envChecks,
    aliases: aliasChecks,
    supabaseServerReady: env.isSupabaseServerReady(),
    storageBucket: env.storageBucket(),
    solana: {
      rpcUrl: isSet("SOLANA_RPC_URL"),
      cluster: env.solanaCluster(),
      treasuryKeypair: isSet("SOLANA_TREASURY_KEYPAIR"),
      mockRequested: isSet("WEZA_MOCK_SOLANA"),
      mockAllowed: env.allowMockSolana(),
    },
    database: db,
  };

  const missingEnv = Object.entries(envChecks)
    .filter(([, present]) => !present)
    .map(([name]) => name);
  const healthy =
    missingEnv.length === 0 && db.connected && "missingTables" in db && db.missingTables.length === 0;

  if (!healthy) {
    return fail("Configuration health check failed", "config_unavailable", 503, {
      ...checks,
      missingEnv,
    });
  }

  return ok(checks);
}
