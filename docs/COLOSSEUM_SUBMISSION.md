# Colosseum submission description

Kenya's construction contractors wait 60-90 days for payment because certified completion is still proven through paper certificates, email threads, and WhatsApp messages that counterparties can dispute or ignore.

WEZA Build is an approval-to-payout platform where contractors submit milestone evidence, certifiers approve completed work, and owners release USDC payouts from one role-based workflow.

Solana is load-bearing because the certifier approval is an on-chain approval record from a custom Anchor program and the payout path requires that approval PDA before funds can move; the payout is coordinated through a Squads 2-of-2 Owner + Certifier multisig rather than a single backend signer.

The beachhead is East African construction, starting with Kenya's $15B+ sector where contractors face delayed public and private payments, dollar-linked material costs, and limited access to working capital.

WEZA is live on Vercel with Supabase Auth/Postgres/RLS, real Solana devnet transactions, a full Owner/Certifier/Contractor state machine, a guided judge demo, and Explorer links for both approval and payout proof.

Remove Solana and the approval cannot happen. That's the point.
