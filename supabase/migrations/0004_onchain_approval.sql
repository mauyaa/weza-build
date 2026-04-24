-- Make certifier approval load-bearing on Solana.
alter table milestones
  add column if not exists approval_tx_signature text,
  add column if not exists approval_pda text,
  add column if not exists approval_network text,
  add column if not exists approval_recorded_at timestamptz;

alter table approval_decisions
  add column if not exists approval_tx_signature text,
  add column if not exists approval_pda text,
  add column if not exists approval_network text,
  add column if not exists approval_recorded_at timestamptz;

alter table payout_instructions
  add column if not exists approval_tx_signature text;

create index if not exists idx_milestones_approval_pda on milestones(approval_pda);
create index if not exists idx_decisions_approval_tx on approval_decisions(approval_tx_signature);
