import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
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
    if (result.payout.status === "failed") {
      return fail(
        result.payout.failure_reason || "Payout failed before Solana confirmation",
        "payout_failed",
        502,
        {
          payout_status: result.payout.status,
          milestone_status: result.milestone.status,
        }
      );
    }
    const inProgress = result.payout.status === "triggered" && !signature;
    return ok(
      {
        ...result,
        explorer_url: signature ? explorerUrl(signature) : null,
      },
      inProgress ? "Payout already in progress" : "Payout confirmed on Solana devnet",
      inProgress ? "payout_in_progress" : "payout_ok"
    );
  } catch (err) {
    return handleDomain(err);
  }
}
