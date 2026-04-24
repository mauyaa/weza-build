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
  /**
   * Server-only Supabase URL. Prefer `SUPABASE_URL` on Vercel so the value is
   * read at runtime; `NEXT_PUBLIC_*` is inlined at build time and can be empty
   * if env vars were added after the first deploy.
   */
  supabaseUrlForServer: () => {
    const v = process.env.SUPABASE_URL?.trim();
    if (v) return v;
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  /**
   * Server-only anon key. Prefer `SUPABASE_ANON_KEY` on Vercel (same value as
   * the publishable anon key) for runtime configuration.
   */
  supabaseAnonKeyForServer: () => {
    const v = process.env.SUPABASE_ANON_KEY?.trim();
    if (v) return v;
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
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
