import { NextRequest } from "next/server";
import { ok } from "@/lib/api";
import { handleDomain, requireSession } from "@/lib/guard";
import { triggerPayout } from "@/lib/repo";
import { explorerUrl, performDevnetPayoutProof } from "@/lib/solana";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSession();
  if (!("profile" in guard)) return guard;
  try {
    const result = await triggerPayout({
      milestoneId: params.id,
      actor: guard.profile,
      runOnChain: performDevnetPayoutProof,
    });
    const signature = result.payout.tx_signature;
    return ok(
      {
        ...result,
        explorer_url: signature ? explorerUrl(signature) : null,
      },
      "Payout executed",
      "payout_ok"
    );
  } catch (err) {
    return handleDomain(err);
  }
}
