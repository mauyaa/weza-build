import {
  AddressLookupTableAccount,
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
} from "@solana/web3.js";
import * as multisig from "@sqds/multisig";
import { env } from "./env";
import { getSolanaConnection, loadSolanaTreasury } from "./solana";

const { Permission, Permissions } = multisig.types;

export interface SquadsPayoutProposal {
  multisigPda: string;
  vaultPda: string;
  transactionIndex: bigint;
  createSignature: string;
  proposalSignature: string;
  ownerApprovalSignature: string;
  certifierApprovalSignature: string | null;
  executeSignature: string | null;
}

function loadKeypair(raw: string, name: string): Keypair {
  if (!raw) throw new Error(`${name} is not configured`);
  try {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw) as number[]));
  } catch (err) {
    throw new Error(`${name} is not a valid JSON secret-key array: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function isSquadsConfigured(): boolean {
  return env.requireSquadsPayout() && !env.allowMockSolana();
}

export async function createSquadsPayoutProposal({
  instructions,
  memo,
}: {
  instructions: TransactionInstruction[];
  memo: string;
}): Promise<SquadsPayoutProposal> {
  const connection = getSolanaConnection();
  const owner = loadSolanaTreasury();
  const certifier = loadKeypair(env.solanaCertifierKeypair(), "SOLANA_CERTIFIER_KEYPAIR");
  const createKey = Keypair.generate();
  const [multisigPda] = multisig.getMultisigPda({ createKey: createKey.publicKey });
  const [vaultPda] = multisig.getVaultPda({ multisigPda, index: 0 });
  const memberPermissions = Permissions.fromPermissions([
    Permission.Initiate,
    Permission.Vote,
    Permission.Execute,
  ]);

  await multisig.rpc.multisigCreateV2({
    connection,
    treasury: owner.publicKey,
    createKey,
    creator: owner,
    multisigPda,
    configAuthority: null,
    threshold: 2,
    members: [
      { key: owner.publicKey, permissions: memberPermissions },
      { key: certifier.publicKey, permissions: memberPermissions },
    ],
    timeLock: 0,
    rentCollector: null,
    memo: `${memo}:multisig-create`,
  });

  const transactionIndex = 1n;
  const blockhash = (await connection.getLatestBlockhash()).blockhash;
  const transactionMessage = new TransactionMessage({
    payerKey: vaultPda,
    recentBlockhash: blockhash,
    instructions,
  });

  const createSignature = await multisig.rpc.vaultTransactionCreate({
    connection,
    feePayer: owner,
    multisigPda,
    transactionIndex,
    creator: owner.publicKey,
    rentPayer: owner.publicKey,
    vaultIndex: 0,
    ephemeralSigners: 0,
    transactionMessage,
    addressLookupTableAccounts: [] as AddressLookupTableAccount[],
    memo: `${memo}:payout`,
    signers: [owner],
  });
  const proposalSignature = await multisig.rpc.proposalCreate({
    connection,
    feePayer: owner,
    creator: owner,
    rentPayer: owner,
    multisigPda,
    transactionIndex,
    isDraft: false,
  });
  const ownerApprovalSignature = await multisig.rpc.proposalApprove({
    connection,
    feePayer: owner,
    member: owner,
    multisigPda,
    transactionIndex,
    memo: `${memo}:owner-approve`,
  });
  const certifierApprovalSignature = await multisig.rpc.proposalApprove({
    connection,
    feePayer: owner,
    member: certifier,
    multisigPda,
    transactionIndex,
    memo: `${memo}:certifier-approve`,
  });
  const executeSignature = await multisig.rpc.vaultTransactionExecute({
    connection,
    feePayer: owner,
    multisigPda,
    transactionIndex,
    member: owner.publicKey,
  });

  return {
    multisigPda: multisigPda.toBase58(),
    vaultPda: vaultPda.toBase58(),
    transactionIndex,
    createSignature,
    proposalSignature,
    ownerApprovalSignature,
    certifierApprovalSignature,
    executeSignature,
  };
}

export async function executeOrCreateSquadsPayout({
  transferIx,
  memoIx,
  memo,
}: {
  transferIx: TransactionInstruction;
  memoIx: TransactionInstruction;
  memo: string;
  approvalPda: PublicKey;
  amountAtomic: string;
}): Promise<{
  txSignature: string;
  network: string;
  confirmed: boolean;
  approvalTxSignature: string | null;
  squads: SquadsPayoutProposal;
}> {
  const squads = await createSquadsPayoutProposal({
    instructions: [memoIx, transferIx],
    memo,
  });
  if (!squads.executeSignature) {
    throw new Error("Squads proposal was created but not executed");
  }
  return {
    txSignature: squads.executeSignature,
    network: `solana-${env.solanaCluster()}-squads-v4`,
    confirmed: true,
    approvalTxSignature: squads.certifierApprovalSignature,
    squads,
  };
}
