# Superteam Agentic Engineering Grant Brief

## Accurate project summary

WEZA is a Solana-backed construction milestone approval-to-payout platform for emerging markets, starting with Kenya.

Today, contractors submit milestone evidence, certifiers review and approve an exact submission version, and project owners trigger a Solana devnet USDC proof transaction. WEZA records the confirmed transaction signature, Explorer link, milestone, submission, approver, and audit history.

The live MVP is available at [https://weza-build.vercel.app](https://weza-build.vercel.app).

## What is shipped today

- Contractor submission and resubmission workflow
- Certifier approve, reject, and request-revision actions
- Owner-only payout after certifier approval
- Solana devnet USDC `TransferChecked` transaction with a Memo instruction
- Full transaction signature and milestone/payment audit trail
- Duplicate payout prevention and failed-payout recovery
- Next.js, TypeScript, Supabase, Solana Web3.js, and SPL Token

## What is not shipped yet

- AI milestone verification agent
- Anchor smart contract
- Owner-funded on-chain escrow
- Automatic payout release
- NestJS backend

These are the proposed grant-funded next phase, not current product claims.

## Grant-funded next phase

The grant will fund an AI coding subscription used to build and harden:

1. An AI milestone verification agent that evaluates submitted photos, reports, and project requirements, then produces a structured recommendation with evidence and confidence.
2. A human-in-the-loop certifier review layer that keeps final approval accountable.
3. An audited Anchor escrow program that releases owner-funded milestone escrow only after the required approval policy is satisfied.
4. Agent-to-contract integration tests, security review, monitoring, and a production pilot workflow.

## Prompt for solana.new

> Help me apply for the Superteam Agentic Engineering Grant.
>
> My project is WEZA, a live Solana-backed construction milestone approval-to-payout platform for emerging markets, starting with Kenya. Construction clients and contractors often lack a clear, auditable link between completed work, professional approval, and payment. This contributes to disputes, fraud, delayed payments, and abandoned projects.
>
> WEZA's shipped MVP lets contractors submit milestone evidence, certifiers approve, reject, or request revisions on an exact submission version, and project owners trigger a Solana devnet USDC proof transaction only after approval. WEZA records the confirmed Solana transaction signature, Explorer link, approval context, and milestone/payment audit trail.
>
> The live MVP is at https://weza-build.vercel.app and the code is at https://github.com/mauyaa/weza-build. The current stack is TypeScript, Next.js, Supabase, Solana Web3.js, and SPL Token. The project was submitted to the Colosseum Frontier Hackathon.
>
> This grant will fund an AI coding subscription to ship the next phase: an AI milestone verification agent that reviews photos, reports, and milestone requirements; produces a structured evidence-based recommendation for the human certifier; and is safely wired to a new audited Anchor escrow program for policy-controlled payout release.
>
> Please help me write a technically credible application that clearly separates the live MVP from the grant-funded roadmap, explains why agentic engineering is necessary, defines measurable milestones, and avoids claiming that AI verification or Anchor escrow is already shipped.

## Suggested milestones

| Milestone | Deliverable | Proof |
| --- | --- | --- |
| 1. Verification schema | Structured milestone requirements, evidence inputs, confidence, and recommendation format | Versioned schema and automated tests |
| 2. AI verification agent | Agent reviews evidence and returns cited findings without making the final approval decision | Evaluation dataset, accuracy report, and failure cases |
| 3. Human approval policy | Certifier reviews agent findings and signs the final decision | Complete submit-to-approval audit trail |
| 4. Anchor escrow | Audited owner-funded milestone escrow with policy-controlled release | Devnet program, tests, program ID, and Explorer transactions |
| 5. Pilot readiness | Monitoring, security review, and design-partner workflow | Live pilot checklist and demo video |

## One-sentence pitch

WEZA turns construction milestone evidence into an auditable approval and verifiable Solana payout proof today, then uses the grant to add AI-assisted verification and audited on-chain escrow safely.
