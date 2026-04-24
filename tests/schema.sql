-- Simplified schema for pglite tests. Mirrors supabase/migrations/0001_init.sql
-- but without the auth.users dependency (profiles.id is a plain uuid generated
-- by the test harness). RLS and the handle_new_user trigger live in the real
-- migrations and are exercised in the deployed environment.

create table if not exists organizations (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key,
  org_id text not null references organizations(id),
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('owner','certifier','contractor')),
  wallet_address text,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id text primary key,
  org_id text not null references organizations(id),
  name text not null,
  code text not null,
  owner_id uuid not null references profiles(id),
  certifier_id uuid not null references profiles(id),
  contractor_id uuid not null references profiles(id),
  contract_value_usdc numeric(18,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists milestones (
  id text primary key default ('mil_' || md5(random()::text)),
  project_id text not null references projects(id),
  sequence integer not null,
  title text not null,
  scope text not null default '',
  payout_amount_usdc numeric(18,2) not null default 0,
  status text not null default 'awaiting_submission'
    check (status in ('awaiting_submission','under_review','approved','disputed','payout_triggered','settled')),
  payout_status text not null default 'not_ready'
    check (payout_status in ('not_ready','ready','triggered','confirmed','failed','held')),
  payout_tx_signature text,
  payout_triggered_at timestamptz,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists submissions (
  id text primary key default ('sub_' || md5(random()::text)),
  milestone_id text not null unique references milestones(id),
  contractor_id uuid not null references profiles(id),
  status text not null default 'draft'
    check (status in ('draft','submitted','under_review','revision_requested','resubmitted','approved','rejected')),
  current_version integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists submission_versions (
  id text primary key default ('sv_' || md5(random()::text)),
  submission_id text not null references submissions(id),
  version integer not null,
  title text not null,
  note text not null default '',
  file_name text not null,
  file_sha256 text not null,
  file_size_bytes bigint not null default 0,
  storage_key text,
  submitted_by uuid not null references profiles(id),
  submitted_at timestamptz not null default now(),
  unique (submission_id, version)
);

create table if not exists review_comments (
  id text primary key default ('cmt_' || md5(random()::text)),
  submission_id text not null references submissions(id),
  version integer not null,
  author_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists approval_decisions (
  id text primary key default ('dec_' || md5(random()::text)),
  submission_id text not null references submissions(id),
  version integer not null,
  certifier_id uuid not null references profiles(id),
  action text not null check (action in ('request_revision','approve','reject')),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists payout_instructions (
  id text primary key default ('po_' || md5(random()::text)),
  milestone_id text not null references milestones(id),
  amount_usdc numeric(18,2) not null,
  recipient_wallet text not null,
  status text not null default 'ready'
    check (status in ('not_ready','ready','triggered','confirmed','failed','held')),
  tx_signature text,
  network text not null default 'solana-devnet',
  triggered_by uuid references profiles(id),
  triggered_at timestamptz,
  confirmed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id text primary key default ('aud_' || md5(random()::text)),
  org_id text not null references organizations(id),
  project_id text references projects(id),
  milestone_id text references milestones(id),
  submission_id text references submissions(id),
  actor_id uuid references profiles(id),
  actor_role text,
  actor_name text,
  action text not null,
  message text not null,
  tx_signature text,
  created_at timestamptz not null default now()
);
