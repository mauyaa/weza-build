import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import { env } from "./env";
import { executeOrCreateSquadsPayout, isSquadsConfigured } from "./squads";

/**
 * WEZA Build pays contractors on Solana devnet in devnet USDC. The on-chain
 * footprint is narrow on purpose:
 *
 *   1. A devnet USDC transfer (6 decimals, Circle-published mint) from the
 *      treasury's Associated Token Account (ATA) to the contractor's ATA.
 *   2. A Memo Program instruction in the same transaction carrying a short
 *      JSON blob with the project code, milestone sequence, approver id,
 *      and the off-chain milestone/submission ids.
 *
 * The memo gives an auditor looking at Solana Explorer enough context to
 * know which real-world approval this on-chain transfer corresponds to —
 * without putting drawings, comments, or revisions on chain.
 */

// Circle's devnet USDC mint — https://developers.circle.com/stablecoins/docs/usdc-on-test-networks
const DEVNET_USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const USDC_DECIMALS = 6;

export interface OnChainPayoutArgs {
  amountUsdc: number;
  recipient: string;
  approvalPda: string;
  memo: {
    projectCode: string;
    milestoneSequence: number;
    milestoneId: string;
    submissionId?: string | null;
    approvedBy: string;
    approvalPda?: string | null;
  };
}

export interface OnChainPayoutResult {
  txSignature: string;
  network: string;
  confirmed: boolean;
  explorerUrl: string;
  asset: "USDC";
  amountAtomic: string;
  memo: string;
  approvalTxSignature?: string | null;
  squadsMultisig?: string | null;
  squadsProposalTx?: string | null;
}

export function explorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${env.solanaCluster()}`;
}

export function explorerAddress(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=${env.solanaCluster()}`;
}

function loadTreasury(): Keypair {
  const raw = env.solanaTreasuryKeypair();
  if (!raw) {
    throw new Error(
      "SOLANA_TREASURY_KEYPAIR is not configured. In production this env var must hold " +
        "a JSON array secret key for a funded devnet keypair with SOL for fees and " +
        "devnet USDC for payouts. Create one with `solana-keygen new`, fund with " +
        "`solana airdrop 2 <addr> --url devnet`, then mint devnet USDC from " +
        "https://faucet.circle.com."
    );
  }
  try {
    const parsed = JSON.parse(raw) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(parsed));
  } catch (err) {
    throw new Error(
      `SOLANA_TREASURY_KEYPAIR is set but not a valid JSON secret-key array: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

let _conn: Connection | null = null;
function connection(): Connection {
  if (_conn) return _conn;
  _conn = new Connection(env.solanaRpcUrl(), "confirmed");
  return _conn;
}

export function getSolanaConnection(): Connection {
  return connection();
}

export function loadSolanaTreasury(): Keypair {
  return loadTreasury();
}

export function buildMemoInstruction(
  payload: OnChainPayoutArgs["memo"] | string
): { ix: TransactionInstruction; memo: string } {
  const memo = typeof payload === "string" ? payload : JSON.stringify({
    app: "weza-build",
    v: 1,
    project: payload.projectCode,
    milestone: payload.milestoneSequence,
    milestone_id: payload.milestoneId,
    submission_id: payload.submissionId ?? null,
    approved_by: payload.approvedBy,
    approval_pda: payload.approvalPda ?? null,
  });
  const ix = new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, "utf8"),
  });
  return { ix, memo };
}

export async function sendTreasuryTransaction(...instructions: TransactionInstruction[]): Promise<string> {
  const tx = new Transaction().add(...instructions);
  return sendAndConfirmTransaction(connection(), tx, [loadTreasury()], {
    commitment: "confirmed",
  });
}

export interface TreasuryStatus {
  publicKey: string;
  lamports: number;
  rpcUrl: string;
  cluster: string;
  usdcAta: string | null;
  usdcAtomic: string;
  usdcUi: number;
  usdcMint: string;
}

export async function treasuryStatus(): Promise<TreasuryStatus> {
  const kp = loadTreasury();
  const conn = connection();
  const lamports = await conn.getBalance(kp.publicKey);
  const ata = await getAssociatedTokenAddress(DEVNET_USDC_MINT, kp.publicKey);
  let usdcAtomic = "0";
  try {
    const acct = await getAccount(conn, ata);
    usdcAtomic = acct.amount.toString();
  } catch (err) {
    if (!(err instanceof TokenAccountNotFoundError)) throw err;
  }
  return {
    publicKey: kp.publicKey.toBase58(),
    lamports,
    rpcUrl: env.solanaRpcUrl(),
    cluster: env.solanaCluster(),
    usdcAta: ata.toBase58(),
    usdcAtomic,
    usdcUi: Number(usdcAtomic) / 10 ** USDC_DECIMALS,
    usdcMint: DEVNET_USDC_MINT.toBase58(),
  };
}

export async function performDevnetPayoutProof(args: OnChainPayoutArgs): Promise<OnChainPayoutResult> {
  if (env.allowMockSolana()) {
    const sig = `MOCK_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const { memo } = buildMemoInstruction(args.memo);
    return {
      txSignature: sig,
      network: "solana-devnet-mock",
      confirmed: true,
      explorerUrl: explorerUrl(sig),
      asset: "USDC",
      amountAtomic: String(Math.round(args.amountUsdc * 10 ** USDC_DECIMALS)),
      memo,
    };
  }

  const conn = connection();
  const payer = loadTreasury();

  let recipientPk: PublicKey;
  try {
    recipientPk = new PublicKey(args.recipient);
  } catch {
    throw new Error(`Recipient ${args.recipient} is not a valid Solana public key`);
  }

  // Treasury SOL sanity (fees + any ATA rent).
  const balance = await conn.getBalance(payer.publicKey).catch((err) => {
    throw new Error(
      `Solana RPC unreachable (${env.solanaRpcUrl()}): ${err instanceof Error ? err.message : String(err)}`
    );
  });
  if (balance < 10_000) {
    throw new Error(
      `Treasury ${payer.publicKey.toBase58()} has only ${balance} lamports; fund it with ` +
        `\`solana airdrop 1 ${payer.publicKey.toBase58()} --url ${env.solanaCluster()}\``
    );
  }

  // Treasury USDC ATA.
  let treasuryAta;
  try {
    treasuryAta = await getOrCreateAssociatedTokenAccount(conn, payer, DEVNET_USDC_MINT, payer.publicKey);
  } catch (err) {
    throw new Error(
      `Treasury USDC ATA unreachable: ${err instanceof Error ? err.message : String(err)}. ` +
        `Mint devnet USDC at https://faucet.circle.com to the treasury address.`
    );
  }
  const atomicAmount = BigInt(Math.round(args.amountUsdc * 10 ** USDC_DECIMALS));
  if (BigInt(treasuryAta.amount) < atomicAmount) {
    throw new Error(
      `Treasury USDC underfunded: has ${treasuryAta.amount}, needs ${atomicAmount} atomic units. ` +
        `Top up at https://faucet.circle.com for mint ${DEVNET_USDC_MINT.toBase58()}.`
    );
  }

  const recipientAta = await getOrCreateAssociatedTokenAccount(
    conn,
    payer,
    DEVNET_USDC_MINT,
    recipientPk
  );

  const { ix: memoIx, memo } = buildMemoInstruction(args.memo);
  let approvalPk: PublicKey;
  try {
    approvalPk = new PublicKey(args.approvalPda);
  } catch {
    throw new Error(`Approval PDA ${args.approvalPda} is not a valid Solana public key`);
  }
  const approvalAccount = await conn.getAccountInfo(approvalPk);
  if (!approvalAccount) {
    throw new Error(`Approval PDA ${approvalPk.toBase58()} does not exist; payout is locked`);
  }
  const transferIx = createTransferCheckedInstruction(
    treasuryAta.address,
    DEVNET_USDC_MINT,
    recipientAta.address,
    payer.publicKey,
    atomicAmount,
    USDC_DECIMALS,
    [],
    TOKEN_PROGRAM_ID
  );
  transferIx.keys.push({ pubkey: approvalPk, isSigner: false, isWritable: false });

  if (isSquadsConfigured()) {
    const result = await executeOrCreateSquadsPayout({
      transferIx,
      memoIx,
      memo,
      approvalPda: approvalPk,
      amountAtomic: atomicAmount.toString(),
    });
    return {
      txSignature: result.txSignature,
      network: result.network,
      confirmed: result.confirmed,
      explorerUrl: explorerUrl(result.txSignature),
      asset: "USDC",
      amountAtomic: atomicAmount.toString(),
      memo,
      approvalTxSignature: result.approvalTxSignature,
    };
  }

  const tx = new Transaction().add(memoIx, transferIx);
  const signature = await sendAndConfirmTransaction(conn, tx, [payer], {
    commitment: "confirmed",
  });
  return {
    txSignature: signature,
    network: `solana-${env.solanaCluster()}`,
    confirmed: true,
    explorerUrl: explorerUrl(signature),
    asset: "USDC",
    amountAtomic: atomicAmount.toString(),
    memo,
  };
}

export { DEVNET_USDC_MINT };
// Re-export for tests/scripts that want to read the mint address.
export const USDC_DEVNET_MINT_BASE58 = DEVNET_USDC_MINT.toBase58();
// Ensure SystemProgram import isn't tree-shaken — kept for future SOL-leg fallback.
void SystemProgram;
