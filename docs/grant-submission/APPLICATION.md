# Superteam Agentic Engineering Grant Application

Submission link: https://superteam.fun/earn/grants/agentic-engineering

## Step 1: Basics

**Project Title**

> WEZA Build: AI-Assisted Construction Milestone Verification and Solana Escrow

**One Line Description**

> WEZA turns construction milestone evidence into human-approved, auditable Solana payouts, and will use this grant to add AI-assisted verification and an audited Anchor escrow program.

**TG username**

> REQUIRED BEFORE SUBMIT: t.me/<username>

**Wallet Address**

> REQUIRED BEFORE SUBMIT: <personal Solana wallet address for grant payout>

## Step 2: Details

**Project Details**

> Construction milestone payments often stall because completed work, professional approval, and payment are handled across disconnected email, WhatsApp, PDFs, and banking workflows. This creates disputes, weak auditability, delayed contractor payments, and abandoned projects.
>
> WEZA's live MVP already provides an approval-to-payout workflow. Contractors submit and resubmit milestone evidence; certifiers approve, reject, or request revisions on an exact submission version; and project owners trigger a Solana devnet USDC proof transaction only after approval. WEZA records the confirmed transaction signature, Explorer link, submission, approver, milestone, and payment audit history.
>
> The grant-funded phase is deliberately separate from the shipped MVP. It will add an AI milestone verification agent that reviews photos, reports, and structured milestone requirements, then returns cited findings, confidence, and a recommendation to a human certifier. The agent will never make the final professional approval decision. After the approval policy is hardened, WEZA will add and test an owner-funded Anchor escrow program for policy-controlled milestone release.
>
> Agentic engineering is necessary because this phase spans multimodal evidence analysis, schema design, evaluation datasets, failure-case testing, human-review UX, Anchor program development, security review, and end-to-end integration. The AI coding subscription will be used to build, test, audit, and document these components faster while retaining explicit human approval and deterministic payout controls.

**Target Deadline**

> July 31, 2026 at 11:59 PM Asia/Calcutta. This is an assumed six-week delivery target and should be confirmed before submission.

**Proof of Work**

> Live MVP: https://weza-build.vercel.app
>
> GitHub repository: https://github.com/mauyaa/weza-build
>
> GitHub profile: https://github.com/mauyaa
>
> The shipped Next.js, TypeScript, Supabase, Solana Web3.js, and SPL Token MVP includes contractor submission/resubmission, certifier approval/rejection/revision requests, owner-only payout after approval, Solana devnet USDC TransferChecked transactions with Memo instructions, full signature and Explorer links, milestone/payment audit history, duplicate payout prevention, and failed-payout recovery.
>
> Recent repository history includes environment configuration hardening, payout-proof visibility, auth/session fixes, deployment readiness, health checks, and the initial complete Supabase plus Solana payout implementation. Automated tests cover state-machine rules, authorization, database behavior, Solana memo metadata, payout idempotency, and failure recovery.
>
> WEZA was submitted to the Colosseum Frontier Hackathon. AI verification, Anchor escrow, automatic payout release, and a NestJS backend are not currently shipped and are only part of this grant-funded roadmap.

**Personal X Profile**

> REQUIRED BEFORE SUBMIT: https://x.com/<handle>

**Personal GitHub Profile**

> https://github.com/mauyaa

**Colosseum Crowdedness Score**

> REQUIRED BEFORE SUBMIT: Generate the WEZA score at https://colosseum.com/copilot, upload the screenshot to Google Drive with link viewing enabled, and paste its public link here.

**AI Session Transcript**

> Upload `codex-session-redacted.jsonl` from this folder to Google Drive and paste the public Drive link into the form. The transcript was redacted to remove credentials and secrets before upload.

## Step 3: Goals and Milestones

**Milestone 1: Verification schema and evaluation fixtures - June 19, 2026**

> Define versioned milestone requirements, accepted evidence types, cited finding format, confidence model, recommendation states, and explicit human-review requirements. Ship automated schema validation tests and an initial labeled evaluation fixture set.

**Milestone 2: AI verification agent and evaluation report - June 30, 2026**

> Build an agent that reviews submitted evidence against milestone requirements and returns structured, cited findings without making the final approval decision. Produce an accuracy report, documented failure cases, and guardrail tests.

**Milestone 3: Human certifier review policy and audit trail - July 10, 2026**

> Add certifier UI for reviewing agent findings, accepting or overriding recommendations, and signing the final decision. Persist the complete evidence-to-agent-to-certifier audit trail and test all authorization paths.

**Milestone 4: Anchor escrow program on devnet - July 24, 2026**

> Build and test an owner-funded milestone escrow program with policy-controlled release after the required human approval. Deliver the devnet program ID, integration tests, security checklist, and Explorer transactions.

**Milestone 5: Pilot readiness - July 31, 2026**

> Complete monitoring, failure recovery, security review, end-to-end agent-to-contract tests, deployment documentation, and a production-pilot demo workflow.

**Primary KPI**

> Achieve at least 80% agreement between the AI agent's recommendations and certifier-labeled outcomes across a minimum 100-case evaluation set, while recording a human certifier decision for 100% of payout-eligible milestones and allowing zero agent-only payout releases.

**Final Tranche Acknowledgement**

> I understand that the final tranche requires the live project URL, GitHub repository, and AI coding subscription receipts totaling $200.

## Final Pre-Submission Checks

- Replace the TG username, personal Solana wallet, and X profile placeholders.
- Confirm or change the July 31, 2026 deadline.
- Add the public Google Drive link for the redacted Codex transcript.
- Add the public Google Drive link for the Colosseum Crowdedness Score screenshot.
- Confirm every Drive link is viewable without signing in.
- Do not claim that AI verification, Anchor escrow, automatic payout release, or NestJS is already shipped.
