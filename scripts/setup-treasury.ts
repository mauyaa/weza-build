/* eslint-disable no-console */
/**
 * Generates a fresh WEZA devnet treasury keypair, airdrops 2 SOL to it,
 * prints the JSON secret-key array to paste into .env.local as
 * SOLANA_TREASURY_KEYPAIR, and tells you what to do on the Circle faucet.
 */
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddress,
  TokenAccountNotFoundError,
} from "@solana/spl-token";
import fs from "node:fs";
import path from "node:path";

const RPC = "https://api.devnet.solana.com";
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const OUT_PATH = path.join(process.cwd(), ".weza-treasury.json");

async function main() {
  const conn = new Connection(RPC, "confirmed");

  let kp: Keypair;
  let reused = false;
  if (fs.existsSync(OUT_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(OUT_PATH, "utf8"));
      kp = Keypair.fromSecretKey(Uint8Array.from(raw));
      reused = true;
      console.log(`Reusing existing treasury keypair from ${OUT_PATH}`);
    } catch {
      kp = Keypair.generate();
    }
  } else {
    kp = Keypair.generate();
  }

  const pubkey = kp.publicKey.toBase58();
  const secretJson = JSON.stringify(Array.from(kp.secretKey));

  if (!reused) {
    fs.writeFileSync(OUT_PATH, secretJson + "\n", { mode: 0o600 });
    console.log(`Saved keypair to ${OUT_PATH} (gitignored)`);
  }

  console.log("");
  console.log("Treasury public key:", pubkey);
  console.log("RPC:", RPC);
  console.log("");

  const balanceBefore = await conn.getBalance(kp.publicKey);
  console.log(`Current balance: ${(balanceBefore / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

  if (balanceBefore < 0.5 * LAMPORTS_PER_SOL) {
    console.log("Requesting airdrop of 2 SOL...");
    try {
      const sig = await conn.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL);
      console.log("Airdrop signature:", sig);
      console.log("Waiting for confirmation (up to 60s)...");
      const latest = await conn.getLatestBlockhash();
      await conn.confirmTransaction({ signature: sig, ...latest }, "confirmed");
      const balanceAfter = await conn.getBalance(kp.publicKey);
      console.log(`New balance: ${(balanceAfter / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    } catch (e: unknown) {
      console.warn(
        `Airdrop failed (public devnet rate-limits are strict): ${
          e instanceof Error ? e.message : String(e)
        }`
      );
      console.warn(
        `Manually airdrop via https://faucet.solana.com (paste ${pubkey})`
      );
    }
  } else {
    console.log("Balance already sufficient; skipping airdrop.");
  }

  const ata = await getAssociatedTokenAddress(USDC_MINT, kp.publicKey);
  console.log("");
  console.log("USDC Associated Token Account (ATA):", ata.toBase58());
  try {
    const acct = await getAccount(conn, ata);
    console.log(`USDC balance: ${Number(acct.amount) / 1e6} devUSDC`);
  } catch (e) {
    if (e instanceof TokenAccountNotFoundError) {
      console.log(
        "USDC ATA does not exist yet — it will be auto-created on first Circle faucet mint."
      );
    }
  }

  console.log("");
  console.log("=".repeat(70));
  console.log("NEXT STEPS");
  console.log("=".repeat(70));
  console.log("");
  console.log("1. Mint devnet USDC to the treasury:");
  console.log("   https://faucet.circle.com");
  console.log("   - Pick 'Solana Devnet'");
  console.log("   - Paste wallet:", pubkey);
  console.log("   - Request the max (typically 10 USDC per request)");
  console.log("");
  console.log("2. Paste the following line into .env.local (replacing the existing SOLANA_TREASURY_KEYPAIR line):");
  console.log("");
  console.log(`SOLANA_TREASURY_KEYPAIR=${secretJson}`);
  console.log("");
  console.log("3. Remove or comment out the WEZA_MOCK_SOLANA line in .env.local.");
  console.log("");
  console.log("4. Restart `npm run dev`.");
  console.log("");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
