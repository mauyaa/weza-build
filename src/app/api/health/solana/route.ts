import { fail, ok } from "@/lib/api";
import { env } from "@/lib/env";
import { explorerAddress, treasuryStatus } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function GET() {
  if (env.allowMockSolana()) {
    return ok({
      mode: "mock",
      rpcUrl: env.solanaRpcUrl(),
      cluster: env.solanaCluster(),
      note: "WEZA_MOCK_SOLANA=1 in non-production; payouts return a synthetic signature.",
    });
  }
  try {
    const status = await treasuryStatus();
    return ok({
      mode: "live",
      ...status,
      treasury_explorer: explorerAddress(status.publicKey),
      usdc_ata_explorer: status.usdcAta ? explorerAddress(status.usdcAta) : null,
      usdc_mint_explorer: explorerAddress(status.usdcMint),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fail(message, "treasury_unavailable", 503);
  }
}
