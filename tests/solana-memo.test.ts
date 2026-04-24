import { describe, expect, it } from "vitest";
import { decide, submitPackage, triggerPayout } from "../src/lib/repo";
import { sha256 } from "../src/lib/ids";
import { seedFixture } from "./helpers";

describe("on-chain payout envelope", () => {
  it("passes project/milestone/submission metadata into runOnChain memo", async () => {
    const fx = await seedFixture();
    const s1 = await submitPackage({
      milestoneId: fx.milestone.id,
      actor: fx.contractor,
      title: "pkg",
      note: "",
      fileName: "pkg.pdf",
      fileSize: 1,
      fileSha256: sha256("pkg"),
    });
    await decide({
      submissionId: s1.submission.id,
      actor: fx.certifier,
      action: "approve",
      note: "",
    });

    let captured: Parameters<Parameters<typeof triggerPayout>[0]["runOnChain"]>[0] | null = null;
    await triggerPayout({
      milestoneId: fx.milestone.id,
      actor: fx.owner,
      runOnChain: async (args) => {
        captured = args;
        return { txSignature: "SIG", network: "solana-devnet", confirmed: true };
      },
    });
    expect(captured).not.toBeNull();
    expect(captured!.amountUsdc).toBe(100);
    expect(captured!.recipient).toBe(fx.contractor.wallet_address);
    expect(captured!.memo.milestoneId).toBe(fx.milestone.id);
    expect(captured!.memo.milestoneSequence).toBe(1);
    expect(captured!.memo.projectCode).toBe(fx.project.code);
    expect(captured!.memo.approvedBy).toBe(fx.certifier.id);
    expect(captured!.memo.submissionId).toBe(s1.submission.id);
  });
});
