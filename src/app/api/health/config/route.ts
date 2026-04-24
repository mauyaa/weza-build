import { ok } from "@/lib/api";
import { env } from "@/lib/env";

function present(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export async function GET() {
  const checks = {
    supabase_server: env.isSupabaseServerReady(),
    supabase_service_role: present("SUPABASE_SERVICE_ROLE_KEY"),
    database_url: present("DATABASE_URL"),
    solana_rpc_url: present("SOLANA_RPC_URL"),
    solana_treasury_keypair: present("SOLANA_TREASURY_KEYPAIR"),
    public_signup_enabled: env.allowPublicSignup(),
    mock_solana_enabled: env.allowMockSolana(),
  };
  const missing = Object.entries(checks)
    .filter(([key, value]) => !value && key !== "public_signup_enabled" && key !== "mock_solana_enabled")
    .map(([key]) => key);

  return ok({
    ready: missing.length === 0,
    node_env: process.env.NODE_ENV ?? "development",
    solana_cluster: env.solanaCluster(),
    storage_bucket: env.storageBucket(),
    checks,
    missing,
  });
}
