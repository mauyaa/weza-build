import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { env } from "./env";
import {
  getMilestone,
  getProject,
  getSubmission,
  listVersions,
  type OnChainApprovalProof,
} from "./repo";
import { buildMemoInstruction, explorerUrl, getSolanaConnection, loadSolanaTreasury, sendTreasuryTransaction } from "./solana";
import type { Profile } from "./types";

export const WEZA_APPROVAL_PROGRAM_ID = new PublicKey(
  env.wezaApprovalProgramId()
);

export interface OnChainApprovalArgs {
  projectId: string;
  projectCode: string;
  milestoneId: string;
  milestoneSequence: number;
  submissionId: string;
  version: number;
  fileSha256: string;
  amountUsdc: number;
  certifierProfileId: string;
  certifierWallet?: string | null;
}

export interface OnChainApprovalResult {
  txSignature: string;
  network: string;
  confirmed: boolean;
  explorerUrl: string;
  approvalPda: string;
  programId: string;
}

export function approvalPda(milestoneId: string): string {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("weza"), Buffer.from("approval"), Buffer.from(milestoneId)],
    WEZA_APPROVAL_PROGRAM_ID
  );
  return pda.toBase58();
}

export function approvalProgramStatus() {
  return {
    programId: WEZA_APPROVAL_PROGRAM_ID.toBase58(),
    network: `solana-${env.solanaCluster()}`,
    mode: env.allowMockSolana() ? "mock" : "anchor-pda",
    note: "Approval is recorded by the WEZA Anchor program; payout checks the PDA account before USDC can move.",
  };
}

function encodeAnchorString(value: string): Buffer {
  const raw = Buffer.from(value, "utf8");
  const len = Buffer.alloc(4);
  len.writeUInt32LE(raw.length, 0);
  return Buffer.concat([len, raw]);
}

function approveMilestoneDiscriminator(): Buffer {
  // sha256("global:approve_milestone").slice(0, 8)
  return Buffer.from([37, 11, 194, 224, 62, 255, 234, 245]);
}

function buildApproveMilestoneInstruction(args: {
  projectId: string;
  milestoneId: string;
  approvalPda: PublicKey;
  certifier: PublicKey;
}): TransactionInstruction {
  return new TransactionInstruction({
    programId: WEZA_APPROVAL_PROGRAM_ID,
    keys: [
      { pubkey: args.approvalPda, isSigner: false, isWritable: true },
      { pubkey: args.certifier, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([
      approveMilestoneDiscriminator(),
      encodeAnchorString(args.projectId),
      encodeAnchorString(args.milestoneId),
    ]),
  });
}

export async function recordMilestoneApproval(args: OnChainApprovalArgs): Promise<OnChainApprovalResult> {
  const pda = approvalPda(args.milestoneId);
  const memo = JSON.stringify({
    app: "weza-build",
    kind: "milestone_approval",
    v: 1,
    project: args.projectCode,
    project_id: args.projectId,
    milestone: args.milestoneSequence,
    milestone_id: args.milestoneId,
    submission_id: args.submissionId,
    version: args.version,
    file_sha256: args.fileSha256,
    amount_usdc: args.amountUsdc,
    certifier: args.certifierWallet ?? args.certifierProfileId,
  });

  if (env.allowMockSolana()) {
    const sig = `MOCK_APPROVAL_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    void memo;
    return {
      txSignature: sig,
      network: "solana-devnet-mock",
      confirmed: true,
      explorerUrl: explorerUrl(sig),
      approvalPda: pda,
      programId: WEZA_APPROVAL_PROGRAM_ID.toBase58(),
    };
  }

  const approvalPk = new PublicKey(pda);
  const certifier = loadSolanaTreasury().publicKey;
  const signature = await sendTreasuryTransaction(
    buildApproveMilestoneInstruction({
      projectId: args.projectId,
      milestoneId: args.milestoneId,
      approvalPda: approvalPk,
      certifier,
    }),
    buildMemoInstruction(memo).ix
  );
  const account = await getSolanaConnection().getAccountInfo(approvalPk, "confirmed");
  if (!account) {
    throw new Error(`WEZA approval PDA ${pda} was not created by the Anchor program`);
  }
  return {
    txSignature: signature,
    network: `solana-${env.solanaCluster()}`,
    confirmed: true,
    explorerUrl: explorerUrl(signature),
    approvalPda: pda,
    programId: WEZA_APPROVAL_PROGRAM_ID.toBase58(),
  };
}

export async function recordMilestoneApprovalProof({
  submissionId,
  certifier,
}: {
  submissionId: string;
  certifier: Profile;
}): Promise<OnChainApprovalProof> {
  const submission = await getSubmission(submissionId);
  if (!submission) throw new Error("Submission not found for on-chain approval");
  const milestone = (await getMilestone(submission.milestone_id))!;
  const project = (await getProject(milestone.project_id))!;
  const latest = (await listVersions(submission.id)).find(
    (v) => v.version === submission.current_version
  );
  if (!latest) throw new Error("Submission version not found for on-chain approval");

  const result = await recordMilestoneApproval({
    projectId: project.id,
    projectCode: project.code,
    milestoneId: milestone.id,
    milestoneSequence: milestone.sequence,
    submissionId: submission.id,
    version: submission.current_version,
    fileSha256: latest.file_sha256,
    amountUsdc: Number(milestone.payout_amount_usdc),
    certifierProfileId: certifier.id,
    certifierWallet: certifier.wallet_address,
  });

  return {
    txSignature: result.txSignature,
    approvalPda: result.approvalPda,
    network: result.network,
    recordedAt: new Date().toISOString(),
  };
}

