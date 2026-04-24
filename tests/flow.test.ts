import { describe, expect, it } from "vitest";
import {
  addComment,
  decide,
  DomainError,
  getLatestPayout,
  getMilestone,
  submitPackage,
  triggerPayout,
} from "../src/lib/repo";
import { sha256 } from "../src/lib/ids";
import { approvalProof, seedFixture, type Fixture } from "./helpers";

function submit(milestoneId: string, actor: Fixture["contractor"], version: number) {
  return submitPackage({
    milestoneId,
    actor,
    title: `pkg v${version}`,
    note: "",
    fileName: `pkg-v${version}.pdf`,
    fileSize: 1234,
    fileSha256: sha256(`pkg-v${version}`),
  });
}

describe("approval-to-payout flow", () => {
  it("walks the full loop and stores tx signature", async () => {
    const fx = await seedFixture();

    const s1 = await submit(fx.milestone.id, fx.contractor, 1);
    expect(s1.submission.status).toBe("under_review");
    expect(s1.submission.current_version).toBe(1);
    expect((await getMilestone(fx.milestone.id))!.status).toBe("under_review");

    await addComment({ submissionId: s1.submission.id, actor: fx.certifier, body: "change X" });
    const d1 = await decide({
      submissionId: s1.submission.id,
      actor: fx.certifier,
      action: "request_revision",
      note: "fix X",
    });
    expect(d1.submission.status).toBe("revision_requested");

    const s2 = await submit(fx.milestone.id, fx.contractor, 2);
    expect(s2.submission.status).toBe("under_review");
    expect(s2.submission.current_version).toBe(2);

    const d2 = await decide({
      submissionId: s2.submission.id,
      actor: fx.certifier,
      action: "approve",
      note: "ok",
      onChainApproval: approvalProof(fx.milestone.id),
    });
    expect(d2.submission.status).toBe("approved");
    expect(d2.milestone.status).toBe("approved");
    expect(d2.milestone.payout_status).toBe("ready");
    expect(d2.payout?.status).toBe("ready");

    const mockSig = "TEST_SIG_" + Math.random().toString(36).slice(2);
    const result = await triggerPayout({
      milestoneId: fx.milestone.id,
      actor: fx.owner,
      runOnChain: async (args) => {
        expect(args.approvalPda).toBe(d2.milestone.approval_pda);
        expect(args.memo.approvalPda).toBe(d2.milestone.approval_pda);
        return { txSignature: mockSig, network: "solana-devnet", confirmed: true };
      },
    });
    expect(result.milestone.status).toBe("settled");
    expect(result.milestone.payout_status).toBe("confirmed");
    expect(result.payout.tx_signature).toBe(mockSig);
    expect(result.payout.status).toBe("confirmed");
  });

  it("blocks payout before approval", async () => {
    const fx = await seedFixture();
    await submit(fx.milestone.id, fx.contractor, 1);
    await expect(
      triggerPayout({
        milestoneId: fx.milestone.id,
        actor: fx.owner,
        runOnChain: async (_args) => ({ txSignature: "X", network: "n", confirmed: true }),
      })
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("requires on-chain approval proof before approval unlocks payout", async () => {
    const fx = await seedFixture();
    const s1 = await submit(fx.milestone.id, fx.contractor, 1);
    await expect(
      decide({
        submissionId: s1.submission.id,
        actor: fx.certifier,
        action: "approve",
        note: "",
      })
    ).rejects.toMatchObject({ code: "approval_not_onchain" });
  });

  it("forbids contractor triggering a payout", async () => {
    const fx = await seedFixture();
    const s1 = await submit(fx.milestone.id, fx.contractor, 1);
    await decide({
      submissionId: s1.submission.id,
      actor: fx.certifier,
      action: "approve",
      note: "",
      onChainApproval: approvalProof(fx.milestone.id),
    });
    await expect(
      triggerPayout({
        milestoneId: fx.milestone.id,
        actor: fx.contractor,
        runOnChain: async (_args) => ({ txSignature: "X", network: "n", confirmed: true }),
      })
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("is idempotent on duplicate approve and duplicate payout trigger", async () => {
    const fx = await seedFixture();
    const s1 = await submit(fx.milestone.id, fx.contractor, 1);
    await decide({
      submissionId: s1.submission.id,
      actor: fx.certifier,
      action: "approve",
      note: "",
      onChainApproval: approvalProof(fx.milestone.id),
    });
    const duplicate = await decide({
      submissionId: s1.submission.id,
      actor: fx.certifier,
      action: "approve",
      note: "",
    });
    expect(duplicate.submission.status).toBe("approved");

    let calls = 0;
    const run = async () => {
      calls += 1;
      return { txSignature: "SIG_ONCE", network: "solana-devnet", confirmed: true };
    };
    await triggerPayout({ milestoneId: fx.milestone.id, actor: fx.owner, runOnChain: run });
    await triggerPayout({ milestoneId: fx.milestone.id, actor: fx.owner, runOnChain: run });
    expect(calls).toBe(1);
    const payout = (await getLatestPayout(fx.milestone.id))!;
    expect(payout.tx_signature).toBe("SIG_ONCE");
  });

  it("blocks a contractor from submitting while a version is under review", async () => {
    const fx = await seedFixture();
    await submit(fx.milestone.id, fx.contractor, 1);
    await expect(submit(fx.milestone.id, fx.contractor, 2)).rejects.toBeInstanceOf(DomainError);
  });

  it("blocks submissions after approval", async () => {
    const fx = await seedFixture();
    const s1 = await submit(fx.milestone.id, fx.contractor, 1);
    await decide({
      submissionId: s1.submission.id,
      actor: fx.certifier,
      action: "approve",
      note: "",
      onChainApproval: approvalProof(fx.milestone.id),
    });
    await expect(submit(fx.milestone.id, fx.contractor, 2)).rejects.toBeInstanceOf(DomainError);
  });

  it("records payout failure and keeps milestone recoverable", async () => {
    const fx = await seedFixture();
    const s1 = await submit(fx.milestone.id, fx.contractor, 1);
    await decide({
      submissionId: s1.submission.id,
      actor: fx.certifier,
      action: "approve",
      note: "",
      onChainApproval: approvalProof(fx.milestone.id),
    });
    const result = await triggerPayout({
      milestoneId: fx.milestone.id,
      actor: fx.owner,
      runOnChain: async (_args) => {
        throw new Error("RPC down");
      },
    });
    expect(result.payout.status).toBe("failed");
    expect(result.milestone.status).toBe("approved");
    expect(result.milestone.payout_status).toBe("failed");

    const retry = await triggerPayout({
      milestoneId: fx.milestone.id,
      actor: fx.owner,
      runOnChain: async (_args) => ({ txSignature: "RETRY_SIG", network: "solana-devnet", confirmed: true }),
    });
    expect(retry.milestone.status).toBe("settled");
    expect(retry.payout.tx_signature).toBe("RETRY_SIG");
  });
});
