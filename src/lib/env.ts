/**
 * Centralised env access. Fail loudly in production if required values are
 * missing; fall back to sensible defaults in development/test only.
 */

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing required env var: ${name}`);
    }
    return "";
  }
  return v;
}

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  databaseUrl: () => required("DATABASE_URL"),
  solanaRpcUrl: () => process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  solanaTreasuryKeypair: () => process.env.SOLANA_TREASURY_KEYPAIR || "",
  solanaCluster: () => process.env.SOLANA_CLUSTER || "devnet",
  isProduction: () => process.env.NODE_ENV === "production",
  allowMockSolana: () =>
    process.env.NODE_ENV !== "production" && process.env.WEZA_MOCK_SOLANA === "1",
  storageBucket: () => process.env.WEZA_STORAGE_BUCKET || "submissions",
};
